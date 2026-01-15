// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PredictionMarket.sol";

/**
 * @title IPriceFeed
 * @notice Interface for price feed oracles (compatible with Pyth and API3)
 */
interface IPriceFeed {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

/**
 * @title PriceOracle
 * @notice Oracle wrapper for automated market resolution based on price feeds
 */
contract PriceOracle is Ownable {
    // Mapping from asset symbol to price feed address
    mapping(string => address) public priceFeeds;

    // Mapping from market address to its price condition
    struct PriceCondition {
        string asset;
        uint256 threshold;
        bool isAbove; // true = price must be above threshold, false = below
        bool isSet;
    }
    mapping(address => PriceCondition) public marketConditions;

    // Events
    event PriceFeedSet(string indexed asset, address feed);
    event ConditionSet(
        address indexed market,
        string asset,
        uint256 threshold,
        bool isAbove
    );
    event MarketAutoResolved(address indexed market, bool outcome, int256 price);

    // Errors
    error PriceFeedNotSet();
    error ConditionNotSet();
    error MarketNotReady();
    error InvalidFeed();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set price feed address for an asset
     * @param asset Asset symbol (e.g., "GOLD", "BTC", "ETH")
     * @param feed Address of the price feed contract
     */
    function setPriceFeed(string calldata asset, address feed) external onlyOwner {
        if (feed == address(0)) revert InvalidFeed();
        priceFeeds[asset] = feed;
        emit PriceFeedSet(asset, feed);
    }

    /**
     * @notice Set price condition for automatic market resolution
     * @param market Address of the prediction market
     * @param asset Asset symbol to track
     * @param threshold Price threshold (in feed decimals)
     * @param isAbove True if price should be above threshold for Yes outcome
     */
    function setMarketCondition(
        address market,
        string calldata asset,
        uint256 threshold,
        bool isAbove
    ) external onlyOwner {
        if (priceFeeds[asset] == address(0)) revert PriceFeedNotSet();

        marketConditions[market] = PriceCondition({
            asset: asset,
            threshold: threshold,
            isAbove: isAbove,
            isSet: true
        });

        emit ConditionSet(market, asset, threshold, isAbove);
    }

    /**
     * @notice Check if a price condition is met
     * @param asset Asset symbol
     * @param threshold Price threshold
     * @param isAbove True to check if price is above threshold
     * @return met Whether the condition is met
     * @return currentPrice The current price from the feed
     */
    function checkCondition(
        string calldata asset,
        uint256 threshold,
        bool isAbove
    ) external view returns (bool met, int256 currentPrice) {
        address feed = priceFeeds[asset];
        if (feed == address(0)) revert PriceFeedNotSet();

        (, currentPrice, , , ) = IPriceFeed(feed).latestRoundData();

        if (isAbove) {
            met = currentPrice >= int256(threshold);
        } else {
            met = currentPrice <= int256(threshold);
        }
    }

    /**
     * @notice Get current price for an asset
     * @param asset Asset symbol
     * @return price Current price
     * @return decimals Price decimals
     * @return updatedAt Last update timestamp
     */
    function getPrice(string calldata asset)
        external
        view
        returns (int256 price, uint8 decimals, uint256 updatedAt)
    {
        address feed = priceFeeds[asset];
        if (feed == address(0)) revert PriceFeedNotSet();

        (, price, , updatedAt, ) = IPriceFeed(feed).latestRoundData();
        decimals = IPriceFeed(feed).decimals();
    }

    /**
     * @notice Automatically resolve a market based on its price condition
     * @param market Address of the prediction market to resolve
     * @dev Anyone can call this once conditions are met and market is ready
     */
    function autoResolveMarket(address market) external {
        PriceCondition memory condition = marketConditions[market];
        if (!condition.isSet) revert ConditionNotSet();

        PredictionMarket pm = PredictionMarket(payable(market));

        // Check market is ready for resolution
        if (block.timestamp < pm.resolutionTime()) revert MarketNotReady();
        if (pm.resolved()) revert MarketNotReady();

        // Get current price
        address feed = priceFeeds[condition.asset];
        if (feed == address(0)) revert PriceFeedNotSet();

        (, int256 price, , , ) = IPriceFeed(feed).latestRoundData();

        // Determine outcome
        bool outcome;
        if (condition.isAbove) {
            outcome = price >= int256(condition.threshold);
        } else {
            outcome = price <= int256(condition.threshold);
        }

        // Resolve the market (this contract must be the resolver)
        pm.resolve(outcome);

        emit MarketAutoResolved(market, outcome, price);
    }

    /**
     * @notice Check if a market can be auto-resolved
     * @param market Address of the prediction market
     * @return canResolve True if conditions are met for resolution
     * @return currentPrice Current price of the tracked asset
     * @return wouldResolveYes True if resolution would be Yes
     */
    function canAutoResolve(address market)
        external
        view
        returns (bool canResolve, int256 currentPrice, bool wouldResolveYes)
    {
        PriceCondition memory condition = marketConditions[market];
        if (!condition.isSet) return (false, 0, false);

        PredictionMarket pm = PredictionMarket(payable(market));
        if (pm.resolved()) return (false, 0, false);
        if (block.timestamp < pm.resolutionTime()) return (false, 0, false);

        address feed = priceFeeds[condition.asset];
        if (feed == address(0)) return (false, 0, false);

        (, currentPrice, , , ) = IPriceFeed(feed).latestRoundData();

        if (condition.isAbove) {
            wouldResolveYes = currentPrice >= int256(condition.threshold);
        } else {
            wouldResolveYes = currentPrice <= int256(condition.threshold);
        }

        canResolve = true;
    }

    /**
     * @notice Get all price feed addresses
     * @param assets Array of asset symbols
     * @return feeds Array of corresponding feed addresses
     */
    function getPriceFeeds(string[] calldata assets)
        external
        view
        returns (address[] memory feeds)
    {
        feeds = new address[](assets.length);
        for (uint256 i = 0; i < assets.length; i++) {
            feeds[i] = priceFeeds[assets[i]];
        }
    }
}
