// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 引入 OpenZeppelin 的 Ownable，方便管理合约所有者权限
import "@openzeppelin/contracts/access/Ownable.sol";


contract SimpleLottery is Ownable {

    // --- 状态变量 ---
    string public lotteryId;         // 抽奖的唯一 ID
    string public lotteryName;       // 抽奖名称
    uint256 public entryFee;         // 参与费用
    address[] public participants;   // 参与者列表
    address public winner;           // 中奖者地址 (开奖后)
    uint256 public prizePool;        // 奖池总金额 (由参与费用累积)
    uint256 public openingTime;      // 抽奖开放时间 (可选，基础版简化为部署后即开放)
    uint256 public closingTime;      // 参与截止时间 (可选，基础版简化为开奖前)
    uint256 public drawTime;         // 预设的开奖时间戳

    // 抽奖状态
    enum LotteryState {
        Open,        // 开放参与
        Drawing,     // 正在开奖
        Claimable,   // 可领奖
        Closed       // 已结束（奖金已领取或已重置）
    }

    LotteryState public currentLotteryState; // 当前状态

    // --- 事件 ---
    event LotteryCreated(string indexed id, address indexed owner, string name, uint256 entryFee, uint256 drawTime);
    event EnteredLottery(string indexed lotteryId, address indexed participant);
    event WinnerDrawn(string indexed lotteryId, address indexed winner, uint256 prizeAmount);
    event PrizeClaimed(string indexed lotteryId, address indexed winner, uint256 prizeAmount);
    event LotteryStateChanged(string indexed lotteryId, LotteryState newState);

    constructor(
        string memory _lotteryId,  // 用户自定义的该抽奖的唯一ID
        string memory _lotteryName,  // 抽奖名称
        uint256 _entryFee,  // 参与费用
        uint256 _drawTime,  // 预设的开奖时间戳
        address _owner  // 该抽奖实例的发起人地址
    ) payable Ownable(_owner) {
        lotteryId = _lotteryId;
        lotteryName = _lotteryName;
        entryFee = _entryFee;
        drawTime = _drawTime;
        currentLotteryState = LotteryState.Open;
        prizePool = msg.value;

        emit LotteryCreated(_lotteryId, _owner, _lotteryName, _entryFee, _drawTime);
        emit LotteryStateChanged(_lotteryId, LotteryState.Open);
    }

    // 用户支付费用参与抽奖。
    function enter() public payable {
        require(currentLotteryState == LotteryState.Open, unicode"当前抽奖未开放参与");
        require(block.timestamp < drawTime, unicode"已到开奖时间，无法参与");
        require(msg.value == entryFee, unicode"支付的入场费不正确");

        participants.push(msg.sender);
        prizePool += msg.value;

        emit EnteredLottery(lotteryId, msg.sender);
    }

    // 开奖：必须在抽奖处于 Open 状态且已到或超过开奖时间，并且有参与者时调用
    function drawWinner() public onlyOwner {
        // 检查状态是否开放且已到开奖时间
        require(currentLotteryState == LotteryState.Open, unicode"抽奖未开放或未到开奖时间");
        require(block.timestamp >= drawTime, unicode"未到开奖时间，无法开奖");
        // 检查是否有参与者
        require(participants.length > 0, unicode"没有参与者，无法开奖");

        currentLotteryState = LotteryState.Drawing;
        emit LotteryStateChanged(lotteryId, LotteryState.Drawing);

        // 注意：此随机数方法目前不安全，待优化
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, participants.length, msg.sender))) % participants.length;

        winner = participants[randomIndex]; // 选出中奖者

        emit WinnerDrawn(lotteryId, winner, prizePool);

        currentLotteryState = LotteryState.Claimable; // 改为可领奖状态
        emit LotteryStateChanged(lotteryId, LotteryState.Claimable);
    }

    // 中奖者调用此函数领取奖金。
    // 必须在抽奖处于 Claimable 状态时调用。
    function claimPrize() public {
        // 检查是否是中奖者且状态可领奖
        require(msg.sender == winner, unicode"只有中奖者才能领取奖金");
        require(currentLotteryState == LotteryState.Claimable, unicode"奖金当前不可领取");

        uint256 amountToTransfer = address(this).balance;

        (bool success, ) = payable(winner).call{value: amountToTransfer}("");
        require(success, unicode"奖金转账失败");

        emit PrizeClaimed(lotteryId, winner, amountToTransfer);

        currentLotteryState = LotteryState.Closed;
        emit LotteryStateChanged(lotteryId, LotteryState.Closed);
    }

    function resetLottery() public onlyOwner {
         // 检查抽奖是否已结束
         require(currentLotteryState == LotteryState.Closed, unicode"抽奖未结束，无法重置");

         // 清理状态，表示本场次彻底结束
         // 清空参与者列表
         delete participants;
         // 重置中奖者地址
         winner = address(0);
    }

    // 查询函数
    function getParticipants() public view returns (address[] memory) {
        return participants;
    }

    function getLotteryState() public view returns (LotteryState) {
        return currentLotteryState;
    }

    function getWinner() public view returns (address) {
        return winner;
    }

    function getPrizePool() public view returns (uint256) {
        return address(this).balance; // 奖池就是合约余额
    }

    // 返回抽奖完整信息
    function getLotteryDetails() public view returns (
        string memory lotteryName,  // 抽奖名称
        address ownerAddress,   // 所有者地址
        uint256 fee,    // 参与费用
        uint256 time,   // 开奖时间
        uint256 pool,   // 奖池金额
        LotteryState state,    // 当前状态
        address winnerAddress   // 获胜者地址
    ) {
        return (
            lotteryName,
            Ownable.owner(),
            entryFee,
            drawTime,
            address(this).balance,
            currentLotteryState,
            winner
        );
    }

    // 允许直接发送ETH到合约
    receive() external payable {
        // 也可以在这里拒绝直接转账:
        // revert(unicode"请通过enter函数参与");
    }
}