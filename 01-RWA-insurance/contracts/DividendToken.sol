// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DividendToken is ERC20, Ownable {
    struct Policy {
        uint256 policyId;
        address policyHolder;
        uint256 premium;
        uint256 coverageAmount;
        uint256 startDate;
        uint256 endDate;
        bool isActive;
        bool isClaimed;
    }

    uint256 public policyCount;
    mapping(uint256 => Policy) public policies;
    mapping(address => uint256[]) public policyHolders;

    // 添加代币持有者跟踪
    mapping(address => bool) private _tokenHolders;
    address[] private _tokenHoldersList;

    event PolicyCreated(uint256 policyId, address policyHolder, uint256 premium, uint256 coverageAmount, uint256 startDate, uint256 endDate);
    event PremiumPaid(uint256 policyId, address policyHolder, uint256 amount);
    event ClaimProcessed(uint256 policyId, address policyHolder, uint256 amount);
    event DividendsDistributed(uint256 amount);

    constructor() ERC20("DividendToken", "DIV") Ownable(msg.sender) {
        // Initialize the ERC20 token with a name and symbol
    }

    function createPolicy(uint256 _premium, uint256 _coverageAmount, uint256 _startDate, uint256 _endDate) public onlyOwner {
        require(_startDate < _endDate, "Start date must be before end date");
        policyCount++;
        policies[policyCount] = Policy(policyCount, msg.sender, _premium, _coverageAmount, _startDate, _endDate, true, false);
        policyHolders[msg.sender].push(policyCount);
        emit PolicyCreated(policyCount, msg.sender, _premium, _coverageAmount, _startDate, _endDate);
    }

    function payPremium(uint256 _policyId) public payable {
        Policy storage policy = policies[_policyId];
        require(policy.policyHolder == msg.sender, "Only policy holder can pay premium");
        require(policy.isActive, "Policy is not active");
        require(msg.value == policy.premium, "Incorrect premium amount");
        emit PremiumPaid(_policyId, msg.sender, msg.value);
    }

    function processClaim(uint256 _policyId) public {
        Policy storage policy = policies[_policyId];
        require(policy.policyHolder == msg.sender, "Only policy holder can claim");
        require(policy.isActive, "Policy is not active");
        require(!policy.isClaimed, "Policy already claimed");
        require(block.timestamp >= policy.startDate && block.timestamp <= policy.endDate, "Policy is not in effect");

        policy.isClaimed = true;
        policy.isActive = false;
        payable(policy.policyHolder).transfer(policy.coverageAmount);
        emit ClaimProcessed(_policyId, msg.sender, policy.coverageAmount);
    }

    // 修改后的股息分配函数
    function distributeDividends() public payable onlyOwner {
        require(msg.value > 0, "Must send ETH to distribute");
        require(totalSupply() > 0, "No tokens minted");
        
        uint256 totalDividend = msg.value;
        uint256 totalTokens = totalSupply();
        
        for (uint i = 0; i < _tokenHoldersList.length; i++) {
            address holder = _tokenHoldersList[i];
            uint256 balance = balanceOf(holder);
            
            if (balance > 0) {
                uint256 dividend = (balance * totalDividend) / totalTokens;
                if (dividend > 0) {
                    payable(holder).transfer(dividend);
                }
            }
        }
        
        emit DividendsDistributed(totalDividend);
    }

    // 重写mint函数以跟踪代币持有者
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
        _addTokenHolder(to);
    }

    // 重写_transfer函数以跟踪代币持有者
    function _transfer(address sender, address recipient, uint256 amount) internal override {
        super._transfer(sender, recipient, amount);
        _addTokenHolder(recipient);
    }

    // 添加代币持有者到列表
    function _addTokenHolder(address holder) private {
        if (!_tokenHolders[holder] && holder != address(0)) {
            _tokenHolders[holder] = true;
            _tokenHoldersList.push(holder);
        }
    }

    function getPoliciesByHolder(address _holder) public view returns (uint256[] memory) {
        return policyHolders[_holder];
    }

    // 获取代币持有者数量
    function getTokenHoldersCount() public view returns (uint256) {
        return _tokenHoldersList.length;
    }

    // 获取特定索引的代币持有者
    function getTokenHolderAtIndex(uint256 index) public view returns (address) {
        require(index < _tokenHoldersList.length, "Index out of bounds");
        return _tokenHoldersList[index];
    }

    // 接收ETH的回退函数
    receive() external payable {}
}