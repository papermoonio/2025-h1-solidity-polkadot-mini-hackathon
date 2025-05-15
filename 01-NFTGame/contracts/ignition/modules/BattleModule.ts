// 导入 Hardhat Ignition 的 buildModule 功能
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
// 导入 NFTEmojiModule 和 GTModule 以获取它们部署的合约地址
import NFTEmojiModule from "./NFTEmojiModule";
import GTModule from "./GTModule";

/**
 * @title BattleModule
 * @dev Ignition 模块，用于部署 BattleSystem 合约。
 * BattleSystem 合约依赖于 NFTEmoji 和 GT 合约。
 */
const BattleModule = buildModule("BattleModule", (m) => {
    // 从其他模块获取已部署合约的引用
    // 'nftEmoji' 是 NFTEmojiModule 返回对象中的键
    const { nftEmoji } = m.useModule(NFTEmojiModule);
    // 'gameToken' 是 GTModule 返回对象中的键
    const { gameToken } = m.useModule(GTModule);

    // 定义 BattleSystem 合约构造函数所需的参数
    // 第一个参数：NFT 合约地址 (来自 NFTEmojiModule)
    const nftContractAddress = nftEmoji;
    // 第二个参数：游戏代币地址 (来自 GTModule)
    const gameTokenAddress = gameToken;
    // 第三个参数：手续费百分比 (例如，设置为1，表示1%)
    // m.getParameter 用于定义可配置的部署参数，这里我们给一个默认值
    const feePercent = m.getParameter("feePercent", 1n); // 使用 BigInt 表示 uint256

    // 部署 BattleSystem 合约，并传入构造函数参数
    const battleSystem = m.contract("BattleSystem", [
        nftContractAddress,
        gameTokenAddress,
        feePercent,
    ]);

    // 返回已部署的 BattleSystem 合约实例
    return { battleSystem };
});

// 导出模块
export default BattleModule;