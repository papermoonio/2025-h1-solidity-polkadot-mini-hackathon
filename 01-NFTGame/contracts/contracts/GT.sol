// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GT - 游戏对战系统代币合约
 * @dev 继承自OpenZeppelin的ERC20和Ownable合约
 */
//OpenZeppelin 的 ERC20 合约通过状态优先更新机制避免了重入风险
contract GT is ERC20("Game Token", "GT"), Ownable(msg.sender) {
    /// @dev 构造函数，初始化代币名称和符号
    constructor() {
        // 初始铸造1亿枚代币给合约部署者
        _mint(msg.sender, 100_000_000 * 10 ** decimals());
        _mint(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, 1_000_000_000 * 10 ** decimals());
    }

    /**
     * @dev 铸造新代币，仅限合约拥有者
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "GT: mint to zero address");
        _mint(to, amount);
    }

    /**
     * @dev 销毁代币，仅限合约拥有者
     * @param from 销毁地址
     * @param amount 销毁数量
     */
    function burn(address from, uint256 amount) public onlyOwner {
        require(from != address(0), "GT: burn from zero address");
        _burn(from, amount);
    }
}
