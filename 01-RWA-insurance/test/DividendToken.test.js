const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DividendToken", function () {
  let dividendToken;
  let owner;
  let user1;
  let user2;
  let user3;
  let provider;

  beforeEach(async function () {
    // 获取合约工厂和签名者
    const DividendToken = await ethers.getContractFactory("DividendToken");
    [owner, user1, user2, user3] = await ethers.getSigners();
    provider = ethers.provider;

    // 部署合约
    dividendToken = await DividendToken.deploy();
    await dividendToken.deployed();
  });

  describe("基本功能", function () {
    it("应该正确初始化合约", async function () {
      expect(await dividendToken.name()).to.equal("DividendToken");
      expect(await dividendToken.symbol()).to.equal("DIV");
      expect(await dividendToken.totalSupply()).to.equal(0);
      expect(await dividendToken.owner()).to.equal(owner.address);
    });

    it("应该允许所有者铸造代币", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      await dividendToken.mint(user1.address, mintAmount);
      
      expect(await dividendToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await dividendToken.totalSupply()).to.equal(mintAmount);
    });

    it("不应允许非所有者铸造代币", async function () {
      const mintAmount = ethers.utils.parseEther("1000");
      await expect(
        dividendToken.connect(user1).mint(user1.address, mintAmount)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("应该正确跟踪代币持有者", async function () {
      await dividendToken.mint(user1.address, ethers.utils.parseEther("100"));
      await dividendToken.mint(user2.address, ethers.utils.parseEther("200"));
      
      expect(await dividendToken.getTokenHoldersCount()).to.equal(2);
      expect(await dividendToken.getTokenHolderAtIndex(0)).to.equal(user1.address);
      expect(await dividendToken.getTokenHolderAtIndex(1)).to.equal(user2.address);
    });

    it("应该在转账后更新代币持有者列表", async function () {
      await dividendToken.mint(user1.address, ethers.utils.parseEther("100"));
      
      // 转账给新用户
      await dividendToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("50"));
      
      expect(await dividendToken.getTokenHoldersCount()).to.equal(2);
      expect(await dividendToken.getTokenHolderAtIndex(0)).to.equal(user1.address);
      expect(await dividendToken.getTokenHolderAtIndex(1)).to.equal(user2.address);
      
      expect(await dividendToken.balanceOf(user1.address)).to.equal(ethers.utils.parseEther("50"));
      expect(await dividendToken.balanceOf(user2.address)).to.equal(ethers.utils.parseEther("50"));
    });
  });

  describe("保单管理", function () {
    it("应该允许所有者创建保单", async function () {
      const now = Math.floor(Date.now() / 1000);
      const premium = ethers.utils.parseEther("1");
      const coverageAmount = ethers.utils.parseEther("100");
      const startDate = now;
      const endDate = now + 86400 * 30; // 30天后

      await expect(
        dividendToken.createPolicy(premium, coverageAmount, startDate, endDate)
      )
        .to.emit(dividendToken, "PolicyCreated")
        .withArgs(1, owner.address, premium, coverageAmount, startDate, endDate);

      const policy = await dividendToken.policies(1);
      expect(policy.policyId).to.equal(1);
      expect(policy.policyHolder).to.equal(owner.address);
      expect(policy.premium).to.equal(premium);
      expect(policy.coverageAmount).to.equal(coverageAmount);
      expect(policy.startDate).to.equal(startDate);
      expect(policy.endDate).to.equal(endDate);
      expect(policy.isActive).to.be.true;
      expect(policy.isClaimed).to.be.false;

      expect(await dividendToken.policyCount()).to.equal(1);
    });

    it("不应允许创建开始日期晚于结束日期的保单", async function () {
      const now = Math.floor(Date.now() / 1000);
      const premium = ethers.utils.parseEther("1");
      const coverageAmount = ethers.utils.parseEther("100");
      const startDate = now + 86400; // 明天
      const endDate = now; // 今天

      await expect(
        dividendToken.createPolicy(premium, coverageAmount, startDate, endDate)
      ).to.be.revertedWith("Start date must be before end date");
    });

    it("不应允许非所有者创建保单", async function () {
      const now = Math.floor(Date.now() / 1000);
      const premium = ethers.utils.parseEther("1");
      const coverageAmount = ethers.utils.parseEther("100");
      const startDate = now;
      const endDate = now + 86400 * 30; // 30天后

      await expect(
        dividendToken.connect(user1).createPolicy(premium, coverageAmount, startDate, endDate)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("应该允许查询保单持有人的保单", async function () {
      const now = Math.floor(Date.now() / 1000);
      const premium = ethers.utils.parseEther("1");
      const coverageAmount = ethers.utils.parseEther("100");
      const startDate = now;
      const endDate = now + 86400 * 30; // 30天后

      await dividendToken.createPolicy(premium, coverageAmount, startDate, endDate);
      await dividendToken.createPolicy(premium * 2, coverageAmount * 2, startDate, endDate);

      const ownerPolicies = await dividendToken.getPoliciesByHolder(owner.address);
      expect(ownerPolicies.length).to.equal(2);
      expect(ownerPolicies[0]).to.equal(1);
      expect(ownerPolicies[1]).to.equal(2);
    });
  });

  describe("保费支付", function () {
    let policyId;
    let premium;
    let coverageAmount;
    let startDate;
    let endDate;

    beforeEach(async function () {
      // 创建一个保单
      const now = Math.floor(Date.now() / 1000);
      premium = ethers.utils.parseEther("1");
      coverageAmount = ethers.utils.parseEther("100");
      startDate = now;
      endDate = now + 86400 * 30; // 30天后

      await dividendToken.createPolicy(premium, coverageAmount, startDate, endDate);
      policyId = 1;
    });

    it("应该允许保单持有人支付保费", async function () {
      await expect(
        dividendToken.payPremium(policyId, { value: premium })
      ).to.emit(dividendToken, "PremiumPaid")
        .withArgs(policyId, owner.address, premium);
      
      // 验证合约余额增加
      expect(await provider.getBalance(dividendToken.address)).to.equal(premium);
    });

    it("不应允许非保单持有人支付保费", async function () {
      await expect(
        dividendToken.connect(user1).payPremium(policyId, { value: premium })
      ).to.be.revertedWith("Only policy holder can pay premium");
    });

    it("不应允许支付错误金额的保费", async function () {
      const incorrectPremium = ethers.utils.parseEther("0.5");
      
      await expect(
        dividendToken.payPremium(policyId, { value: incorrectPremium })
      ).to.be.revertedWith("Incorrect premium amount");
    });

    it("不应允许为非活跃保单支付保费", async function () {
      // 先支付保费，然后处理索赔使保单变为非活跃状态
      await dividendToken.payPremium(policyId, { value: premium });
      
      // 发送足够的ETH到合约以支付索赔
      await owner.sendTransaction({
        to: dividendToken.address,
        value: ethers.utils.parseEther("100")
      });
      
      await dividendToken.processClaim(policyId);
      
      // 尝试再次支付保费
      await expect(
        dividendToken.payPremium(policyId, { value: premium })
      ).to.be.revertedWith("Policy is not active");
    });
  });

  describe("索赔处理", function () {
    let policyId;
    let premium;
    let coverageAmount;
    let startDate;
    let endDate;

    beforeEach(async function () {
      // 创建一个保单并支付保费
      const now = Math.floor(Date.now() / 1000);
      premium = ethers.utils.parseEther("1");
      coverageAmount = ethers.utils.parseEther("100");
      startDate = now;
      endDate = now + 86400 * 30; // 30天后

      await dividendToken.createPolicy(premium, coverageAmount, startDate, endDate);
      policyId = 1;
      await dividendToken.payPremium(policyId, { value: premium });
      
      // 向合约发送足够的ETH以支付索赔
      await owner.sendTransaction({
        to: dividendToken.address,
        value: ethers.utils.parseEther("200")
      });
    });

    it("应该允许保单持有人处理索赔", async function () {
      const initialBalance = await provider.getBalance(owner.address);
      
      // 处理索赔
      const tx = await dividendToken.processClaim(policyId);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      // 验证保单状态
      const policy = await dividendToken.policies(policyId);
      expect(policy.isClaimed).to.be.true;
      expect(policy.isActive).to.be.false;
      
      // 验证余额增加（减去gas费用）
      const finalBalance = await provider.getBalance(owner.address);
      expect(finalBalance.add(gasUsed).sub(initialBalance)).to.equal(coverageAmount);
    });

    it("不应允许非保单持有人处理索赔", async function () {
      await expect(
        dividendToken.connect(user1).processClaim(policyId)
      ).to.be.revertedWith("Only policy holder can claim");
    });

    it("不应允许对已索赔的保单再次索赔", async function () {
      await dividendToken.processClaim(policyId);
      
      await expect(
        dividendToken.processClaim(policyId)
      ).to.be.revertedWith("Policy is not active");
    });

    it("不应允许对过期保单进行索赔", async function () {
      // 创建一个已过期的保单
      const now = Math.floor(Date.now() / 1000);
      const pastStartDate = now - 86400 * 60; // 60天前
      const pastEndDate = now - 86400 * 30; // 30天前

      await dividendToken.createPolicy(premium, coverageAmount, pastStartDate, pastEndDate);
      const expiredPolicyId = 2;
      await dividendToken.payPremium(expiredPolicyId, { value: premium });
      
      await expect(
        dividendToken.processClaim(expiredPolicyId)
      ).to.be.revertedWith("Policy is not in effect");
    });

    it("不应允许对未生效的保单进行索赔", async function () {
      // 创建一个未来生效的保单
      const now = Math.floor(Date.now() / 1000);
      const futureStartDate = now + 86400 * 30; // 30天后
      const futureEndDate = now + 86400 * 60; // 60天后

      await dividendToken.createPolicy(premium, coverageAmount, futureStartDate, futureEndDate);
      const futurePolicyId = 2;
      await dividendToken.payPremium(futurePolicyId, { value: premium });
      
      await expect(
        dividendToken.processClaim(futurePolicyId)
      ).to.be.revertedWith("Policy is not in effect");
    });
  });

  describe("股息分配", function () {
    beforeEach(async function () {
      // 铸造代币给用户
      await dividendToken.mint(user1.address, ethers.utils.parseEther("100"));
      await dividendToken.mint(user2.address, ethers.utils.parseEther("200"));
      await dividendToken.mint(user3.address, ethers.utils.parseEther("300"));
    });

    it("应该正确跟踪代币持有者", async function () {
      expect(await dividendToken.getTokenHoldersCount()).to.equal(3);
      expect(await dividendToken.getTokenHolderAtIndex(0)).to.equal(user1.address);
      expect(await dividendToken.getTokenHolderAtIndex(1)).to.equal(user2.address);
      expect(await dividendToken.getTokenHolderAtIndex(2)).to.equal(user3.address);
    });

    it("应该在转账后更新代币持有者列表", async function () {
      // 连接user1进行转账
      await dividendToken.connect(user1).transfer(owner.address, ethers.utils.parseEther("50"));
      
      expect(await dividendToken.getTokenHoldersCount()).to.equal(4);
      expect(await dividendToken.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("50"));
    });

    it("应该允许所有者分配股息", async function () {
      const dividendAmount = ethers.utils.parseEther("6");
      const user1Balance = await dividendToken.balanceOf(user1.address);
      const user2Balance = await dividendToken.balanceOf(user2.address);
      const user3Balance = await dividendToken.balanceOf(user3.address);
      const totalSupply = await dividendToken.totalSupply();
      
      // 计算预期的股息
      const user1ExpectedDividend = dividendAmount.mul(user1Balance).div(totalSupply);
      const user2ExpectedDividend = dividendAmount.mul(user2Balance).div(totalSupply);
      const user3ExpectedDividend = dividendAmount.mul(user3Balance).div(totalSupply);
      
      // 获取初始余额
      const user1InitialBalance = await provider.getBalance(user1.address);
      const user2InitialBalance = await provider.getBalance(user2.address);
      const user3InitialBalance = await provider.getBalance(user3.address);
      
      // 分配股息
      await expect(
        dividendToken.distributeDividends({ value: dividendAmount })
      ).to.emit(dividendToken, "DividendsDistributed")
        .withArgs(dividendAmount);
      
      // 验证余额增加
      const user1FinalBalance = await provider.getBalance(user1.address);
      const user2FinalBalance = await provider.getBalance(user2.address);
      const user3FinalBalance = await provider.getBalance(user3.address);
      
      expect(user1FinalBalance.sub(user1InitialBalance)).to.equal(user1ExpectedDividend);
      expect(user2FinalBalance.sub(user2InitialBalance)).to.equal(user2ExpectedDividend);
      expect(user3FinalBalance.sub(user3InitialBalance)).to.equal(user3ExpectedDividend);
    });

    it("不应允许非所有者分配股息", async function () {
      const dividendAmount = ethers.utils.parseEther("3");
      
      await expect(
        dividendToken.connect(user1).distributeDividends({ value: dividendAmount })
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("不应允许分配零值股息", async function () {
      await expect(
        dividendToken.distributeDividends({ value: 0 })
      ).to.be.revertedWith("Must send ETH to distribute");
    });

    it("不应允许在没有代币铸造的情况下分配股息", async function () {
      // 部署一个新的合约，没有铸造任何代币
      const DividendToken = await ethers.getContractFactory("DividendToken");
      const newDividendToken = await DividendToken.deploy();
      await newDividendToken.deployed();
      
      const dividendAmount = ethers.utils.parseEther("1");
      
      await expect(
        newDividendToken.distributeDividends({ value: dividendAmount })
      ).to.be.revertedWith("No tokens minted");
    });

    it("应该按持有比例分配股息", async function () {
      // 用户1持有100代币，用户2持有200代币，用户3持有300代币
      // 总共600代币，分配6 ETH
      // 用户1应得1 ETH，用户2应得2 ETH，用户3应得3 ETH
      
      const dividendAmount = ethers.utils.parseEther("6");
      
      // 获取初始余额
      const user1InitialBalance = await provider.getBalance(user1.address);
      const user2InitialBalance = await provider.getBalance(user2.address);
      const user3InitialBalance = await provider.getBalance(user3.address);
      
      // 分配股息
      await dividendToken.distributeDividends({ value: dividendAmount });
      
      // 验证最终余额
      const user1FinalBalance = await provider.getBalance(user1.address);
      const user2FinalBalance = await provider.getBalance(user2.address);
      const user3FinalBalance = await provider.getBalance(user3.address);
      
      expect(user1FinalBalance.sub(user1InitialBalance)).to.equal(ethers.utils.parseEther("1"));
      expect(user2FinalBalance.sub(user2InitialBalance)).to.equal(ethers.utils.parseEther("2"));
      expect(user3FinalBalance.sub(user3InitialBalance)).to.equal(ethers.utils.parseEther("3"));
    });

    it("应该处理代币持有者余额为零的情况", async function () {
      // 用户1将所有代币转给用户2
      await dividendToken.connect(user1).transfer(user2.address, ethers.utils.parseEther("100"));
      
      const dividendAmount = ethers.utils.parseEther("6");
      
      // 获取初始余额
      const user1InitialBalance = await provider.getBalance(user1.address);
      const user2InitialBalance = await provider.getBalance(user2.address);
      const user3InitialBalance = await provider.getBalance(user3.address);
      
      // 分配股息
      await dividendToken.distributeDividends({ value: dividendAmount });
      
      // 验证最终余额
      const user1FinalBalance = await provider.getBalance(user1.address);
      const user2FinalBalance = await provider.getBalance(user2.address);
      const user3FinalBalance = await provider.getBalance(user3.address);
      
      // 用户1不应收到股息，因为余额为0
      expect(user1FinalBalance).to.equal(user1InitialBalance);
      
      // 用户2和用户3应按比例收到股息
      const user2ExpectedDividend = ethers.utils.parseEther("6").mul(300).div(600);
      const user3ExpectedDividend = ethers.utils.parseEther("6").mul(300).div(600);
      
      expect(user2FinalBalance.sub(user2InitialBalance)).to.equal(user2ExpectedDividend);
      expect(user3FinalBalance.sub(user3InitialBalance)).to.equal(user3ExpectedDividend);
    });
  });

  describe("边缘情况和错误处理", function () {
    it("应该正确处理getTokenHolderAtIndex的边界检查", async function () {
      await expect(
        dividendToken.getTokenHolderAtIndex(0)
      ).to.be.revertedWith("Index out of bounds");
      
      await dividendToken.mint(user1.address, ethers.utils.parseEther("100"));
      
      expect(await dividendToken.getTokenHolderAtIndex(0)).to.equal(user1.address);
      
      await expect(
        dividendToken.getTokenHolderAtIndex(1)
      ).to.be.revertedWith("Index out of bounds");
    });

    it("应该能够接收ETH转账", async function () {
      const amount = ethers.utils.parseEther("1");
      
      // 使用sendTransaction发送ETH
      await owner.sendTransaction({
        to: dividendToken.address,
        value: amount
      });
      
      expect(await provider.getBalance(dividendToken.address)).to.equal(amount);
    });
  });

  describe("综合场景测试", function () {
    it("应该正确处理完整的保险和股息流程", async function () {
      // 1. 铸造代币
      await dividendToken.mint(user1.address, ethers.utils.parseEther("100"));
      await dividendToken.mint(user2.address, ethers.utils.parseEther("200"));
      
      // 2. 创建保单
      const now = Math.floor(Date.now() / 1000);
      const premium = ethers.utils.parseEther("1");
      const coverageAmount = ethers.utils.parseEther("50");
      const startDate = now;
      const endDate = now + 86400 * 30; // 30天后
      
      await dividendToken.createPolicy(premium, coverageAmount, startDate, endDate);
      
      // 3. 支付保费
      await dividendToken.payPremium(1, { value: premium });
      
      // 4. 向合约发送额外的ETH用于索赔和股息
      await owner.sendTransaction({
        to: dividendToken.address,
        value: ethers.utils.parseEther("100")
      });
      
      // 5. 处理索赔
      await dividendToken.processClaim(1);
      
      // 6. 分配股息
      const dividendAmount = ethers.utils.parseEther("10");
      
      // 获取初始余额
      const user1InitialBalance = await provider.getBalance(user1.address);
      const user2InitialBalance = await provider.getBalance(user2.address);
      
      await dividendToken.distributeDividends({ value: dividendAmount });
      
      // 验证最终余额
      const user1FinalBalance = await provider.getBalance(user1.address);
      const user2FinalBalance = await provider.getBalance(user2.address);
      
      // 用户1应得1/3的股息，用户2应得2/3的股息
      expect(user1FinalBalance.sub(user1InitialBalance)).to.be.closeTo(
        ethers.utils.parseEther("3.33"), 
        ethers.utils.parseEther("0.01") // 允许小误差
      );
      expect(user2FinalBalance.sub(user2InitialBalance)).to.be.closeTo(
        ethers.utils.parseEther("6.67"),
        ethers.utils.parseEther("0.01") // 允许小误差
      );
    });
  });
});