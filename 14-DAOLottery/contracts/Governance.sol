// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./GovToken.sol";
import "./RewardToken.sol";

contract Governance {

    address public owner;
    GovToken public govToken;
    address public lotteryContract;
    uint public FEE;
    bool public initialized; // Flag to prevent re-initialization

    event Initialized(address indexed initializer);

    struct Proposal{
        string description;
        address proposer;
        uint yesVotes;
        uint noVote;
        bool pass;
        bool finalized;
        uint deadline;
        mapping(address => bool) hasVoted;
        mapping(address => bool) voteChoice;
        address [] voters;
    }

    mapping(uint8 => Proposal) public proposals;
    mapping(uint => address[]) public elgibleForLottery;
    uint8 public proposalCount;
    // uint256 public constant VOTING_DURATION = 7 days;

    constructor() {}

    function initialize(address _govToken) external {
        require(!initialized, "Contract already initialized");
        owner = msg.sender;
        govToken = GovToken(_govToken);
        FEE = 10;
        initialized = true;
        emit Initialized(msg.sender);
    }

    event create(address indexed proposer, uint8 indexed proposalId);
    event vote(address indexed voter, uint8 indexed proposalId, bool indexed choice);
    event finalize(uint8 indexed proposalId, bool indexed result);
    event execute(uint8 indexed proposalId);
    event claimGOV(address indexed winner, uint8 indexed proposalId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function createProposal(string memory _desc,uint _duration) external {
        require(govToken.balanceOf(msg.sender) > FEE, "Not enough GOV tokens");

        proposalCount++;
        Proposal storage proposal = proposals[proposalCount];
        proposal.description = _desc;
        proposal.proposer = msg.sender;
        proposal.deadline = block.timestamp + _duration;

        govToken.burnFrom(msg.sender, FEE);

        emit create(msg.sender, proposalCount);
    }

    function voteProposal(uint8 _proposalId, bool _choice) external {
        // avoid fron contract swiping
        require(msg.sender == tx.origin, "Only tx.origin can vote");
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.deadline > block.timestamp, "Voting period has ended");
        require(!proposal.hasVoted[msg.sender], "You have already voted");   
        require(!proposal.finalized, "Proposal has been finalized");
        require(govToken.balanceOf(msg.sender) > 1, "Not enough GOV tokens");
        govToken.burnFrom(msg.sender, 1);

        proposal.hasVoted[msg.sender] = true;
        proposal.voteChoice[msg.sender] = _choice;
        proposal.voters.push(msg.sender);
        if(_choice){
            proposal.yesVotes++;
        }else{
            proposal.noVote++;
        }

        emit vote(msg.sender, _proposalId, _choice);
    }

    function finalizeProposal(uint8 _proposalId) external onlyOwner(){
        Proposal storage proposal = proposals[_proposalId];
        
        require(_proposalId <= proposalCount, "Invalid proposal ID");
        require(proposal.deadline < block.timestamp, "Voting period has not ended");
        require(!proposal.finalized, "Proposal has already been finalized");
        
        proposal.pass = proposal.yesVotes > proposal.noVote;
        for(uint i = 0; i < proposal.voters.length; i++){
            address voter = proposal.voters[i];
            bool choice = proposal.voteChoice[voter];
            if(choice == proposal.pass){
                elgibleForLottery[_proposalId].push(voter);
            }
        }
        proposal.finalized = true;
        emit finalize(_proposalId, proposal.pass);
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function renounceOwnership() public virtual onlyOwner {
        emit OwnershipTransferred(owner, address(0));
        owner = address(0);
    }

    function rewardVoter(address _voter, uint8 _amount) external {
        govToken.mint(_voter, _amount);
    }

    // getter & setter functions
    function getProposal(uint8 _proposalId) external view returns(
        string memory description,
        address proposer,
        uint yesVotes,
        uint noVote,
        bool pass,
        bool finalized,
        uint deadline
    ){
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.description,
            proposal.proposer,
            proposal.yesVotes,
            proposal.noVote,
            proposal.pass,
            proposal.finalized,
            proposal.deadline
        );
    }

    function hasUserVoted(uint8 _proposalId, address _user) external view returns (bool) {
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        return proposals[_proposalId].hasVoted[_user];
    }
    function getVoteChoice(uint8 _proposalId, address _user) external view returns (bool) {
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        require(proposals[_proposalId].hasVoted[_user], "User has not voted");
        return proposals[_proposalId].voteChoice[_user];
    }
    function getProposalCount() external view returns(uint8){
        return proposalCount;
    }

    function setLotteryContract(address _lotteryContract) external onlyOwner {
        lotteryContract = _lotteryContract;
    }

    function getProposalFinlized(uint8 _proposalId)external view returns(bool){
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        return proposals[_proposalId].finalized;
    }

    function getEligibleForLottery(uint8 _proposalId) external view returns(address[] memory){
        require( _proposalId <= proposalCount, "Invalid proposal ID");
        require( proposals[_proposalId].finalized, "Proposal did not finalized");
        return elgibleForLottery[_proposalId];
    }
}