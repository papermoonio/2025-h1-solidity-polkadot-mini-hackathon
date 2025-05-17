// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IPallasGuardians.sol";

/**
 * @title PallasGuardians
 * @notice 结合了多签验证和时间锁的安全恢复钱包
 * @dev 主要功能：
 *   - 守护人管理（添加/移除）
 */
contract PallasGuardians is IPallasGuardians{
    // 事件定义
    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);
    
    
    address public owner;
    mapping(address => bool) public override isGuardian;
    address[] private guardians;
    uint256 public constant MAX_REQUIRED_SIGNATURES = 5; //守护人上限

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /**
     * @dev 构造函数，初始化钱包
     * @param _owner 钱包拥有者地址
     * @param _guardians 初始守护人列表
     */
    constructor(
        address _owner,
        address[] memory _guardians
    ) {
        require(_owner != address(0), "Invalid owner address");
        require(_guardians.length > 0 && _guardians.length <= MAX_REQUIRED_SIGNATURES, "Invalid required signatures");
        
        owner = _owner;
        for (uint256 i = 0; i < _guardians.length; i++) {
            require(_guardians[i] != address(0), "Invalid guardian address");
            require(!isGuardian[_guardians[i]], "Duplicate guardian");
            
            isGuardian[_guardians[i]] = true;
            guardians.push(_guardians[i]);
            emit GuardianAdded(_guardians[i]);
        }
    }


    /**
     * @dev 添加守护人
     * @param _guardian 要添加的守护人地址
     */
    function addGuardian(address _guardian) external override onlyOwner {
        require(_guardian != address(0), "Invalid guardian address");
        require(!isGuardian[_guardian], "Address is already a guardian");
        
        isGuardian[_guardian] = true;
        guardians.push(_guardian);
        emit GuardianAdded(_guardian);
    }
    
    /**
     * @dev 移除守护人
     * @param _guardian 要移除的守护人地址
     */
    function removeGuardian(address _guardian) external override onlyOwner {
        require(isGuardian[_guardian], "Address is not a guardian");
        
        isGuardian[_guardian] = false;
        
        // 从数组中移除守护人
        for (uint256 i = 0; i < guardians.length; i++) {
            if (guardians[i] == _guardian) {
                guardians[i] = guardians[guardians.length - 1];
                guardians.pop();
                break;
            }
        }
        emit GuardianRemoved(_guardian);
    }

    /**
     * @dev 获取守护人数量
     * @return 守护人数量
     */
    function getGuardiansCount() external override view returns (uint256) {
        return guardians.length;
    }
    
    /**
     * @dev 获取所有守护人地址
     * @return 守护人地址数组
     */
    function getAllGuardians() external override view returns (address[] memory) {
        return guardians;
    }
}