import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { NFTEmoji, GT, BattleSystem } from "../typechain-types"; // 确保已运行 npx hardhat compile

describe("BattleSystem Contract", function () {
    let nftEmoji: NFTEmoji;
    let gameToken: GT;
    let battleSystem: BattleSystem;
    let owner: HardhatEthersSigner; // 合约部署者，也是 BattleSystem 的 owner 和 fee recipient
    let player1: HardhatEthersSigner;
    let player2: HardhatEthersSigner;
    let otherAccount: HardhatEthersSigner;

    const feePercent = 5; // 5% fee
    const initialTokenSupply = ethers.parseUnits("1000000", 18); // GT 初始供应量
    const playerInitialTokenBalance = ethers.parseUnits("10000", 18); // 每个玩家的初始 GT 余额

    /**
     * @dev 部署所有依赖合约并进行初始设置
     */
    async function deployContractsAndSetup() {
        [owner, player1, player2, otherAccount] = await ethers.getSigners();

        // 部署 NFTEmoji 合约
        const NFTEmojiFactory = await ethers.getContractFactory("NFTEmoji");
        nftEmoji = await NFTEmojiFactory.deploy() as NFTEmoji;
        await nftEmoji.waitForDeployment();

        // 部署 GT (Game Token) 合约
        const GTFactory = await ethers.getContractFactory("GT");
        gameToken = await GTFactory.deploy() as GT; // owner 获得初始供应
        await gameToken.waitForDeployment();

        // 部署 BattleSystem 合约
        const BattleSystemFactory = await ethers.getContractFactory("BattleSystem");
        battleSystem = await BattleSystemFactory.connect(owner).deploy(
            await nftEmoji.getAddress(),
            await gameToken.getAddress(),
            feePercent
        ) as BattleSystem;
        await battleSystem.waitForDeployment();

        // 为 player1 和 player2 分发一些 GT 代币
        await gameToken.connect(owner).transfer(player1.address, playerInitialTokenBalance);
        await gameToken.connect(owner).transfer(player2.address, playerInitialTokenBalance);

        // 为 player1 和 player2 铸造 NFT
        // NFT ID 0 for player1, power 100 (assuming 0-indexed minting)
        await nftEmoji.connect(owner).mint(player1.address, 100);
        // NFT ID 1 for player1, power 50
        await nftEmoji.connect(owner).mint(player1.address, 50);
        // NFT ID 2 for player2, power 120
        await nftEmoji.connect(owner).mint(player2.address, 120);
        // NFT ID 3 for player2, power 80
        await nftEmoji.connect(owner).mint(player2.address, 80);
    }

    beforeEach(async function () {
        await deployContractsAndSetup();
    });

    /**
     * @dev 测试合约部署和初始状态
     */
    describe("Deployment", function () {
        it("Should set the correct NFT contract address", async function () {
            expect(await battleSystem.nftContract()).to.equal(await nftEmoji.getAddress());
        });

        it("Should set the correct game token contract address", async function () {
            expect(await battleSystem.gameToken()).to.equal(await gameToken.getAddress());
        });

        it("Should set the correct owner", async function () {
            expect(await battleSystem.owner()).to.equal(owner.address);
        });

        it("Should set the correct fee percent", async function () {
            expect(await battleSystem.feePercent()).to.equal(feePercent);
        });

        it("Should revert if NFT contract address is zero", async function () {
            const BattleSystemFactory = await ethers.getContractFactory("BattleSystem");
            await expect(BattleSystemFactory.deploy(ethers.ZeroAddress, await gameToken.getAddress(), feePercent))
                .to.be.revertedWith("BattleSystem: NFT contract address cannot be zero");
        });

        it("Should revert if game token address is zero", async function () {
            const BattleSystemFactory = await ethers.getContractFactory("BattleSystem");
            await expect(BattleSystemFactory.deploy(await nftEmoji.getAddress(), ethers.ZeroAddress, feePercent))
                .to.be.revertedWith("BattleSystem: Game token address cannot be zero");
        });

        it("Should revert if fee percent is 0", async function () {
            const BattleSystemFactory = await ethers.getContractFactory("BattleSystem");
            await expect(BattleSystemFactory.deploy(await nftEmoji.getAddress(), await gameToken.getAddress(), 0))
                .to.be.revertedWith("BattleSystem: Fee percent must be between 1 and 100");
        });

        it("Should revert if fee percent is greater than 100", async function () {
            const BattleSystemFactory = await ethers.getContractFactory("BattleSystem");
            await expect(BattleSystemFactory.deploy(await nftEmoji.getAddress(), await gameToken.getAddress(), 101))
                .to.be.revertedWith("BattleSystem: Fee percent must be between 1 and 100");
        });
    });

    /**
     * @dev 测试 startBattle 功能
     */
    describe("startBattle", function () {
        const nftIdP1 = 0; // player1 owns this NFT (power 100), assuming 0-indexed
        const betAmount = ethers.parseUnits("100", 18);

        beforeEach(async function () {
            // Player1 授权 BattleSystem 合约花费其 GT 代币
            await gameToken.connect(player1).approve(await battleSystem.getAddress(), betAmount);
        });

        it("Player1 should be able to start a battle", async function () {
            await expect(battleSystem.connect(player1).startBattle(nftIdP1, betAmount))
                .to.emit(battleSystem, "BattleStarted")
                .withArgs(0, player1.address, nftIdP1, betAmount); // battleId is 0

            const battle = await battleSystem.getBattleDetails(0);
            expect(battle.player1).to.equal(player1.address);
            expect(battle.nftId1).to.equal(nftIdP1);
            expect(battle.power1).to.equal(100); // Power of NFT ID 0 for player1
            expect(battle.player1BetAmount).to.equal(betAmount);
            expect(battle.status).to.equal(0); // BattleStatus.Pending
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(betAmount);
        });

        it("Should revert if caller is not the owner of NFT1", async function () {
            // player2 tries to use player1's NFT (nftIdP1)
            await expect(battleSystem.connect(player2).startBattle(nftIdP1, betAmount))
                .to.be.revertedWith("BattleSystem: Caller is not the owner of NFT1");
        });

        it("Should revert if bet amount is zero", async function () {
            await gameToken.connect(player1).approve(await battleSystem.getAddress(), ethers.parseUnits("0", 18)); // Approve 0 for this test
            await expect(battleSystem.connect(player1).startBattle(nftIdP1, ethers.parseUnits("0", 18)))
                .to.be.revertedWith("BattleSystem: Player 1 bet amount must be positive");
        });

        it("Should transfer tokens from player1 to the contract", async function () {
            const player1InitialBalance = await gameToken.balanceOf(player1.address);
            await battleSystem.connect(player1).startBattle(nftIdP1, betAmount);
            const player1FinalBalance = await gameToken.balanceOf(player1.address);
            expect(player1FinalBalance).to.equal(player1InitialBalance - betAmount);
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(betAmount);
        });
    });

    /**
     * @dev 测试 joinBattleAndFinalize 功能
     */
    describe("joinBattleAndFinalize", function () {
        const nftIdP1 = 0; // player1 owns, power 100
        const betAmountP1 = ethers.parseUnits("100", 18);
        const nftIdP2Win = 2; // player2 owns, power 120
        const betAmountP2 = ethers.parseUnits("100", 18);
        let battleId: bigint;

        beforeEach(async function () {
            // Player1 starts a battle
            await gameToken.connect(player1).approve(await battleSystem.getAddress(), betAmountP1);
            const tx = await battleSystem.connect(player1).startBattle(nftIdP1, betAmountP1);
            const receipt = await tx.wait();

            const battleStartedEvent = receipt?.logs.find((log: any) => {
                // @ts-ignore
                return log.fragment && log.fragment.name === "BattleStarted";
            });
            // @ts-ignore
            battleId = battleStartedEvent.args[0];


            // Player2 approves BattleSystem to spend their GT
            await gameToken.connect(player2).approve(await battleSystem.getAddress(), betAmountP2);
        });

        it("Player2 should join, finalize, and win if power is higher", async function () {
            const player1InitialBalance = await gameToken.balanceOf(player1.address);
            const player2InitialBalance = await gameToken.balanceOf(player2.address);
            const contractInitialBalanceBeforeP2Join = await gameToken.balanceOf(await battleSystem.getAddress()); // Should be betAmountP1

            const totalBet = betAmountP1 + betAmountP2;
            const fee = (totalBet * BigInt(feePercent)) / BigInt(100);
            const rewardToWinner = totalBet - fee;

            await expect(battleSystem.connect(player2).joinBattleAndFinalize(battleId, nftIdP2Win, betAmountP2))
                .to.emit(battleSystem, "BattleJoinedAndFinalized")
                .withArgs(battleId, player2.address, nftIdP2Win, betAmountP2, player2.address, rewardToWinner);

            const battle = await battleSystem.getBattleDetails(battleId);
            expect(battle.player2).to.equal(player2.address);
            expect(battle.nftId2).to.equal(nftIdP2Win);
            expect(battle.power2).to.equal(120); // Power of NFT ID 2 for player2
            expect(battle.player2BetAmount).to.equal(betAmountP2);
            expect(battle.winner).to.equal(player2.address);
            expect(battle.status).to.equal(1); // BattleStatus.Completed

            // Check balances
            expect(await gameToken.balanceOf(player1.address)).to.equal(player1InitialBalance); // P1 lost, no change other than initial bet
            expect(await gameToken.balanceOf(player2.address)).to.equal(player2InitialBalance - betAmountP2 + rewardToWinner); // P2 won
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(fee); // Contract keeps only the fee
        });

        it("Player1 should win if power is higher", async function () {
            const nftIdP2Lose = 3; // player2 owns, power 80

            const player1InitialBalance = await gameToken.balanceOf(player1.address);
            const player2InitialBalance = await gameToken.balanceOf(player2.address);

            const totalBet = betAmountP1 + betAmountP2;
            const fee = (totalBet * BigInt(feePercent)) / BigInt(100);
            const rewardToWinner = totalBet - fee;

            // Player2 approves for this specific NFT (already approved generally in beforeEach)
            // await gameToken.connect(player2).approve(await battleSystem.getAddress(), betAmountP2); // Not needed if approved for enough

            await expect(battleSystem.connect(player2).joinBattleAndFinalize(battleId, nftIdP2Lose, betAmountP2))
                .to.emit(battleSystem, "BattleJoinedAndFinalized")
                .withArgs(battleId, player2.address, nftIdP2Lose, betAmountP2, player1.address, rewardToWinner);

            const battle = await battleSystem.getBattleDetails(battleId);
            expect(battle.winner).to.equal(player1.address);
            expect(battle.status).to.equal(1); // Completed

            expect(await gameToken.balanceOf(player1.address)).to.equal(player1InitialBalance + rewardToWinner);
            expect(await gameToken.balanceOf(player2.address)).to.equal(player2InitialBalance - betAmountP2);
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(fee);
        });

        it("Should result in a tie and refund if powers are equal", async function () {
            // Mint a new NFT for player2 with power 100 (same as player1's nftIdP1)
            // Assuming minting the 5th NFT overall, its ID would be 4 (0-indexed)
            const nftIdP2EqualPower = 4;
            await nftEmoji.connect(owner).mint(player2.address, 100);

            const player1InitialBalance = await gameToken.balanceOf(player1.address);
            const player2InitialBalance = await gameToken.balanceOf(player2.address);

            // Player2 approves (already approved generally)
            // await gameToken.connect(player2).approve(await battleSystem.getAddress(), betAmountP2);

            await expect(battleSystem.connect(player2).joinBattleAndFinalize(battleId, nftIdP2EqualPower, betAmountP2))
                .to.emit(battleSystem, "BattleJoinedAndFinalized")
                .withArgs(battleId, player2.address, nftIdP2EqualPower, betAmountP2, ethers.ZeroAddress, 0); // Winner is address(0), reward is 0

            const battle = await battleSystem.getBattleDetails(battleId);
            expect(battle.winner).to.equal(ethers.ZeroAddress); // Tie
            expect(battle.status).to.equal(1); // Completed

            // Balances should be restored to what they were before this battle started for P1, and before P2 joined for P2.
            // P1's betAmountP1 was transferred to contract. P2's betAmountP2 was transferred. Both are refunded.
            expect(await gameToken.balanceOf(player1.address)).to.equal(player1InitialBalance);
            expect(await gameToken.balanceOf(player2.address)).to.equal(player2InitialBalance);
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(0); // All bets refunded, no fee
        });

        it("Should revert if battle ID is out of bounds", async function () {
            await expect(battleSystem.connect(player2).joinBattleAndFinalize(999, nftIdP2Win, betAmountP2))
                .to.be.revertedWith("BattleSystem: Battle ID out of bounds");
        });

        it("Should revert if battle is not pending", async function () {
            // Player2 joins and finalizes
            await battleSystem.connect(player2).joinBattleAndFinalize(battleId, nftIdP2Win, betAmountP2);
            // Attempt to join again
            await gameToken.connect(player2).approve(await battleSystem.getAddress(), betAmountP2); // Need approval again if it was single-use
            await expect(battleSystem.connect(player2).joinBattleAndFinalize(battleId, nftIdP2Win, betAmountP2))
                .to.be.revertedWith("BattleSystem: Battle is not pending");
        });

        it("Should revert if player2 is player1", async function () {
            await gameToken.connect(player1).approve(await battleSystem.getAddress(), betAmountP2); // P1 approves for P2's role
            const nftIdP1Another = 1; // player1's other NFT (power 50), ID 1
            await expect(battleSystem.connect(player1).joinBattleAndFinalize(battleId, nftIdP1Another, betAmountP2))
                .to.be.revertedWith("BattleSystem: Cannot battle yourself");
        });

        it("Should revert if caller is not the owner of NFT2", async function () {
            // player1 tries to use player2's NFT (nftIdP2Win)
            await expect(battleSystem.connect(player1).joinBattleAndFinalize(battleId, nftIdP2Win, betAmountP2))
                .to.be.revertedWith("BattleSystem: Caller is not the owner of NFT2");
        });

        it("Should revert if player 2 bet amount is zero", async function () {
            await gameToken.connect(player2).approve(await battleSystem.getAddress(), ethers.parseUnits("0", 18));
            await expect(battleSystem.connect(player2).joinBattleAndFinalize(battleId, nftIdP2Win, ethers.parseUnits("0", 18)))
                .to.be.revertedWith("BattleSystem: Player 2 bet amount must be positive");
        });
    });

    /**
     * @dev 测试 cancelBattle 功能
     */
    describe("cancelBattle", function () {
        const nftIdP1 = 0; // Player1's NFT, ID 0
        const betAmountP1 = ethers.parseUnits("100", 18);
        let battleId: bigint;

        beforeEach(async function () {
            await gameToken.connect(player1).approve(await battleSystem.getAddress(), betAmountP1);
            const tx = await battleSystem.connect(player1).startBattle(nftIdP1, betAmountP1);
            const receipt = await tx.wait();
            const battleStartedEvent = receipt?.logs.find((log: any) => {
                // @ts-ignore
                return log.fragment && log.fragment.name === "BattleStarted";
            });
            // @ts-ignore
            battleId = battleStartedEvent.args[0];
        });

        it("Player1 should be able to cancel a pending battle", async function () {
            const player1InitialBalance = await gameToken.balanceOf(player1.address);
            // Contract has betAmountP1 at this point
            // const contractInitialBalance = await gameToken.balanceOf(await battleSystem.getAddress()); 

            await expect(battleSystem.connect(player1).cancelBattle(battleId))
                .to.emit(battleSystem, "BattleCancelled")
                .withArgs(battleId, player1.address, betAmountP1);

            const battle = await battleSystem.getBattleDetails(battleId);
            expect(battle.status).to.equal(2); // BattleStatus.Cancelled

            expect(await gameToken.balanceOf(player1.address)).to.equal(player1InitialBalance + betAmountP1); // Bet refunded
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(0); // Contract balance should be 0
        });

        it("Should revert if caller is not player1", async function () {
            await expect(battleSystem.connect(player2).cancelBattle(battleId))
                .to.be.revertedWith("BattleSystem: Only player 1 can cancel");
        });

        it("Should revert if battle is not pending", async function () {
            // Player2 joins to change status from Pending
            const nftIdP2 = 2; // Player2's NFT, ID 2
            const betAmountP2 = ethers.parseUnits("100", 18);
            await gameToken.connect(player2).approve(await battleSystem.getAddress(), betAmountP2);
            await battleSystem.connect(player2).joinBattleAndFinalize(battleId, nftIdP2, betAmountP2);

            await expect(battleSystem.connect(player1).cancelBattle(battleId))
                .to.be.revertedWith("BattleSystem: Battle is not pending or already started");
        });

        it("Should revert if battle ID is out of bounds", async function () {
            await expect(battleSystem.connect(player1).cancelBattle(999))
                .to.be.revertedWith("BattleSystem: Battle ID out of bounds");
        });
    });

    /**
     * @dev 测试 withdrawFees 功能
     */
    describe("withdrawFees", function () {
        const nftIdP1 = 0; // power 100
        const betAmountP1 = ethers.parseUnits("200", 18);
        const nftIdP2 = 2; // power 120
        const betAmountP2 = ethers.parseUnits("300", 18); // P2 bets more
        let battleId: bigint;

        beforeEach(async function () {
            // P1 starts battle
            await gameToken.connect(player1).approve(await battleSystem.getAddress(), betAmountP1);
            const txStart = await battleSystem.connect(player1).startBattle(nftIdP1, betAmountP1);
            const receiptStart = await txStart.wait();
            const battleStartedEvent = receiptStart?.logs.find((log:any) => {
                // @ts-ignore
                return log.fragment && log.fragment.name === "BattleStarted";
            });
            // @ts-ignore
            battleId = battleStartedEvent.args[0];

            // P2 joins and wins
            await gameToken.connect(player2).approve(await battleSystem.getAddress(), betAmountP2);
            await battleSystem.connect(player2).joinBattleAndFinalize(battleId, nftIdP2, betAmountP2);
            // Total bet = 500. Fee = 5% of 500 = 25.
            // Contract should have 25 GT as fee.
        });

        it("Owner should be able to withdraw fees", async function () {
            const ownerInitialBalance = await gameToken.balanceOf(owner.address);
            const contractFeeBalance = await gameToken.balanceOf(await battleSystem.getAddress());
            const expectedFee = (betAmountP1 + betAmountP2) * BigInt(feePercent) / BigInt(100);
            expect(contractFeeBalance).to.equal(expectedFee); // Should be 25 GT

            await expect(battleSystem.connect(owner).withdrawFees())
                .to.emit(battleSystem, "FeesWithdrawn")
                .withArgs(owner.address, contractFeeBalance);

            expect(await gameToken.balanceOf(owner.address)).to.equal(ownerInitialBalance + contractFeeBalance);
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(0);
        });

        it("Should revert if non-owner tries to withdraw fees", async function () {
            await expect(battleSystem.connect(player1).withdrawFees())
                .to.be.revertedWith("BattleSystem: Caller is not the owner");
        });

        it("Should revert if no fees to withdraw", async function () {
            // Withdraw fees first
            await battleSystem.connect(owner).withdrawFees();
            // Try to withdraw again
            await expect(battleSystem.connect(owner).withdrawFees())
                .to.be.revertedWith("BattleSystem: No fees to withdraw");
        });
    });


    /**
     * @dev 测试 setFeePercent 功能
     */
    describe("setFeePercent", function () {
        const validNewFeePercent = 10; // 10%
        const invalidFeePercentZero = 0;
        const invalidFeePercentAboveMax = 101;

        /**
         * @dev 测试合约所有者是否可以成功设置新的手续费百分比
         */
        it("Owner should be able to set a new fee percent", async function () {
            await expect(battleSystem.connect(owner).setFeePercent(validNewFeePercent))
                .to.not.be.reverted;
            expect(await battleSystem.feePercent()).to.equal(validNewFeePercent);
        });

        /**
         * @dev 测试非合约所有者尝试设置手续费百分比时是否会回滚
         */
        it("Should revert if non-owner tries to set fee percent", async function () {
            await expect(battleSystem.connect(player1).setFeePercent(validNewFeePercent))
                .to.be.revertedWith("BattleSystem: Caller is not the owner");
        });

        /**
         * @dev 测试设置手续费百分比为0时是否会回滚
         */
        it("Should revert if new fee percent is 0", async function () {
            await expect(battleSystem.connect(owner).setFeePercent(invalidFeePercentZero))
                .to.be.revertedWith("BattleSystem: Fee percent must be between 1 and 100");
        });

        /**
         * @dev 测试设置手续费百分比大于100时是否会回滚
         */
        it("Should revert if new fee percent is greater than 100", async function () {
            await expect(battleSystem.connect(owner).setFeePercent(invalidFeePercentAboveMax))
                .to.be.revertedWith("BattleSystem: Fee percent must be between 1 and 100");
        });

        /**
         * @dev 测试成功设置手续费后，新的手续费是否在后续交易中生效
         */
        it("Should use the new fee percent for subsequent battles after change", async function () {
            // beforeEach 在此 describe 块的每个 it 之前运行，因此 battleSystem 是新的，feePercent 是初始的 5%
            // owner 的 GT 余额是 initialTokenSupply - 2 * playerInitialTokenBalance

            // 1. 设置新的手续费百分比
            const newFee = 10; // 新的手续费 10%
            await battleSystem.connect(owner).setFeePercent(newFee);
            expect(await battleSystem.feePercent()).to.equal(newFee);

            // 2. 准备战斗参数
            const nftIdP1 = 0; // player1 拥有的 NFT，ID 0, power 100
            const betP1 = ethers.parseUnits("100", 18);
            const nftIdP2 = 2; // player2 拥有的 NFT，ID 2, power 120 (P2 将获胜)
            const betP2 = ethers.parseUnits("150", 18);

            // Player1 批准代币并开始战斗
            await gameToken.connect(player1).approve(await battleSystem.getAddress(), betP1);
            const txStart = await battleSystem.connect(player1).startBattle(nftIdP1, betP1);
            const receiptStart = await txStart.wait();
            const battleStartedEvent = receiptStart?.logs.find((log:any) => {
                // @ts-ignore
                return log.fragment && log.fragment.name === "BattleStarted";
            });
            // @ts-ignore
            const battleId = battleStartedEvent.args[0];

            // Player2 批准代币
            await gameToken.connect(player2).approve(await battleSystem.getAddress(), betP2);

            // 获取 owner 在本次战斗手续费被提取前的余额
            const ownerBalanceBeforeWithdrawal = await gameToken.balanceOf(owner.address);
            // 此时合约余额应为 player1 的赌注
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(betP1);

            // 3. Player2 加入并完成战斗
            await battleSystem.connect(player2).joinBattleAndFinalize(battleId, nftIdP2, betP2);

            // 4. 检查手续费计算
            const totalBet = betP1 + betP2; // 100 + 150 = 250
            const expectedFeeForThisBattle = (totalBet * BigInt(newFee)) / BigInt(100); // 10% of 250 = 25

            // 合约现在应该只持有本次战斗产生的手续费
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(expectedFeeForThisBattle);

            // 5. Owner 提取手续费
            await expect(battleSystem.connect(owner).withdrawFees())
                .to.emit(battleSystem, "FeesWithdrawn")
                .withArgs(owner.address, expectedFeeForThisBattle);

            // 检查 Owner 余额
            expect(await gameToken.balanceOf(owner.address)).to.equal(ownerBalanceBeforeWithdrawal + expectedFeeForThisBattle);
            // 提取后合约余额应为零
            expect(await gameToken.balanceOf(await battleSystem.getAddress())).to.equal(0);
        });
    }); // End of describe("setFeePercent")

}); // Final closing for "BattleSystem Contract"