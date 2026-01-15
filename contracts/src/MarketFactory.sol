// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PredictionMarket.sol";

/**
 * @title MarketFactory
 * @notice Factory contract to create and track prediction markets
 */
contract MarketFactory is Ownable {
    // Array of all created markets
    address[] public markets;

    // Mapping from category to market addresses
    mapping(string => address[]) public marketsByCategory;

    // Mapping to check if an address is a valid market
    mapping(address => bool) public isMarket;

    // Market creation fee (can be updated by owner)
    uint256 public creationFee;

    // Minimum initial liquidity required
    uint256 public minInitialLiquidity = 0.01 ether;

    // Events
    event MarketCreated(
        address indexed marketAddress,
        string question,
        string category,
        address indexed creator,
        uint256 endTime,
        uint256 resolutionTime
    );
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event MinLiquidityUpdated(uint256 oldMin, uint256 newMin);

    // Errors
    error InsufficientFee();
    error InsufficientLiquidity();
    error InvalidEndTime();
    error InvalidResolutionTime();
    error EmptyQuestion();

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create a new prediction market
     * @param question The question for the market
     * @param category The category of the market
     * @param endTime When betting ends
     * @param resolutionTime When the market can be resolved
     * @param resolver Address that can resolve the market
     * @return marketAddress The address of the new market
     */
    function createMarket(
        string calldata question,
        string calldata category,
        uint256 endTime,
        uint256 resolutionTime,
        address resolver
    ) external payable returns (address marketAddress) {
        // Validation
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (endTime <= block.timestamp) revert InvalidEndTime();
        if (resolutionTime < endTime) revert InvalidResolutionTime();

        uint256 liquidity = msg.value - creationFee;
        if (msg.value < creationFee) revert InsufficientFee();
        if (liquidity < minInitialLiquidity) revert InsufficientLiquidity();

        // Create new market with initial liquidity
        PredictionMarket market = new PredictionMarket{value: liquidity}(
            question,
            category,
            endTime,
            resolutionTime,
            resolver
        );

        marketAddress = address(market);
        markets.push(marketAddress);
        marketsByCategory[category].push(marketAddress);
        isMarket[marketAddress] = true;

        emit MarketCreated(
            marketAddress,
            question,
            category,
            msg.sender,
            endTime,
            resolutionTime
        );

        return marketAddress;
    }

    /**
     * @notice Get all markets
     * @return Array of market addresses
     */
    function getMarkets() external view returns (address[] memory) {
        return markets;
    }

    /**
     * @notice Get markets by category
     * @param category The category to filter by
     * @return Array of market addresses in the category
     */
    function getMarketsByCategory(string calldata category) external view returns (address[] memory) {
        return marketsByCategory[category];
    }

    /**
     * @notice Get active markets (not yet ended)
     * @return Array of active market addresses
     */
    function getActiveMarkets() external view returns (address[] memory) {
        uint256 activeCount = 0;

        // First pass: count active markets
        for (uint256 i = 0; i < markets.length; i++) {
            PredictionMarket market = PredictionMarket(payable(markets[i]));
            if (block.timestamp < market.endTime() && !market.resolved()) {
                activeCount++;
            }
        }

        // Second pass: populate array
        address[] memory activeMarkets = new address[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < markets.length; i++) {
            PredictionMarket market = PredictionMarket(payable(markets[i]));
            if (block.timestamp < market.endTime() && !market.resolved()) {
                activeMarkets[index] = markets[i];
                index++;
            }
        }

        return activeMarkets;
    }

    /**
     * @notice Get resolved markets
     * @return Array of resolved market addresses
     */
    function getResolvedMarkets() external view returns (address[] memory) {
        uint256 resolvedCount = 0;

        for (uint256 i = 0; i < markets.length; i++) {
            PredictionMarket market = PredictionMarket(payable(markets[i]));
            if (market.resolved()) {
                resolvedCount++;
            }
        }

        address[] memory resolvedMarkets = new address[](resolvedCount);
        uint256 index = 0;
        for (uint256 i = 0; i < markets.length; i++) {
            PredictionMarket market = PredictionMarket(payable(markets[i]));
            if (market.resolved()) {
                resolvedMarkets[index] = markets[i];
                index++;
            }
        }

        return resolvedMarkets;
    }

    /**
     * @notice Get total number of markets
     * @return Number of markets created
     */
    function getMarketsCount() external view returns (uint256) {
        return markets.length;
    }

    /**
     * @notice Update market creation fee
     * @param newFee New fee amount in wei
     */
    function setCreationFee(uint256 newFee) external onlyOwner {
        uint256 oldFee = creationFee;
        creationFee = newFee;
        emit CreationFeeUpdated(oldFee, newFee);
    }

    /**
     * @notice Update minimum initial liquidity requirement
     * @param newMin New minimum amount in wei
     */
    function setMinInitialLiquidity(uint256 newMin) external onlyOwner {
        uint256 oldMin = minInitialLiquidity;
        minInitialLiquidity = newMin;
        emit MinLiquidityUpdated(oldMin, newMin);
    }

    /**
     * @notice Withdraw accumulated fees
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Transfer failed");
    }

    // Allow contract to receive MNT
    receive() external payable {}
}
