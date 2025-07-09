// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./ProjectToken.sol";
import "../core/PlatformRegistry.sol";

/**
 * @title ProjectOffering
 * @dev Token offering contract for PPP projects
 * @notice Manages the Initial Project Token Offering (IPTO) with whitelist enforcement
 */
contract ProjectOffering is
    Initializable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    struct OfferingInfo {
        uint256 tokenPrice;
        uint256 totalSupply;
        uint256 availableSupply;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 startTime;
        uint256 endTime;
        uint256 softCap;
        uint256 hardCap;
        bool isActive;
        bool isFinalized;
    }

    struct InvestorInfo {
        uint256 totalInvested;
        uint256 tokensAllocated;
        uint256 tokensClaimed;
        bool hasInvested;
    }

    ProjectToken public projectToken;
    PlatformRegistry public platformRegistry;

    OfferingInfo public offeringInfo;
    mapping(address => InvestorInfo) public investors;

    address[] public investorList;
    uint256 public totalFundsRaised;
    uint256 public totalInvestors;
    address public projectTreasury;

    event InvestmentMade(address indexed investor, uint256 amount, uint256 tokens);
    event TokensClaimed(address indexed investor, uint256 amount);
    event OfferingFinalized(uint256 totalRaised, uint256 totalInvestors);
    event OfferingCanceled(string reason);
    event OfferingInfoUpdated();
    event RefundProcessed(address indexed investor, uint256 amount);
    event EmergencyWithdrawal(uint256 amount);

    modifier onlyDuringOffering() {
        require(
            block.timestamp >= offeringInfo.startTime && block.timestamp <= offeringInfo.endTime,
            "Offering not active"
        );
        require(offeringInfo.isActive, "Offering paused");
        _;
    }

    modifier onlyAfterOffering() {
        require(block.timestamp > offeringInfo.endTime || offeringInfo.isFinalized, "Offering still active");
        _;
    }

    modifier onlyAuthorizedInvestor() {
        require(platformRegistry.isInvestorAuthorized(msg.sender), "Not authorized investor");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _projectToken,
        address _platformRegistry,
        address _projectTreasury,
        address _owner,
        uint256 _tokenPrice,
        uint256 _totalSupply,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _softCap,
        uint256 _hardCap
    ) public initializer {
        require(_projectToken != address(0), "Invalid token address");
        require(_platformRegistry != address(0), "Invalid registry address");
        require(_projectTreasury != address(0), "Invalid treasury address");
        require(_owner != address(0), "Invalid owner address");
        require(_tokenPrice > 0, "Invalid token price");
        require(_totalSupply > 0, "Invalid total supply");
        require(_startTime > block.timestamp, "Invalid start time");
        require(_endTime > _startTime, "Invalid end time");
        require(_softCap <= _hardCap, "Invalid caps");

        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        projectToken = ProjectToken(_projectToken);
        platformRegistry = PlatformRegistry(_platformRegistry);
        projectTreasury = _projectTreasury;

        PlatformRegistry.PlatformConfig memory config = platformRegistry.getPlatformConfig();

        offeringInfo = OfferingInfo({
            tokenPrice: _tokenPrice,
            totalSupply: _totalSupply,
            availableSupply: _totalSupply,
            minInvestment: config.minimumInvestment,
            maxInvestment: config.maximumInvestment,
            startTime: _startTime,
            endTime: _endTime,
            softCap: _softCap,
            hardCap: _hardCap,
            isActive: true,
            isFinalized: false
        });
    }

    /**
     * @dev Invest in the project token offering
     */
    function invest() external payable nonReentrant onlyDuringOffering onlyAuthorizedInvestor whenNotPaused {
        require(msg.value > 0, "Investment amount must be greater than 0");
        require(msg.value >= offeringInfo.minInvestment, "Below minimum investment");
        require(
            investors[msg.sender].totalInvested + msg.value <= offeringInfo.maxInvestment,
            "Exceeds maximum investment"
        );
        require(totalFundsRaised + msg.value <= offeringInfo.hardCap, "Exceeds hard cap");

        uint256 tokensToAllocate = (msg.value / offeringInfo.tokenPrice) * 10 ** 18;
        require(tokensToAllocate <= offeringInfo.availableSupply, "Insufficient tokens available");

        // Update investor info
        if (!investors[msg.sender].hasInvested) {
            investors[msg.sender].hasInvested = true;
            investorList.push(msg.sender);
            totalInvestors++;
        }

        investors[msg.sender].totalInvested += msg.value;
        investors[msg.sender].tokensAllocated += tokensToAllocate;

        // Update offering info
        offeringInfo.availableSupply -= tokensToAllocate;
        totalFundsRaised += msg.value;

        // Increment investment count in registry
        platformRegistry.incrementInvestmentCount(msg.sender);

        emit InvestmentMade(msg.sender, msg.value, tokensToAllocate);

        // Auto-finalize if hard cap reached
        if (totalFundsRaised >= offeringInfo.hardCap) {
            _finalizeOffering();
        }
    }

    /**
     * @dev Claim allocated tokens after offering ends
     */
    function claimTokens() external nonReentrant onlyAfterOffering whenNotPaused {
        require(offeringInfo.isFinalized, "Offering not finalized");
        require(investors[msg.sender].hasInvested, "No investment found");
        require(investors[msg.sender].tokensAllocated > investors[msg.sender].tokensClaimed, "No tokens to claim");

        uint256 tokensToTransfer = investors[msg.sender].tokensAllocated - investors[msg.sender].tokensClaimed;
        investors[msg.sender].tokensClaimed = investors[msg.sender].tokensAllocated;

        require(projectToken.transfer(msg.sender, tokensToTransfer), "Token transfer failed");

        emit TokensClaimed(msg.sender, tokensToTransfer);
    }

    /**
     * @dev Finalize the offering (only owner)
     */
    function finalizeOffering() external onlyOwner {
        require(block.timestamp >= offeringInfo.endTime, "Offering not ended");
        require(!offeringInfo.isFinalized, "Already finalized");

        _finalizeOffering();
    }

    /**
     * @dev Internal function to finalize offering
     */
    function _finalizeOffering() internal {
        require(totalFundsRaised >= offeringInfo.softCap, "Soft cap not reached");

        offeringInfo.isFinalized = true;
        offeringInfo.isActive = false;

        // Enable token transfers
        projectToken.enableTransfers();

        // Transfer funds to project treasury
        (bool success, ) = projectTreasury.call{ value: totalFundsRaised }("");
        require(success, "Treasury transfer failed");

        emit OfferingFinalized(totalFundsRaised, totalInvestors);
    }

    /**
     * @dev Cancel offering and enable refunds (only owner)
     * @param _reason Reason for cancellation
     */
    function cancelOffering(string calldata _reason) external onlyOwner {
        require(!offeringInfo.isFinalized, "Already finalized");
        require(bytes(_reason).length > 0, "Reason required");

        offeringInfo.isActive = false;
        offeringInfo.isFinalized = true;

        emit OfferingCanceled(_reason);
    }

    /**
     * @dev Process refund for investor (after cancellation)
     * @param _investor Investor address
     */
    function processRefund(address _investor) external nonReentrant onlyOwner {
        require(!offeringInfo.isActive, "Offering still active");
        require(totalFundsRaised < offeringInfo.softCap, "Soft cap reached");
        require(investors[_investor].hasInvested, "No investment found");
        require(investors[_investor].totalInvested > 0, "Already refunded");

        uint256 refundAmount = investors[_investor].totalInvested;
        investors[_investor].totalInvested = 0;
        investors[_investor].tokensAllocated = 0;

        (bool success, ) = _investor.call{ value: refundAmount }("");
        require(success, "Refund failed");

        emit RefundProcessed(_investor, refundAmount);
    }

    /**
     * @dev Update offering parameters (only owner, before start)
     * @param _tokenPrice New token price
     * @param _startTime New start time
     * @param _endTime New end time
     * @param _softCap New soft cap
     * @param _hardCap New hard cap
     */
    function updateOfferingInfo(
        uint256 _tokenPrice,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _softCap,
        uint256 _hardCap
    ) external onlyOwner {
        require(block.timestamp < offeringInfo.startTime, "Offering already started");
        require(_tokenPrice > 0, "Invalid token price");
        require(_startTime > block.timestamp, "Invalid start time");
        require(_endTime > _startTime, "Invalid end time");
        require(_softCap <= _hardCap, "Invalid caps");

        offeringInfo.tokenPrice = _tokenPrice;
        offeringInfo.startTime = _startTime;
        offeringInfo.endTime = _endTime;
        offeringInfo.softCap = _softCap;
        offeringInfo.hardCap = _hardCap;

        emit OfferingInfoUpdated();
    }

    /**
     * @dev Pause offering
     */
    function pauseOffering() external onlyOwner {
        offeringInfo.isActive = false;
        _pause();
    }

    /**
     * @dev Unpause offering
     */
    function unpauseOffering() external onlyOwner {
        offeringInfo.isActive = true;
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner().call{ value: balance }("");
        require(success, "Emergency withdrawal failed");

        emit EmergencyWithdrawal(balance);
    }

    /**
     * @dev Get investor information
     * @param _investor Investor address
     * @return InvestorInfo Investor details
     */
    function getInvestorInfo(address _investor) external view returns (InvestorInfo memory) {
        return investors[_investor];
    }

    /**
     * @dev Get offering progress
     * @return totalRaised Total funds raised
     * @return totalInvestorsCount Total number of investors
     * @return progressPercent Progress percentage (basis points)
     */
    function getOfferingProgress()
        external
        view
        returns (uint256 totalRaised, uint256 totalInvestorsCount, uint256 progressPercent)
    {
        totalRaised = totalFundsRaised;
        totalInvestorsCount = totalInvestors;
        progressPercent = offeringInfo.hardCap > 0 ? (totalFundsRaised * 10000) / offeringInfo.hardCap : 0;
    }

    /**
     * @dev Get all investors
     * @return address[] Array of investor addresses
     */
    function getAllInvestors() external view returns (address[] memory) {
        return investorList;
    }

    /**
     * @dev Check if offering is active
     * @return bool True if offering is active
     */
    function isOfferingActive() external view returns (bool) {
        return
            offeringInfo.isActive &&
            block.timestamp >= offeringInfo.startTime &&
            block.timestamp <= offeringInfo.endTime &&
            !offeringInfo.isFinalized;
    }

    /**
     * @dev Required by UUPS pattern
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Get offering information
     * @return OfferingInfo Current offering details
     */
    function getOfferingInfo() external view returns (OfferingInfo memory) {
        return offeringInfo;
    }
}
