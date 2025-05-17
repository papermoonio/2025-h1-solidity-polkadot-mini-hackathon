// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./SimpleLottery.sol";
// 引入 Ownable 合约，添加所有者功能
import "@openzeppelin/contracts/access/Ownable.sol";

// 抽奖工厂合约：创建和管理抽奖实例
contract LotteryFactory is Ownable {

    // 存储抽奖 ID 到抽奖实例合约地址的映射
    mapping(string => address) public lotteryInstances;
    // 存储所有抽奖 ID 的列表 (方便前端查询所有抽奖)
    string[] public lotteryIds;

    // 事件：当一个新的抽奖实例被创建时触发
    event LotteryInstanceCreated(string indexed lotteryId, address indexed instanceAddress, address indexed owner);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev 用户调用此函数发起一个新的抽奖。
     * 部署一个新的 SimpleLottery 合约实例。
     * @param _lotteryId 用户自定义的唯一 ID。
     * @param _lotteryName 抽奖名称。
     * @param _entryFee 参与费用。
     * @param _drawTime 预设的开奖时间戳。
     */
    function createLottery(
        string memory _lotteryId,
        string memory _lotteryName,
        uint256 _entryFee,
        uint256 _drawTime
        // 注意：发起人可以在调用此函数时通过 msg.value 转入 ETH，作为 SimpleLottery 的初始奖池。
        // 添加 payable 修饰符，允许发起人在创建时转入 ETH
    ) public payable { 
        // 检查抽奖 ID 是否已被使用
        require(lotteryInstances[_lotteryId] == address(0), unicode"抽奖 ID 已被使用");
        // 检查开奖时间是否在未来
        require(_drawTime > block.timestamp, unicode"开奖时间必须在未来");
        require(_entryFee >= 0, unicode"入场费不能为负数");


        // 部署一个新的 SimpleLottery 合约实例
        // msg.sender 将成为 SimpleLottery 实例的 Owner
        // 将 msg.value (发起人转入的 ETH) 传递给 SimpleLottery 的构造函数作为初始奖池
        SimpleLottery newLottery = new SimpleLottery{value: msg.value}(
            _lotteryId,
            _lotteryName,
            _entryFee,
            _drawTime,
            msg.sender // 将发起人设为抽奖实例的 Owner
        );

        // 存储 ID 到实例地址的映射
        lotteryInstances[_lotteryId] = address(newLottery);
        // 将新的 ID 添加到列表中
        lotteryIds.push(_lotteryId);

        emit LotteryInstanceCreated(_lotteryId, address(newLottery), msg.sender);
    }

    // 查询指定ID的抽奖合约地址
    function getLotteryInstanceAddress(string memory _lotteryId) public view returns (address) {
        return lotteryInstances[_lotteryId];
    }

    // 获取所有抽奖ID列表
    function getAllLotteryIds() public view returns (string[] memory) {
        return lotteryIds;
    }
}
