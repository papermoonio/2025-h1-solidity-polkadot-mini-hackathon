import { ethers } from "hardhat";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { GT } from "../typechain-types"; // 确保已运行 npx hardhat compile 生成类型

describe("GT (Game Token) Contract", function () {
    let GTFactory;
    let gt: GT;
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;
    const initialSupply = ethers.parseUnits("100000000", 18); // 1亿代币，18位小数

    /**
     * @dev 在每个测试用例执行前部署合约
     */
    beforeEach(async function () {
        GTFactory = await ethers.getContractFactory("GT");
        [owner, addr1, addr2] = await ethers.getSigners();

        gt = await GTFactory.deploy() as GT;
        await gt.waitForDeployment();
    });

    /**
     * @dev 测试合约部署和初始状态
     */
    describe("Deployment", function () {
        it("Should assign the total supply of tokens to the owner", async function () {
            const ownerBalance = await gt.balanceOf(owner.address);
            expect(await gt.totalSupply()).to.equal(ownerBalance);
            expect(ownerBalance).to.equal(initialSupply);
        });

        it("Should set the right owner", async function () {
            expect(await gt.owner()).to.equal(owner.address);
        });

        it("Should have correct name and symbol", async function () {
            expect(await gt.name()).to.equal("Game Token");
            expect(await gt.symbol()).to.equal("GT");
        });

        it("Should have correct decimals", async function () {
            expect(await gt.decimals()).to.equal(18);
        });
    });

    /**
     * @dev 测试代币铸造 (mint) 功能
     */
    describe("Minting", function () {
        it("Owner should be able to mint tokens", async function () {
            const mintAmount = ethers.parseUnits("1000", 18);
            await gt.connect(owner).mint(addr1.address, mintAmount);
            
            const addr1Balance = await gt.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(mintAmount);

            const newTotalSupply = initialSupply + mintAmount;
            expect(await gt.totalSupply()).to.equal(newTotalSupply);
        });

        it("Non-owner should not be able to mint tokens", async function () {
            const mintAmount = ethers.parseUnits("1000", 18);
            await expect(
                gt.connect(addr1).mint(addr2.address, mintAmount)
            ).to.be.revertedWithCustomError(gt, "OwnableUnauthorizedAccount")
             .withArgs(addr1.address);
        });

        it("Should fail to mint to the zero address", async function () {
            const mintAmount = ethers.parseUnits("1000", 18);
            await expect(
                gt.connect(owner).mint(ethers.ZeroAddress, mintAmount)
            ).to.be.revertedWith("GT: mint to zero address");
        });
    });

    /**
     * @dev 测试代币销毁 (burn) 功能
     */
    describe("Burning", function () {
        it("Owner should be able to burn tokens from any account (as per current Ownable implementation)", async function () {
            const burnAmount = ethers.parseUnits("1000", 18);
            // 首先给 addr1 一些代币
            await gt.connect(owner).transfer(addr1.address, burnAmount);
            expect(await gt.balanceOf(addr1.address)).to.equal(burnAmount);

            // Owner 销毁 addr1 的代币
            await gt.connect(owner).burn(addr1.address, burnAmount);
            
            const addr1BalanceAfterBurn = await gt.balanceOf(addr1.address);
            expect(addr1BalanceAfterBurn).to.equal(0);

            const newTotalSupply = initialSupply - burnAmount;
            expect(await gt.totalSupply()).to.equal(newTotalSupply);
        });
        
        it("Owner should be able to burn their own tokens", async function () {
            const burnAmount = ethers.parseUnits("50000000", 18); // 销毁5千万
            const initialOwnerBalance = await gt.balanceOf(owner.address);

            await gt.connect(owner).burn(owner.address, burnAmount);

            const ownerBalanceAfterBurn = await gt.balanceOf(owner.address);
            expect(ownerBalanceAfterBurn).to.equal(initialOwnerBalance - burnAmount);
            
            const newTotalSupply = initialSupply - burnAmount;
            expect(await gt.totalSupply()).to.equal(newTotalSupply);
        });

        it("Non-owner should not be able to burn tokens", async function () {
            const burnAmount = ethers.parseUnits("1000", 18);
            await gt.connect(owner).transfer(addr1.address, burnAmount); // 给 addr1 一些代币

            await expect(
                gt.connect(addr1).burn(addr1.address, burnAmount) // addr1 尝试销毁自己的代币
            ).to.be.revertedWithCustomError(gt, "OwnableUnauthorizedAccount")
             .withArgs(addr1.address);
        });

        it("Should fail to burn from the zero address", async function () {
            const burnAmount = ethers.parseUnits("1000", 18);
            await expect(
                gt.connect(owner).burn(ethers.ZeroAddress, burnAmount)
            ).to.be.revertedWith("GT: burn from zero address");
        });

        it("Should fail if burning more tokens than an account has", async function () {
            const initialAddr1Balance = await gt.balanceOf(addr1.address); // Should be 0
            const burnAmount = ethers.parseUnits("1", 18);
            
            // Owner 尝试从 addr1 销毁代币，但 addr1 没有代币
            await expect(
                gt.connect(owner).burn(addr1.address, burnAmount)
            ).to.be.revertedWith("ERC20: burn amount exceeds balance");
        });
    });

    /**
     * @dev 测试 ERC20 标准转账功能
     */
    describe("Transactions", function () {
        it("Should transfer tokens between accounts", async function () {
            const transferAmount = ethers.parseUnits("100", 18);
            // 从 owner 转给 addr1
            await gt.connect(owner).transfer(addr1.address, transferAmount);
            const addr1Balance = await gt.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(transferAmount);

            // 从 addr1 转给 addr2
            await gt.connect(addr1).transfer(addr2.address, transferAmount);
            const addr2Balance = await gt.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(transferAmount);
            expect(await gt.balanceOf(addr1.address)).to.equal(0);
        });

        it("Should fail if sender doesn’t have enough tokens", async function () {
            const initialOwnerBalance = await gt.balanceOf(owner.address);
            // 尝试从 addr1 (余额为0) 转账
            await expect(
                gt.connect(addr1).transfer(owner.address, ethers.parseUnits("1", 18))
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

            // 确保 owner 余额不变
            expect(await gt.balanceOf(owner.address)).to.equal(initialOwnerBalance);
        });

        it("Should update balances after transfers", async function () {
            const initialOwnerBalance = await gt.balanceOf(owner.address);
            const transferAmount = ethers.parseUnits("1000", 18);

            await gt.connect(owner).transfer(addr1.address, transferAmount);
            await gt.connect(owner).transfer(addr2.address, transferAmount);

            const finalOwnerBalance = await gt.balanceOf(owner.address);
            expect(finalOwnerBalance).to.equal(initialOwnerBalance - (transferAmount * BigInt(2)));

            const addr1Balance = await gt.balanceOf(addr1.address);
            expect(addr1Balance).to.equal(transferAmount);

            const addr2Balance = await gt.balanceOf(addr2.address);
            expect(addr2Balance).to.equal(transferAmount);
        });
    });

    /**
     * @dev 测试 Ownable 功能
     */
    describe("Ownable", function () {
        it("Should allow owner to transfer ownership", async function () {
            await gt.connect(owner).transferOwnership(addr1.address);
            expect(await gt.owner()).to.equal(addr1.address);
        });

        it("Non-owner should not be able to transfer ownership", async function () {
            await expect(
                gt.connect(addr1).transferOwnership(addr2.address)
            ).to.be.revertedWithCustomError(gt, "OwnableUnauthorizedAccount")
             .withArgs(addr1.address);
        });
    });
});