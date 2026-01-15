// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPredictionMarket {
    struct MarketInfo {
        string question;
        string category;
        uint256 endTime;
        uint256 resolutionTime;
        address resolver;
        bool resolved;
        bool outcome;
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 totalPool;
    }

    event SharesPurchased(
        address indexed buyer,
        bool isYes,
        uint256 shares,
        uint256 cost
    );
    event SharesSold(
        address indexed seller,
        bool isYes,
        uint256 shares,
        uint256 payout
    );
    event MarketResolved(bool outcome);
    event WinningsClaimed(address indexed user, uint256 amount);

    function buyShares(bool isYes, uint256 minShares) external payable;
    function sellShares(bool isYes, uint256 shares, uint256 minPayout) external;
    function getPrice(bool isYes) external view returns (uint256);
    function calculateShares(bool isYes, uint256 amount) external view returns (uint256);
    function resolve(bool outcome) external;
    function claimWinnings() external;
    function getPosition(address user) external view returns (uint256 yesShares, uint256 noShares);
    function getMarketInfo() external view returns (MarketInfo memory);
}
