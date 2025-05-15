// 导入 Hardhat Ignition 的 buildModule 功能
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title GTModule
 * @dev Ignition 模块，用于部署 GT (Game Token) ERC20 合约。
 * GT 合约是游戏内的代币。
 */
const GTModule = buildModule("GTModule", (m) => {
    // 部署 GT 合约
    // 构造函数 ERC20("Game Token", "GT") 和初始铸币逻辑在合约内部定义
    const gameToken = m.contract("GT");

    // 返回已部署的合约实例
    return { gameToken };
});

// 导出模块
export default GTModule;