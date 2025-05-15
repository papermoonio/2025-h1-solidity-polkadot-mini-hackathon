// SPDX-License-Identifier: MIT
// 指定Solidity编译器版本为0.8.20或更高版本
pragma solidity ^0.8.26;

// 导入NFTEmoji合约
import "./NFTEmoji.sol";
// 导入OpenZeppelin的ERC20接口
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// 导入OpenZeppelin的ReentrancyGuard工具，用于防止重入攻击
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; // 新增导入

// 定义对战系统合约
// 继承 ReentrancyGuard 以使用 nonReentrant 修改器
contract BattleSystem is ReentrancyGuard { // 修改继承
    // 使用枚举定义对战的四种状态：等待中、进行中、已完成、已取消
    enum BattleStatus {
        Pending, // 玩家1已创建，等待玩家2加入
        Completed, // 对战已结束，胜负已分
        Cancelled // 对战被玩家1取消
    }

    // 定义对战结构体，包含对战的所有相关信息
    struct Battle {
        address player1; // 玩家1地址
        address player2; // 玩家2地址
        uint256 power1; //  玩家1nft搞笑值
        uint256 power2; //  玩家2nft搞笑值
        uint256 nftId1; // 玩家1的NFT ID
        uint256 nftId2; // 玩家2的NFT ID
        uint256 player1BetAmount; // 玩家1的押金金额
        uint256 player2BetAmount; // 玩家2的押金金额
        uint256 startTime; // 对战创建时间 (玩家1发起)
        uint256 endTime; // 对战结束时间
        address winner; // 获胜者地址
        BattleStatus status; // 对战状态
    }

    // 声明公共状态变量
    address public immutable nftContract; // NFT合约地址
    address public immutable gameToken; // 游戏代币合约地址
    address public owner; // 合约拥有者，用于提取手续费
    uint256 public feePercent; // 手续费百分比 (例如: 1 表示 1%)

    Battle[] public battles; // 存储所有对战信息的数组

    // 定义事件
    event BattleStarted(
        uint256 indexed battleId,
        address indexed player1,
        uint256 nftId1,
        uint256 player1BetAmount
    ); // 玩家1创建对战事件
    event BattleJoinedAndFinalized(
        uint256 indexed battleId,
        address indexed player2,
        uint256 nftId2,
        uint256 player2BetAmount,
        address indexed winner,
        uint256 rewardAmount
    ); // 玩家2加入并结束对战事件
    event BattleCancelled(uint256 indexed battleId, address indexed player1, uint256 refundAmount); // 对战取消事件
    event FeesWithdrawn(address indexed owner, uint256 amount); // 手续费提取事件

    // 修改器：仅限合约拥有者
    // 修改器onlyOwner用于限制函数只能被合约拥有者调用
    // 如果调用者不是owner，交易会被回滚
    // 常用于管理员功能，如提取手续费、修改参数等
    modifier onlyOwner() {
        require(msg.sender == owner, "BattleSystem: Caller is not the owner");
        _; // 这里的_; 表示继续执行被修饰的函数主体
    }
    /**
     * @dev 构造函数，初始化NFT合约地址、游戏代币地址、手续费百分比和合约拥有者
     * @param _nftContract NFT合约的地址
     * @param _gameTokenAddress 游戏代币 (ERC20) 合约的地址
     * @param _feePercent 手续费的百分比 (例如，传入 1 代表 1%)
     */
    constructor(address _nftContract, address _gameTokenAddress, uint256 _feePercent) {
        require(_nftContract != address(0), "BattleSystem: NFT contract address cannot be zero");
        require(_gameTokenAddress != address(0), "BattleSystem: Game token address cannot be zero");
        require(_feePercent > 0 && _feePercent <= 100, "BattleSystem: Fee percent must be between 1 and 100");

        nftContract = _nftContract;
        gameToken = _gameTokenAddress;
        owner = msg.sender; // 合约部署者成为拥有者
        feePercent = _feePercent;
    }

    /**
     * @dev 玩家1创建对战房间并存入押金
     * @param _nftId1 玩家1用于对战的NFT ID
     * @param _player1BetAmount 玩家1的押金金额
     */
    function startBattle(uint256 _nftId1, uint256 _player1BetAmount) external nonReentrant { // 添加 nonReentrant
        // 验证调用者是否为NFT持有者
        require(
            NFTEmoji(nftContract).ownerOf(_nftId1) == msg.sender,
            "BattleSystem: Caller is not the owner of NFT1"
        );
        // 验证押金金额是否大于0
        require(_player1BetAmount > 0, "BattleSystem: Player 1 bet amount must be positive");

        // 将押金从玩家1转移到合约
        IERC20(gameToken).transferFrom(msg.sender, address(this), _player1BetAmount);

        // 获取玩家1 NFT的power值
        uint256 player1Power = NFTEmoji(nftContract).tokenPower(_nftId1);

        uint256 battleId = battles.length;
        battles.push(
            Battle({
                player1: msg.sender,
                player2: address(0), // 玩家2尚未加入
                power1: player1Power, // 存储玩家1的NFT power值
                power2: 0, // 玩家2的NFT power值尚未设置
                nftId1: _nftId1,
                nftId2: 0, // 玩家2的NFT ID尚未设置
                player1BetAmount: _player1BetAmount,
                player2BetAmount: 0, // 玩家2的押金尚未设置
                startTime: block.timestamp,
                endTime: 0, // 对战尚未结束
                winner: address(0), // 获胜者尚未确定
                status: BattleStatus.Pending // 状态设置为等待玩家2加入
            })
        );

        emit BattleStarted(battleId, msg.sender, _nftId1, _player1BetAmount);
    }

    /**
     * @dev 玩家2加入对战房间，存入押金，并立即判定胜负
     * @param _battleId 要加入的对战ID
     * @param _nftId2 玩家2用于对战的NFT ID
     * @param _player2BetAmount 玩家2的押金金额
     */
    function joinBattleAndFinalize(uint256 _battleId, uint256 _nftId2, uint256 _player2BetAmount) external nonReentrant { // 添加 nonReentrant
        require(_battleId < battles.length, "BattleSystem: Battle ID out of bounds");
        Battle storage battle = battles[_battleId];

        // 验证对战状态是否为Pending
        require(battle.status == BattleStatus.Pending, "BattleSystem: Battle is not pending");
        // 验证玩家2不是玩家1
        require(msg.sender != battle.player1, "BattleSystem: Cannot battle yourself");
        // 验证玩家2是否为NFT持有者
        require(
            NFTEmoji(nftContract).ownerOf(_nftId2) == msg.sender,
            "BattleSystem: Caller is not the owner of NFT2"
        );
        // 验证押金金额是否大于0
        require(_player2BetAmount > 0, "BattleSystem: Player 2 bet amount must be positive");

        // 将押金从玩家2转移到合约
        IERC20(gameToken).transferFrom(msg.sender, address(this), _player2BetAmount);

        // 获取玩家2 NFT的power值
        uint256 player2Power = NFTEmoji(nftContract).tokenPower(_nftId2);

        // 更新对战信息
        battle.player2 = msg.sender;
        battle.nftId2 = _nftId2;
        battle.player2BetAmount = _player2BetAmount;
        battle.power2 = player2Power; // 存储玩家2的NFT power值

        // 判定胜负 - 比较双方NFT的power值
        address actualWinner;
        uint256 rewardAmountToWinner = 0; // 初始化获胜者奖励金额

        if (battle.power2 > battle.power1) {
            // 玩家2的NFT power更高，玩家2胜
            actualWinner = battle.player2;
            battle.winner = actualWinner;

            // 计算总押金和奖励
            uint256 totalBetAmount = battle.player1BetAmount + battle.player2BetAmount;
            uint256 feeAmount = (totalBetAmount * feePercent) / 100;
            rewardAmountToWinner = totalBetAmount - feeAmount;

            // 将奖励转给获胜者
            IERC20(gameToken).transfer(actualWinner, rewardAmountToWinner);
        } else if (battle.power1 > battle.power2) {
            // 玩家1的NFT power更高，玩家1胜
            actualWinner = battle.player1;
            battle.winner = actualWinner;

            // 计算总押金和奖励
            uint256 totalBetAmount = battle.player1BetAmount + battle.player2BetAmount;
            uint256 feeAmount = (totalBetAmount * feePercent) / 100;
            rewardAmountToWinner = totalBetAmount - feeAmount;

            // 将奖励转给获胜者
            IERC20(gameToken).transfer(actualWinner, rewardAmountToWinner);
        } else {
            //双方NFT power值相等，平局
            actualWinner = address(0); // 使用地址0表示平局
            battle.winner = actualWinner;

            // 退还玩家1的押金
            IERC20(gameToken).transfer(battle.player1, battle.player1BetAmount);
            // 退还玩家2的押金
            IERC20(gameToken).transfer(battle.player2, battle.player2BetAmount);
            // rewardAmountToWinner 保持为0，因为是平局，没有额外奖励
        }

        // 更新对战最终状态
        battle.status = BattleStatus.Completed;
        battle.endTime = block.timestamp;

        emit BattleJoinedAndFinalized(
            _battleId,
            battle.player2,
            battle.nftId2,
            battle.player2BetAmount,
            actualWinner, // 在平局情况下，这里会是 address(0)
            rewardAmountToWinner // 在平局情况下，这里会是 0
        );
    }

    /**
     * @dev 玩家1取消尚未开始的对战并取回押金
     * @param _battleId 要取消的对战ID
     */
    function cancelBattle(uint256 _battleId) external nonReentrant { // 添加 nonReentrant
        require(_battleId < battles.length, "BattleSystem: Battle ID out of bounds");
        Battle storage battle = battles[_battleId];

        // 验证调用者是否为玩家1
        require(msg.sender == battle.player1, "BattleSystem: Only player 1 can cancel");
        // 验证对战状态是否为Pending
        require(battle.status == BattleStatus.Pending, "BattleSystem: Battle is not pending or already started");

        // 更新对战状态为已取消
        battle.status = BattleStatus.Cancelled;
        battle.endTime = block.timestamp; // 记录取消时间

        // 退还玩家1的押金
        uint256 refundAmount = battle.player1BetAmount;
        IERC20(gameToken).transfer(battle.player1, refundAmount);

        emit BattleCancelled(_battleId, battle.player1, refundAmount);
    }

    /**
     * @dev 合约拥有者提取累积的手续费
     */
    function withdrawFees() external onlyOwner nonReentrant { // 添加 nonReentrant
        uint256 contractBalance = IERC20(gameToken).balanceOf(address(this));
        require(contractBalance > 0, "BattleSystem: No fees to withdraw");

        IERC20(gameToken).transfer(owner, contractBalance);
        emit FeesWithdrawn(owner, contractBalance);
    }

    /**
     * @dev 更改手续费百分比 (仅限合约拥有者)
     * @param _newFeePercent 新的手续费百分比 (例如: 1 表示 1%)
     */
    function setFeePercent(uint256 _newFeePercent) external onlyOwner nonReentrant { // 也可以考虑添加 nonReentrant
        require(_newFeePercent > 0 && _newFeePercent <= 100, "BattleSystem: Fee percent must be between 1 and 100");
        feePercent = _newFeePercent;
    }

    /**
     * @dev 获取指定ID的对战信息
     * @param _battleId 对战ID
     * @return Battle 对战的详细信息
     */
    function getBattleDetails(uint256 _battleId) external view returns (Battle memory) {
        require(_battleId < battles.length, "BattleSystem: Battle ID out of bounds");
        return battles[_battleId];
    }

    /**
     * @dev 获取当前对战总数
     * @return uint256 对战总数
     */
    function getTotalBattles() external view returns (uint256) {
        return battles.length;
    }
}
