// 导入 Hardhat Ignition 的 buildModule 功能
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * @title NFTEmojiModule
 * @dev Ignition 模块，用于部署 NFTEmoji 合约。
 * NFTEmoji 合约用于创建和管理独特的表情符号NFT。
 */
const NFTEmojiModule = buildModule("NFTEmojiModule", (m) => {
    // 部署 NFTEmoji 合约
    // 构造函数 ERC721("NFTEmoji", "EMOJI") 在合约内部定义，部署时无需额外参数
    const nftEmoji = m.contract("NFTEmoji");

    // 返回已部署的合约实例，以便其他模块或脚本可以使用
    return { nftEmoji };
});

// 导出模块以供 Hardhat Ignition 使用
export default NFTEmojiModule;