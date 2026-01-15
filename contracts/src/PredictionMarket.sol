// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPredictionMarket.sol";

/**
 * @title PredictionMarket
 * @notice A single prediction market with binary outcomes (Yes/No)
 * @dev Uses a simplified Constant Product Market Maker (CPMM) for pricing
 */
contract PredictionMarket is IPredictionMarket, ReentrancyGuard {
    // Market state
    string public question;
    string public category;
    uint256 public endTime;
    uint256 public resolutionTime;
    address public resolver;
    bool public resolved;
    bool public outcome;

    // Pool state
    uint256 public totalYesShares;
    uint256 public totalNoShares;
    uint256 public totalPool;

    // Initial liquidity constant (prevents division by zero)
    uint256 public constant INITIAL_SHARES = 1e18;

    // Precision for price calculations
    uint256 public constant PRECISION = 1e18;

    // User positions
    mapping(address => uint256) public yesSharesOf;
    mapping(address => uint256) public noSharesOf;
    mapping(address => bool) public hasClaimed;

    // Errors
    error MarketEnded();
    error MarketNotEnded();
    error MarketNotResolved();
    error MarketAlreadyResolved();
    error OnlyResolver();
    error ResolutionTooEarly();
    error InsufficientShares();
    error InsufficientPayout();
    error SlippageExceeded();
    error AlreadyClaimed();
    error NoWinnings();
    error InvalidAmount();

    modifier onlyResolver() {
        if (msg.sender != resolver) revert OnlyResolver();
        _;
    }

    modifier marketActive() {
        if (block.timestamp >= endTime) revert MarketEnded();
        _;
    }

    modifier marketEnded() {
        if (block.timestamp < endTime) revert MarketNotEnded();
        _;
    }

    modifier marketResolved() {
        if (!resolved) revert MarketNotResolved();
        _;
    }

    constructor(
        string memory _question,
        string memory _category,
        uint256 _endTime,
        uint256 _resolutionTime,
        address _resolver
    ) payable {
        question = _question;
        category = _category;
        endTime = _endTime;
        resolutionTime = _resolutionTime;
        resolver = _resolver;

        // Initialize with equal shares (50/50 odds)
        totalYesShares = INITIAL_SHARES;
        totalNoShares = INITIAL_SHARES;

        // Add initial liquidity if provided
        if (msg.value > 0) {
            totalPool = msg.value;
        }
    }

    /**
     * @notice Buy shares for Yes or No outcome
     * @param isYes True for Yes shares, false for No shares
     * @param minShares Minimum shares expected (slippage protection)
     */
    function buyShares(bool isYes, uint256 minShares) external payable nonReentrant marketActive {
        if (msg.value == 0) revert InvalidAmount();

        uint256 shares = calculateShares(isYes, msg.value);
        if (shares < minShares) revert SlippageExceeded();

        totalPool += msg.value;

        if (isYes) {
            totalYesShares += shares;
            yesSharesOf[msg.sender] += shares;
        } else {
            totalNoShares += shares;
            noSharesOf[msg.sender] += shares;
        }

        emit SharesPurchased(msg.sender, isYes, shares, msg.value);
    }

    /**
     * @notice Sell shares back to the pool
     * @param isYes True for Yes shares, false for No shares
     * @param shares Number of shares to sell
     * @param minPayout Minimum payout expected (slippage protection)
     */
    function sellShares(bool isYes, uint256 shares, uint256 minPayout) external nonReentrant marketActive {
        if (shares == 0) revert InvalidAmount();

        if (isYes) {
            if (yesSharesOf[msg.sender] < shares) revert InsufficientShares();
        } else {
            if (noSharesOf[msg.sender] < shares) revert InsufficientShares();
        }

        uint256 payout = calculatePayout(isYes, shares);
        if (payout < minPayout) revert SlippageExceeded();
        if (payout > totalPool) revert InsufficientPayout();

        totalPool -= payout;

        if (isYes) {
            totalYesShares -= shares;
            yesSharesOf[msg.sender] -= shares;
        } else {
            totalNoShares -= shares;
            noSharesOf[msg.sender] -= shares;
        }

        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "Transfer failed");

        emit SharesSold(msg.sender, isYes, shares, payout);
    }

    /**
     * @notice Get current price for Yes or No shares
     * @param isYes True for Yes price, false for No price
     * @return Price in wei (1e18 = 100%)
     */
    function getPrice(bool isYes) public view returns (uint256) {
        uint256 total = totalYesShares + totalNoShares;
        if (total == 0) return PRECISION / 2; // 50% if no shares

        if (isYes) {
            // Yes price = No shares / Total shares
            return (totalNoShares * PRECISION) / total;
        } else {
            // No price = Yes shares / Total shares
            return (totalYesShares * PRECISION) / total;
        }
    }

    /**
     * @notice Calculate shares received for a given amount
     * @param isYes True for Yes shares, false for No shares
     * @param amount Amount in wei
     * @return Number of shares
     */
    function calculateShares(bool isYes, uint256 amount) public view returns (uint256) {
        uint256 price = getPrice(isYes);
        if (price == 0) return 0;

        // Shares = Amount / Price
        // With some bonus for adding liquidity (simplified model)
        return (amount * PRECISION) / price;
    }

    /**
     * @notice Calculate payout for selling shares
     * @param isYes True for Yes shares, false for No shares
     * @param shares Number of shares
     * @return Payout in wei
     */
    function calculatePayout(bool isYes, uint256 shares) public view returns (uint256) {
        uint256 price = getPrice(isYes);
        // Payout = Shares * Price (with slight discount for selling)
        uint256 basePayout = (shares * price) / PRECISION;
        // Apply 1% fee for selling
        return (basePayout * 99) / 100;
    }

    /**
     * @notice Resolve the market with final outcome
     * @param _outcome True if Yes won, false if No won
     */
    function resolve(bool _outcome) external onlyResolver marketEnded {
        if (resolved) revert MarketAlreadyResolved();
        if (block.timestamp < resolutionTime) revert ResolutionTooEarly();

        resolved = true;
        outcome = _outcome;

        emit MarketResolved(_outcome);
    }

    /**
     * @notice Claim winnings after market resolution
     */
    function claimWinnings() external nonReentrant marketResolved {
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();

        uint256 winningShares = outcome ? yesSharesOf[msg.sender] : noSharesOf[msg.sender];
        if (winningShares == 0) revert NoWinnings();

        hasClaimed[msg.sender] = true;

        // Calculate payout: proportional share of the total pool
        uint256 totalWinningShares = outcome ? totalYesShares : totalNoShares;
        uint256 payout = (winningShares * totalPool) / totalWinningShares;

        (bool success, ) = msg.sender.call{value: payout}("");
        require(success, "Transfer failed");

        emit WinningsClaimed(msg.sender, payout);
    }

    /**
     * @notice Get user's position in the market
     * @param user Address to query
     * @return yesShares Number of Yes shares
     * @return noShares Number of No shares
     */
    function getPosition(address user) external view returns (uint256 yesShares, uint256 noShares) {
        return (yesSharesOf[user], noSharesOf[user]);
    }

    /**
     * @notice Get all market information
     * @return MarketInfo struct with all market data
     */
    function getMarketInfo() external view returns (MarketInfo memory) {
        return MarketInfo({
            question: question,
            category: category,
            endTime: endTime,
            resolutionTime: resolutionTime,
            resolver: resolver,
            resolved: resolved,
            outcome: outcome,
            totalYesShares: totalYesShares,
            totalNoShares: totalNoShares,
            totalPool: totalPool
        });
    }

    /**
     * @notice Check if market is still active for betting
     */
    function isActive() external view returns (bool) {
        return block.timestamp < endTime && !resolved;
    }

    /**
     * @notice Get time remaining until betting ends
     */
    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= endTime) return 0;
        return endTime - block.timestamp;
    }

    // Allow contract to receive MNT
    receive() external payable {
        totalPool += msg.value;
    }
}
