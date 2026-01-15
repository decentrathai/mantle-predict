import { ethers } from "hardhat";

// Already deployed
const FACTORY_ADDRESS = "0xa91FcC187e67118fdFAe556A885Bb8695408F062";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Continuing deployment with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MNT");

  // Get existing factory
  const factory = await ethers.getContractAt("MarketFactory", FACTORY_ADDRESS);
  console.log("\nUsing existing MarketFactory:", FACTORY_ADDRESS);

  // Deploy PriceOracle
  console.log("\n1. Deploying PriceOracle...");
  const Oracle = await ethers.getContractFactory("PriceOracle");
  const oracle = await Oracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("   PriceOracle deployed to:", oracleAddress);

  // Create sample markets
  console.log("\n2. Creating sample markets...");

  const currentTime = Math.floor(Date.now() / 1000);
  const oneMonth = 30 * 24 * 60 * 60;
  const twoMonths = 60 * 24 * 60 * 60;
  const threeMonths = 90 * 24 * 60 * 60;

  const initialLiquidity = ethers.parseEther("0.1");

  // Market 1: Gold
  console.log("   Creating Gold market...");
  const tx1 = await factory.createMarket(
    "Will gold exceed $3000 by Dec 31, 2025?",
    "Commodities",
    currentTime + oneMonth,
    currentTime + oneMonth + 86400,
    deployer.address,
    { value: initialLiquidity }
  );
  const receipt1 = await tx1.wait();
  const event1 = receipt1?.logs.find(
    (log) => {
      try {
        return factory.interface.parseLog(log as any)?.name === "MarketCreated";
      } catch { return false; }
    }
  );
  const market1Address = factory.interface.parseLog(event1 as any)?.args?.marketAddress;
  console.log("   Gold market deployed to:", market1Address);

  // Market 2: Treasury Yield
  console.log("   Creating Treasury Yield market...");
  const tx2 = await factory.createMarket(
    "Will US 10Y Treasury yield stay below 5% in Q1 2026?",
    "Bonds",
    currentTime + twoMonths,
    currentTime + twoMonths + 86400,
    deployer.address,
    { value: initialLiquidity }
  );
  const receipt2 = await tx2.wait();
  const event2 = receipt2?.logs.find(
    (log) => {
      try {
        return factory.interface.parseLog(log as any)?.name === "MarketCreated";
      } catch { return false; }
    }
  );
  const market2Address = factory.interface.parseLog(event2 as any)?.args?.marketAddress;
  console.log("   Treasury market deployed to:", market2Address);

  // Market 3: Bitcoin ETF
  console.log("   Creating Bitcoin ETF market...");
  const tx3 = await factory.createMarket(
    "Will Bitcoin ETF total AUM exceed $100B by March 2026?",
    "Crypto",
    currentTime + threeMonths,
    currentTime + threeMonths + 86400,
    deployer.address,
    { value: initialLiquidity }
  );
  const receipt3 = await tx3.wait();
  const event3 = receipt3?.logs.find(
    (log) => {
      try {
        return factory.interface.parseLog(log as any)?.name === "MarketCreated";
      } catch { return false; }
    }
  );
  const market3Address = factory.interface.parseLog(event3 as any)?.args?.marketAddress;
  console.log("   Bitcoin ETF market deployed to:", market3Address);

  // Summary
  console.log("\n========================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("========================================");
  console.log(`MarketFactory: ${FACTORY_ADDRESS}`);
  console.log(`PriceOracle:   ${oracleAddress}`);
  console.log("\nSample Markets:");
  console.log(`  1. Gold:         ${market1Address}`);
  console.log(`  2. Treasury:     ${market2Address}`);
  console.log(`  3. Bitcoin ETF:  ${market3Address}`);
  console.log("========================================");

  // Output for frontend config
  console.log("\n// Copy to frontend/lib/contracts.ts:");
  console.log(`export const CONTRACTS = {
  FACTORY: "${FACTORY_ADDRESS}" as \`0x\${string}\`,
  ORACLE: "${oracleAddress}" as \`0x\${string}\`,
  MARKETS: [
    "${market1Address}",
    "${market2Address}",
    "${market3Address}",
  ] as \`0x\${string}\`[],
} as const;`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
