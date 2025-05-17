// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IPallasGuardians.sol";
import "./PallasGuardians.sol";
import "hardhat/console.sol";

/**
 * @title PallasWallet
 * @notice 结合了多签验证和时间锁的安全恢复钱包
 * @dev 主要功能：
 *   - 创建钱包（可指定多个守护人）
 *   - 钱包的基本转账&查询功能
 *   - 钱包拥有者发起恢复
 *   - 守护人执行恢复请求（多签，时间锁延迟执行）
 *   - 恢复后资产迁移接口
 *   - 守护人管理（添加/移除）
 */
contract PallasWallet {
    // 事件定义
    event Deposit(address indexed sender, uint256 amount);
    event RecoveryRequested(address indexed newOwner, uint256 executeAfter);
    event RecoveryExecuted(address indexed oldOwner, address indexed newOwner);
    event RecoveryCancelled(address indexed newOwner);
    
    
    address public owner;
    uint256 public constant RECOVERY_DELAY = 2 days;//锁定时间
    uint256 public constant MAX_REQUIRED_SIGNATURES = 5; //守护人上限

    // 恢复相关状态
    struct Recovery {
        address newOwner;
        uint256 executeAfter;
        mapping(address => bool) approvals;
        uint256 approvalCount;
    }
    Recovery public pendingRecovery;
    IPallasGuardians public pallasGuardians;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }
    
    modifier onlyGuardian() {
        require(pallasGuardians.isGuardian(msg.sender), "Caller is not a guardian");
        _;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
    
    /**
     * @dev 构造函数，初始化钱包
     * @param _owner 钱包拥有者地址
     * @param _guardianAddr 守护人地址
     */
    constructor(
        address _owner,
        address _guardianAddr
    ) {
        require(_owner != address(0), "Invalid owner address");
        owner = _owner;
        pallasGuardians = IPallasGuardians(_guardianAddr); 
    }

    /**
     * @dev 获取可恢复守护人数量（超过半数守护人同意即可恢复） 
     */
    function getRecoveryThreshold() public view returns (uint256) {
        return (pallasGuardians.getAllGuardians().length / 2) + 1;
    }   
    
    /**
     * @dev 发起恢复请求
     * @param _newOwner 新的钱包地址
     */
    function requestRecovery(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        require(pendingRecovery.newOwner == address(0), "Recovery already in progress");
        
        pendingRecovery.newOwner = _newOwner;
        pendingRecovery.executeAfter = block.timestamp + RECOVERY_DELAY;
        pendingRecovery.approvalCount = 0;
        
        emit RecoveryRequested(_newOwner, pendingRecovery.executeAfter);
    }
    
    /**
     * @dev 守护人批准恢复请求
     */
    function approveRecovery() external onlyGuardian {
        require(pendingRecovery.newOwner != address(0), "No active recovery");
        require(!pendingRecovery.approvals[msg.sender], "Already approved");
        require(block.timestamp >= pendingRecovery.executeAfter, "Recovery delay not passed");
        require(pendingRecovery.approvalCount <= MAX_REQUIRED_SIGNATURES, "Approval count exceeds guardians");

        pendingRecovery.approvals[msg.sender] = true;
        pendingRecovery.approvalCount++;
        
        if(pendingRecovery.approvalCount >= getRecoveryThreshold()){
            _executeRecovery();
        }
    }
    
    /**
     * @dev 执行恢复
     */
    function _executeRecovery() internal {
        require(pendingRecovery.approvalCount >= getRecoveryThreshold(), "Not enough approvals");
        require(block.timestamp >= pendingRecovery.executeAfter, "Recovery delay not passed");
        
        address oldOwner = owner;
        address newOwner = pendingRecovery.newOwner;
        //转移权限
        owner = newOwner;
        //转移资产
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) 
            withdraw(newOwner,ethBalance);
        
        emit RecoveryExecuted(oldOwner, newOwner);
    }

    /**
     * @dev 转移资产
     */
     function withdraw(address _newWallet,uint256 ethBalance) internal{
        require(_newWallet != address(0), "Invalid new wallet");
        (bool success, ) = _newWallet.call{value: ethBalance}("");
        require(success, "ETH Transfer failed");
    }

    /**
    * @dev 取消恢复请求
    */
    function cancelRecovery() external onlyOwner {
        require(pendingRecovery.newOwner != address(0), "No active recovery");
        
        // 重置恢复状态
        address newOwner = pendingRecovery.newOwner;
        pendingRecovery.newOwner = address(0);
        pendingRecovery.executeAfter = 0;
        pendingRecovery.approvalCount = 0;
        
        // 清除所有批准
        for (uint256 i = 0; i < pallasGuardians.getAllGuardians().length; i++) {
            if (pendingRecovery.approvals[pallasGuardians.getAllGuardians()[i]]) {
                pendingRecovery.approvals[pallasGuardians.getAllGuardians()[i]] = false;
            }
        }
        emit RecoveryCancelled(newOwner);
    }

    /**
     * @dev 覆盖时间(仅用于测试)
     * @param newTime 更新后的时间
     */
    function setMockTime(uint256 newTime) external {
        require(msg.sender == owner, "Not owner");
        pendingRecovery.executeAfter = newTime; 
    }

    /**
     * @dev 获取守护者实例
     * @return 守护者实例
     */
    function getPallasGuardians() external view returns (IPallasGuardians) {
        return pallasGuardians;
    }

}