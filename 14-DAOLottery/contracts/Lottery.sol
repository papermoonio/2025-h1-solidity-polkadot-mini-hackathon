// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Define interfaces for RewardToken and Governance
interface IRewardToken {
    function mint(address to, uint256 amount) external;
}

interface IGovernance {
    function getProposalFinlized(uint8 _proposalId) external view returns (bool);
    function getEligibleForLottery(uint8 _proposalId) external view returns (address[] memory);
    function rewardVoter(address _voter, uint8 _amount) external;
}

contract Lottery {

    address public owner;
    IRewardToken public rewardToken;
    IGovernance public governance;

    // reward record
    mapping(uint => address) public proposalWinner;

    mapping(uint => bool) public hasClaimed;
    uint public rewardAmount;
    bool public initialized; // Flag to prevent re-initialization

    event Initialized(address indexed initializer);

    constructor() {}

    function initialize(address _rewardToken, address _governance) external {
        require(!initialized, "Contract already initialized");
        owner = msg.sender;
        rewardToken = IRewardToken(_rewardToken);
        governance = IGovernance(_governance);
        rewardAmount = 100;
        initialized = true;
        emit Initialized(msg.sender);
    }

    function drawWinner(uint8 _proposalId) external onlyOwner(){
        // check if proposal is finalized
        require(governance.getProposalFinlized(_proposalId),"Proposal not finalized");
        // check if there are eligible voters
        address[] memory eligibleVoters = governance.getEligibleForLottery(_proposalId);
        require(eligibleVoters.length > 0, "No eligible voters");

        // MVP: 安全性低，后期可以升级使用chainLink 的随机数
        uint winnerIndex = uint256(
            keccak256(abi.encodePacked(block.timestamp,blockhash(block.number-1)))
        )% eligibleVoters.length;
        // update winner
        address winner = eligibleVoters[winnerIndex];
        _setWinner(_proposalId,winner);
    }

    // pull over push => pull: 用户主动领取，push: 智能合约主动推送
    // 应对DOS攻击，用户主动领取，可以避免被攻击者通过合约调用来抢占奖励
    // 虽然只有一个用户可以领取奖励，但是攻击者可以利用gasPrice来抢占奖励，导致攻击者可以抢占奖励
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    function claimReward(uint8 _proposalId) external {
        address winner = _getWinner(_proposalId);
        require(winner == msg.sender, "Not the winner");

        hasClaimed[_proposalId] = true;

        rewardToken.mint(winner,rewardAmount);
        governance.rewardVoter(winner, 11);
    }

    // getter & setter functions
    function setGovernanceContract(address _governance) external onlyOwner {
        governance = IGovernance(_governance);
    }

    function setRewardToken(address _rewardToken) external onlyOwner {
        rewardToken = IRewardToken(_rewardToken);
    }

    function setRewardAmount(uint _rewardAmount) external onlyOwner {
        rewardAmount = _rewardAmount;
    }

    function _setWinner(uint8 _proposalId,address _winner)internal{
        proposalWinner[_proposalId] = _winner;
    }

    function _getWinner(uint8 _proposalId) public view returns(address){
        return proposalWinner[_proposalId];
    }

    function getCliaimed(uint8 _proposalId) external view returns(bool){
        return hasClaimed[_proposalId];
    }
}