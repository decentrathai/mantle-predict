import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { PredictionMarket, MarketFactory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("PredictionMarket", function () {
  let market: PredictionMarket;
  let factory: MarketFactory;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let resolver: SignerWithAddress;

  const QUESTION = "Will gold exceed $3000 by Dec 31, 2025?";
  const CATEGORY = "Commodities";
  const ONE_DAY = 24 * 60 * 60;
  const ONE_WEEK = 7 * ONE_DAY;
  const ONE_ETH = ethers.parseEther("1");
  const INITIAL_LIQUIDITY = ethers.parseEther("0.1");

  beforeEach(async function () {
    [owner, user1, user2, resolver] = await ethers.getSigners();

    // Deploy factory
    const Factory = await ethers.getContractFactory("MarketFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();

    // Create market through factory
    const currentTime = await time.latest();
    const endTime = currentTime + ONE_WEEK;
    const resolutionTime = endTime + ONE_DAY;

    const tx = await factory.createMarket(
      QUESTION,
      CATEGORY,
      endTime,
      resolutionTime,
      resolver.address,
      { value: INITIAL_LIQUIDITY }
    );

    const receipt = await tx.wait();
    const event = receipt?.logs.find(
      (log) => factory.interface.parseLog(log as any)?.name === "MarketCreated"
    );
    const parsedEvent = factory.interface.parseLog(event as any);
    const marketAddress = parsedEvent?.args?.marketAddress;

    market = await ethers.getContractAt("PredictionMarket", marketAddress);
  });

  describe("Market Creation", function () {
    it("should have correct initial state", async function () {
      expect(await market.question()).to.equal(QUESTION);
      expect(await market.category()).to.equal(CATEGORY);
      expect(await market.resolver()).to.equal(resolver.address);
      expect(await market.resolved()).to.be.false;
    });

    it("should have 50/50 initial odds", async function () {
      const yesPrice = await market.getPrice(true);
      const noPrice = await market.getPrice(false);

      // Both should be approximately 0.5 (50%)
      expect(yesPrice).to.equal(ethers.parseEther("0.5"));
      expect(noPrice).to.equal(ethers.parseEther("0.5"));
    });
  });

  describe("Buying Shares", function () {
    it("should allow buying Yes shares", async function () {
      const buyAmount = ethers.parseEther("0.1");

      await expect(
        market.connect(user1).buyShares(true, 0, { value: buyAmount })
      ).to.emit(market, "SharesPurchased");

      const [yesShares, noShares] = await market.getPosition(user1.address);
      expect(yesShares).to.be.gt(0);
      expect(noShares).to.equal(0);
    });

    it("should allow buying No shares", async function () {
      const buyAmount = ethers.parseEther("0.1");

      await expect(
        market.connect(user1).buyShares(false, 0, { value: buyAmount })
      ).to.emit(market, "SharesPurchased");

      const [yesShares, noShares] = await market.getPosition(user1.address);
      expect(yesShares).to.equal(0);
      expect(noShares).to.be.gt(0);
    });

    it("should update prices after purchase", async function () {
      const initialYesPrice = await market.getPrice(true);
      const initialNoPrice = await market.getPrice(false);

      // Buy Yes shares
      await market.connect(user1).buyShares(true, 0, {
        value: ethers.parseEther("0.5")
      });

      const newYesPrice = await market.getPrice(true);
      const newNoPrice = await market.getPrice(false);

      // In CPMM: buying Yes increases Yes pool, decreasing Yes price
      // while increasing No price (inverse relationship)
      expect(newYesPrice).to.not.equal(initialYesPrice);
      expect(newNoPrice).to.be.gt(initialNoPrice);

      // Prices should still sum to approximately 1 (100%)
      const totalPrice = newYesPrice + newNoPrice;
      expect(totalPrice).to.be.closeTo(ethers.parseEther("1"), ethers.parseEther("0.01"));
    });

    it("should revert with slippage protection", async function () {
      const buyAmount = ethers.parseEther("0.1");
      const unrealisticMinShares = ethers.parseEther("1000");

      await expect(
        market.connect(user1).buyShares(true, unrealisticMinShares, {
          value: buyAmount
        })
      ).to.be.revertedWithCustomError(market, "SlippageExceeded");
    });
  });

  describe("Selling Shares", function () {
    beforeEach(async function () {
      // User1 buys some shares first
      await market.connect(user1).buyShares(true, 0, {
        value: ethers.parseEther("0.2")
      });
    });

    it("should allow selling shares", async function () {
      const [initialYesShares] = await market.getPosition(user1.address);
      const sharesToSell = initialYesShares / 2n;

      await expect(
        market.connect(user1).sellShares(true, sharesToSell, 0)
      ).to.emit(market, "SharesSold");

      const [newYesShares] = await market.getPosition(user1.address);
      expect(newYesShares).to.be.lt(initialYesShares);
    });

    it("should revert if insufficient shares", async function () {
      const [yesShares] = await market.getPosition(user1.address);

      await expect(
        market.connect(user1).sellShares(true, yesShares + 1n, 0)
      ).to.be.revertedWithCustomError(market, "InsufficientShares");
    });
  });

  describe("Time Restrictions", function () {
    it("should prevent betting after endTime", async function () {
      // Fast forward past end time
      const endTime = await market.endTime();
      await time.increaseTo(endTime + 1n);

      await expect(
        market.connect(user1).buyShares(true, 0, {
          value: ethers.parseEther("0.1")
        })
      ).to.be.revertedWithCustomError(market, "MarketEnded");
    });

    it("should prevent selling after endTime", async function () {
      // Buy first
      await market.connect(user1).buyShares(true, 0, {
        value: ethers.parseEther("0.1")
      });

      // Fast forward past end time
      const endTime = await market.endTime();
      await time.increaseTo(endTime + 1n);

      const [shares] = await market.getPosition(user1.address);

      await expect(
        market.connect(user1).sellShares(true, shares, 0)
      ).to.be.revertedWithCustomError(market, "MarketEnded");
    });
  });

  describe("Resolution", function () {
    beforeEach(async function () {
      // Users place bets
      await market.connect(user1).buyShares(true, 0, {
        value: ethers.parseEther("0.3")
      });
      await market.connect(user2).buyShares(false, 0, {
        value: ethers.parseEther("0.2")
      });
    });

    it("should allow resolver to resolve market", async function () {
      // Fast forward to resolution time
      const resolutionTime = await market.resolutionTime();
      await time.increaseTo(resolutionTime);

      await expect(market.connect(resolver).resolve(true))
        .to.emit(market, "MarketResolved")
        .withArgs(true);

      expect(await market.resolved()).to.be.true;
      expect(await market.outcome()).to.be.true;
    });

    it("should prevent non-resolver from resolving", async function () {
      const resolutionTime = await market.resolutionTime();
      await time.increaseTo(resolutionTime);

      await expect(
        market.connect(user1).resolve(true)
      ).to.be.revertedWithCustomError(market, "OnlyResolver");
    });

    it("should prevent resolution before resolutionTime", async function () {
      const endTime = await market.endTime();
      await time.increaseTo(endTime + 1n); // Past end but before resolution

      await expect(
        market.connect(resolver).resolve(true)
      ).to.be.revertedWithCustomError(market, "ResolutionTooEarly");
    });

    it("should prevent double resolution", async function () {
      const resolutionTime = await market.resolutionTime();
      await time.increaseTo(resolutionTime);

      await market.connect(resolver).resolve(true);

      await expect(
        market.connect(resolver).resolve(false)
      ).to.be.revertedWithCustomError(market, "MarketAlreadyResolved");
    });
  });

  describe("Claiming Winnings", function () {
    beforeEach(async function () {
      // Users place bets
      await market.connect(user1).buyShares(true, 0, {
        value: ethers.parseEther("0.3")
      });
      await market.connect(user2).buyShares(false, 0, {
        value: ethers.parseEther("0.2")
      });

      // Resolve market (Yes wins)
      const resolutionTime = await market.resolutionTime();
      await time.increaseTo(resolutionTime);
      await market.connect(resolver).resolve(true);
    });

    it("should distribute winnings correctly", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);

      await expect(market.connect(user1).claimWinnings())
        .to.emit(market, "WinningsClaimed");

      const balanceAfter = await ethers.provider.getBalance(user1.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("should prevent double claiming", async function () {
      await market.connect(user1).claimWinnings();

      await expect(
        market.connect(user1).claimWinnings()
      ).to.be.revertedWithCustomError(market, "AlreadyClaimed");
    });

    it("should prevent losers from claiming", async function () {
      // user2 bet on No, which lost
      await expect(
        market.connect(user2).claimWinnings()
      ).to.be.revertedWithCustomError(market, "NoWinnings");
    });

    it("should prevent claiming before resolution", async function () {
      // Create a new market that's not resolved
      const currentTime = await time.latest();
      const tx = await factory.createMarket(
        "Test",
        "Test",
        currentTime + ONE_WEEK,
        currentTime + ONE_WEEK + ONE_DAY,
        resolver.address,
        { value: INITIAL_LIQUIDITY }
      );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log) => factory.interface.parseLog(log as any)?.name === "MarketCreated"
      );
      const parsedEvent = factory.interface.parseLog(event as any);
      const newMarket = await ethers.getContractAt(
        "PredictionMarket",
        parsedEvent?.args?.marketAddress
      );

      await newMarket.connect(user1).buyShares(true, 0, {
        value: ethers.parseEther("0.1")
      });

      await expect(
        newMarket.connect(user1).claimWinnings()
      ).to.be.revertedWithCustomError(newMarket, "MarketNotResolved");
    });
  });
});

describe("MarketFactory", function () {
  let factory: MarketFactory;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("MarketFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  it("should create markets correctly", async function () {
    const currentTime = await time.latest();

    await expect(
      factory.createMarket(
        "Test Question?",
        "Crypto",
        currentTime + 86400,
        currentTime + 86400 * 2,
        owner.address,
        { value: ethers.parseEther("0.1") }
      )
    ).to.emit(factory, "MarketCreated");

    const markets = await factory.getMarkets();
    expect(markets.length).to.equal(1);
  });

  it("should track markets by category", async function () {
    const currentTime = await time.latest();

    await factory.createMarket(
      "Q1",
      "Crypto",
      currentTime + 86400,
      currentTime + 86400 * 2,
      owner.address,
      { value: ethers.parseEther("0.1") }
    );

    await factory.createMarket(
      "Q2",
      "Commodities",
      currentTime + 86400,
      currentTime + 86400 * 2,
      owner.address,
      { value: ethers.parseEther("0.1") }
    );

    const cryptoMarkets = await factory.getMarketsByCategory("Crypto");
    const commodityMarkets = await factory.getMarketsByCategory("Commodities");

    expect(cryptoMarkets.length).to.equal(1);
    expect(commodityMarkets.length).to.equal(1);
  });

  it("should reject markets with insufficient liquidity", async function () {
    const currentTime = await time.latest();

    await expect(
      factory.createMarket(
        "Test",
        "Test",
        currentTime + 86400,
        currentTime + 86400 * 2,
        owner.address,
        { value: ethers.parseEther("0.001") } // Below minimum
      )
    ).to.be.revertedWithCustomError(factory, "InsufficientLiquidity");
  });

  it("should reject markets with invalid times", async function () {
    const currentTime = await time.latest();

    await expect(
      factory.createMarket(
        "Test",
        "Test",
        currentTime - 100, // Past end time
        currentTime + 86400,
        owner.address,
        { value: ethers.parseEther("0.1") }
      )
    ).to.be.revertedWithCustomError(factory, "InvalidEndTime");

    await expect(
      factory.createMarket(
        "Test",
        "Test",
        currentTime + 86400,
        currentTime + 100, // Resolution before end
        owner.address,
        { value: ethers.parseEther("0.1") }
      )
    ).to.be.revertedWithCustomError(factory, "InvalidResolutionTime");
  });
});
