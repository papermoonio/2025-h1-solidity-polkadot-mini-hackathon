// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PallasWallet
 * @notice 结合了多签验证和时间锁的安全恢复钱包
 * @dev 主要功能：
 *   - 守护人执行恢复请求（多签，时间锁延迟执行）
 *   - 恢复后资产迁移接口
 *   - 守护人管理（添加/移除）
 */
interface IPallasGuardians {
    /**
     * @dev 检查地址是否为守护人
     * @param _addr 待检查地址
     * @return 是否为守护人
     */
    function isGuardian(address _addr) external view returns (bool);

    /**
     * @dev 获取所有守护人地址
     * @return 守护人地址数组
     */
    function getAllGuardians() external view returns (address[] memory);

    /**
     * @dev 添加守护人
     * @param _guardian 要添加的守护人地址
     */
    function addGuardian(address _guardian) external;
    
    /**
     * @dev 移除守护人
     * @param _guardian 要移除的守护人地址
     */
    function removeGuardian(address _guardian) external;

    /**
     * @dev 获取守护人数量
     * @return 守护人数量
     */
    function getGuardiansCount() external view returns (uint256);
}