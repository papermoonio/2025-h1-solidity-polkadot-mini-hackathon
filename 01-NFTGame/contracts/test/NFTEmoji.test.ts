// 导入hardhat的ethers库
import { ethers } from "hardhat";
// 导入chai的expect断言库
import { expect } from "chai";
// 导入HardhatEthersSigner类型,用于签名者类型声明
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
// 导入NFTEmoji合约类型
import { NFTEmoji } from "../typechain-types";

// 描述NFTEmoji合约的测试用例
describe("NFTEmoji Contract", function () {
    // 声明合约工厂变量
    let NFTEmojiFactory;
    // 声明NFTEmoji合约实例
    let nftEmoji: NFTEmoji;
    // 声明三个签名者变量:owner(合约拥有者)、addr1和addr2(测试账户)
    let owner: HardhatEthersSigner;
    let addr1: HardhatEthersSigner;
    let addr2: HardhatEthersSigner;

    // 每个测试用例执行前的准备工作
    beforeEach(async function () {
        // 获取三个签名者
        [owner, addr1, addr2] = await ethers.getSigners();
        // 获取NFTEmoji合约工厂
        const NFTEmojiFactory = await ethers.getContractFactory("NFTEmoji");
        // 部署NFTEmoji合约,设置gas限制为5000000
        nftEmoji = await NFTEmojiFactory.deploy();
        // 等待合约部署完成
        await nftEmoji.waitForDeployment();
    });

    // 测试合约部署相关功能
    describe("Deployment", function () {
        // 测试合约所有者是否正确设置
        it("Should set the right owner", async function () {
            expect(await nftEmoji.owner()).to.equal(owner.address);
        });

        // 测试合约名称和符号是否正确
        it("Should have correct name and symbol", async function () {
            expect(await nftEmoji.name()).to.equal("NFTEmoji");
            expect(await nftEmoji.symbol()).to.equal("EMOJI");
        });
        // it("Should query external contract owner", async function () {
        //     const externalContract = await ethers.getContractAt("NFTEmoji", "0x3ed62137c5DB927cb137c26455969116BF0c23Cb");
        //     console.log("Owner:", await externalContract.owner());
        // });
    });

    // 测试铸造NFT相关功能
    describe("Minting", function () {
        // 测试power为0时不能铸造
        it("Should not allow minting with zero power", async function () {
            await expect(
                nftEmoji.connect(owner).mint(addr1.address, 0)
            ).to.be.revertedWith("NFTEmoji: power must be greater than 0");
        });

        // 测试使用最大power值铸造
        it("Should allow minting with maximum power (2^256 - 1)", async function () {
            const maxPower = ethers.MaxUint256;
            await nftEmoji.connect(owner).mint(addr1.address, maxPower);
            expect(await nftEmoji.tokenPower(1)).to.equal(maxPower);
        });

        // 测试合约拥有者铸造NFT
        it("Owner should be able to mint an NFT with power", async function () {
            const tokenId = 1;
            const power = 100;
            await expect(nftEmoji.connect(owner).mint(addr1.address, power))
                .to.emit(nftEmoji, "Transfer")
                .withArgs(ethers.ZeroAddress, addr1.address, tokenId);

            expect(await nftEmoji.ownerOf(tokenId)).to.equal(addr1.address);
            expect(await nftEmoji.tokenPower(tokenId)).to.equal(power);
        });

        // 测试tokenId是否正确递增
        it("Should increment tokenId counter", async function () {
            await nftEmoji.connect(owner).mint(addr1.address, 100);
            await nftEmoji.connect(owner).mint(addr2.address, 200);

            expect(await nftEmoji.ownerOf(1)).to.equal(addr1.address);
            expect(await nftEmoji.tokenPower(1)).to.equal(100);
            expect(await nftEmoji.ownerOf(2)).to.equal(addr2.address);
            expect(await nftEmoji.tokenPower(2)).to.equal(200);
        });

        // 测试非所有者不能铸造NFT
        it("Non-owner should not be able to mint an NFT", async function () {
            await expect(
                nftEmoji.connect(addr1).mint(addr1.address, 100)
            ).to.be.revertedWithCustomError(nftEmoji, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);
        });

        // 测试不能铸造到零地址
        it("Should fail to mint to the zero address", async function () {
            await expect(
                nftEmoji.connect(owner).mint(ethers.ZeroAddress, 100)
            ).to.be.revertedWith("NFTEmoji: mint to the zero address");
        });
    });

    // 测试代币能量值相关功能
    describe("Token Power", function () {
        // 测试销毁后power值为0
        it("Should set token power to 0 after burning", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(addr1.address, 100);
            await nftEmoji.connect(addr1).burn(tokenId);
            expect(await nftEmoji.tokenPower(tokenId)).to.equal(0);
        });

        // 测试power值存储和读取
        it("Should store and retrieve token power correctly", async function () {
            const tokenId = 1;
            const power = 99;
            await nftEmoji.connect(owner).mint(addr1.address, power);
            expect(await nftEmoji.tokenPower(tokenId)).to.equal(power);

            const tokenId2 = 2;
            const power2 = 150;
            await nftEmoji.connect(owner).mint(addr1.address, power2);
            expect(await nftEmoji.tokenPower(tokenId2)).to.equal(power2);
        });
    });

    // 测试NFT销毁相关功能
    describe("Burning", function () {
        // 测试NFT所有者可以销毁NFT
        it("Owner of NFT should be able to burn it", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(addr1.address, 100);

            await expect(nftEmoji.connect(addr1).burn(tokenId))
                .to.emit(nftEmoji, "Transfer")
                .withArgs(addr1.address, ethers.ZeroAddress, tokenId);

            await expect(nftEmoji.ownerOf(tokenId)).to.be.revertedWith("ERC721: invalid token ID");
            expect(await nftEmoji.tokenPower(tokenId)).to.equal(0);
        });

        // 测试非NFT所有者不能销毁NFT
        it("Non-owner of NFT should not be able to burn it", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(addr1.address, 100);

            await expect(
                nftEmoji.connect(addr2).burn(tokenId)
            ).to.be.revertedWith("ERC721: caller is not token owner or approved");
        });

        // 测试合约所有者(非NFT所有者)不能未经授权销毁NFT
        it("Contract owner (if not NFT owner) cannot burn without approval", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(addr1.address, 100);

            await expect(
                nftEmoji.connect(owner).burn(tokenId)
            ).to.be.revertedWith("ERC721: caller is not token owner or approved");
        });
    });

    // 测试所有权相关功能
    describe("Ownable", function () {
        // 测试所有者可以转移所有权
        it("Should allow owner to transfer ownership", async function () {
            await nftEmoji.connect(owner).transferOwnership(addr1.address);
            expect(await nftEmoji.owner()).to.equal(addr1.address);
        });

        // 测试非所有者不能转移所有权
        it("Non-owner should not be able to transfer ownership", async function () {
            await expect(
                nftEmoji.connect(addr1).transferOwnership(addr2.address)
            ).to.be.revertedWithCustomError(nftEmoji, "OwnableUnauthorizedAccount")
                .withArgs(addr1.address);
        });

        // 测试新所有者可以放弃所有权
        it("Should allow new owner to renounce ownership", async function () {
            await nftEmoji.connect(owner).transferOwnership(addr1.address);
            await nftEmoji.connect(addr1).renounceOwnership();
            expect(await nftEmoji.owner()).to.equal(ethers.ZeroAddress);
        });
    });

    // 测试授权和转移相关功能
    describe("Approval & Transfer", function () {
        // 测试被授权地址可以转移NFT
        it("Should allow approved address to transfer NFT", async function () {
            const tokenId = 1;
            await nftEmoji.connect(owner).mint(owner.address, 100);

            await nftEmoji.connect(owner).approve(addr1.address, tokenId);

            await expect(nftEmoji.connect(addr1).transferFrom(owner.address, addr2.address, tokenId))
                .to.emit(nftEmoji, "Transfer")
                .withArgs(owner.address, addr2.address, tokenId);

            expect(await nftEmoji.ownerOf(tokenId)).to.equal(addr2.address);
        });

        // 测试转移后power值保持不变
        it("Should maintain token power after transfer", async function () {
            const tokenId = 1;
            const power = 150;
            await nftEmoji.connect(owner).mint(owner.address, power);

            await nftEmoji.connect(owner).approve(addr1.address, tokenId);

            await nftEmoji.connect(addr1).transferFrom(owner.address, addr2.address, tokenId);

            expect(await nftEmoji.tokenPower(tokenId)).to.equal(power);
        });
    });
   
});