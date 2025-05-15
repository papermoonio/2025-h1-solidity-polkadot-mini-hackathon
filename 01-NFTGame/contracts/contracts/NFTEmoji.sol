// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// 导入OpenZeppelin的ERC721标准合约
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// 导入可销毁扩展
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
// 导入所有权管理模块
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTEmoji - 标准ERC721 NFT合约（可存储power值）
/// @author Jack
/// @notice 支持NFT的铸造、销毁、所有权管理，并记录每个NFT的power值
contract NFTEmoji is ERC721, ERC721Burnable, Ownable(msg.sender) {
    uint256 private _tokenIdCounter;

    // 新增：用于存储每个tokenId对应的power值
    // mapping(tokenId => powerValue)
    mapping(uint256 => uint256) public tokenPower;

    // 新增：当NFT的power值被设置时触发的事件
    // indexed关键字用于将事件参数标记为索引参数
    // 被标记为indexed的参数会被存储在以太坊区块链的日志结构中
    // 这样可以更高效地过滤和查询包含特定tokenId的事件
    // 每个事件最多可以有3个indexed参数

    /// @dev 构造函数，初始化合约名称和符号
    constructor() ERC721("NFTEmoji", "EMOJI") {}

    /// @notice 铸造NFT，并设置其power值，仅限合约拥有者
    /// @param to 接收者地址
    /// @param power NFT的能量值
    function mint(address to, uint256 power) public onlyOwner {
        require(to != address(0), "NFTEmoji: mint to the zero address");
        _tokenIdCounter += 1;
        uint256 newTokenId = _tokenIdCounter; // 获取新的tokenId
        _mint(to, newTokenId); // 铸造NFT

        // 新增：设置并存储新铸造NFT的power值
        // 使用映射语法将power值存储到tokenPower映射中，其中newTokenId作为键，power作为值
        tokenPower[newTokenId] = power;
        // 新增：触发PowerSet事件
    }
}
