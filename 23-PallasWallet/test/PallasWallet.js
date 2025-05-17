const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PallasWallet", function () {
  let owner, guardian1, guardian2, guardian3, attacker, newOwner;
  let wallet,guardians;
  const RECOVERY_DELAY = 2 * 24 * 60 * 60; // 2 days in seconds
  const INITIAL_GUARDIANS = 3;
  const SEND_AMOUNT = ethers.parseEther("1.0");

  before(async () => {
    [owner, guardian1, guardian2, guardian3, attacker, newOwner] = await ethers.getSigners();

    const pallasGuardians = await ethers.getContractFactory("PallasGuardians");
    guardians = await pallasGuardians.deploy(
      owner.address,
      [guardian1.address, guardian2.address, guardian3.address]
    );
    await guardians.waitForDeployment();

    const PallasWallet = await ethers.getContractFactory("PallasWallet");
    const guardiansAddr =  await guardians.getAddress();
    wallet = await PallasWallet.deploy(
      owner.address,
      guardiansAddr
    );
    await wallet.waitForDeployment();

    const tx = await owner.sendTransaction({
      to: guardian1.address,
      value: ethers.parseEther("100"), 
    });
    await tx.wait(); 

    
    const tx2 = await owner.sendTransaction({
      to: guardian2.address,
      value: ethers.parseEther("100"), 
    });
    await tx2.wait(); 

    const tx3 = await owner.sendTransaction({
      to: guardian3.address,
      value: ethers.parseEther("100"), 
    });
    await tx3.wait(); 

    const tx4 = await owner.sendTransaction({
      to: attacker.address,
      value: ethers.parseEther("100"), 
    });
    await tx4.wait(); 

    const tx5 = await owner.sendTransaction({
      to: newOwner.address,
      value: ethers.parseEther("100"), 
    });
    await tx5.wait();    
  });

  async function getRecoveryDetails() {
    const recovery = await wallet.pendingRecovery();  
    return {
        newOwner: recovery.newOwner,
        executeAfter: recovery.executeAfter,
        approvalCount: recovery.approvalCount,
    };
  }


  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      expect(await wallet.owner()).to.equal(owner.address);
    });

    it("Should initialize guardians correctly", async () => {
      expect(await guardians.isGuardian(guardian1.address)).to.be.true;
      expect(await guardians.isGuardian(guardian2.address)).to.be.true;
      expect(await guardians.isGuardian(guardian3.address)).to.be.true;
      expect(await guardians.getGuardiansCount()).to.equal(INITIAL_GUARDIANS);
    });

    it("Should calculate recovery threshold correctly", async () => {
      // For 3 guardians: (3 / 2) + 1 = 2
      expect(await wallet.getRecoveryThreshold()).to.equal(2);
    });
  });

  describe("ETH Handling", () => {
    it("Should receive ETH", async () => {
      await owner.sendTransaction({
        to: await wallet.getAddress(),
        value: SEND_AMOUNT
      });
      const balance = await ethers.provider.getBalance(await wallet.getAddress());
      expect(balance).to.equal(SEND_AMOUNT);
    });
  });

  describe("Attacker Recovery Tests", () => {
    let wallet;
    beforeEach(async () => {
      const pallasGuardians = await ethers.getContractFactory("PallasGuardians");
      guardians = await pallasGuardians.deploy(
        owner.address,
        [guardian1.address, guardian2.address, guardian3.address]
      );
      await guardians.waitForDeployment();

      const PallasWallet = await ethers.getContractFactory("PallasWallet");
      const guardiansAddr =  await guardians.getAddress();
      wallet = await PallasWallet.deploy(
        owner.address,
        guardiansAddr
      );
      await wallet.waitForDeployment();
    });
    it("Should prevent non-owners from initiating recovery", async () => {
      await expect(
        wallet.connect(attacker).requestRecovery(attacker.address)
      ).to.be.revertedWith("Caller is not the owner");
    });
  });

  describe("Recovery Process", () => {
    beforeEach(async () => {
      await wallet.connect(owner).requestRecovery(newOwner.address);
    });

    it("Should allow owner to initiate recovery", async () => {
      const details = await getRecoveryDetails();
      expect(details.newOwner).to.equal(newOwner.address);
      expect(details.executeAfter).to.be.gt(0);
      await wallet.connect(owner).cancelRecovery();
    });    

    it("Should prevent early approval", async () => {
      await expect(
        wallet.connect(guardian1).approveRecovery()
      ).to.be.revertedWith("Recovery delay not passed");
      await wallet.connect(owner).cancelRecovery();
    });

    it("Should execute recovery when threshold met", async () => {
      await wallet.connect(owner).setMockTime(0);
      await wallet.connect(guardian1).approveRecovery();
      await wallet.connect(guardian2).approveRecovery();
      expect(await wallet.owner()).to.equal(newOwner.address);
      await wallet.connect(newOwner).cancelRecovery();
    });

    it("Should transfer ETH to new owner", async () => {
      await wallet.connect(owner).setMockTime(0);
      await wallet.connect(guardian1).approveRecovery();
      await wallet.connect(guardian2).approveRecovery();
      const newOwnerBalanceBefore = await ethers.provider.getBalance(newOwner.address);
      await wallet.connect(newOwner).withdraw(newOwner.address, SEND_AMOUNT);
      const newOwnerBalanceAfter = await ethers.provider.getBalance(newOwner.address);
      expect(newOwnerBalanceAfter - newOwnerBalanceBefore).to.be.closeTo(
        SEND_AMOUNT,
        ethers.parseEther("0.01") // Account for gas
      );
    });

    it("Should allow owner to cancel recovery", async () => {
      await wallet.connect(owner).cancelRecovery();
      const details = await getRecoveryDetails();
      expect(details.newOwner).to.equal(ethers.ZeroAddress);
      expect(details.approvalCount).to.equal(0);
    });
  });

  describe("Guardian Management", () => {
    let guardians;
    beforeEach(async () => {
        const guardiansAddr = await wallet.connect(owner).getPallasGuardians();
        guardians = await ethers.getContractAt(
          "IPallasGuardians",
          guardiansAddr,
          owner
        );
    });
    it("Should allow owner to add guardians", async () => {
      await guardians.addGuardian(attacker.address);
      expect(await guardians.isGuardian(attacker.address)).to.be.true;
      expect(await guardians.getGuardiansCount()).to.equal(INITIAL_GUARDIANS + 1);
      await guardians.removeGuardian(attacker.address);
    });

    it("Should prevent non-owners from adding guardians", async () => {
      await expect(
        guardians.addGuardian(attacker.address)
      ).to.be.revertedWith("Caller is not the owner");
      guardians.removeGuardian(attacker.address)
    });

    it("Should allow owner to remove guardians", async () => {
      await guardians.removeGuardian(guardian3.address);
      expect(await guardians.isGuardian(guardian3.address)).to.be.false;
      expect(await guardians.getGuardiansCount()).to.equal(INITIAL_GUARDIANS - 1);
    });

    it("Should update approvals count when guardian removed", async () => {
      await wallet.connect(owner).cancelRecovery();
      await wallet.connect(owner).requestRecovery(newOwner.address);
      await time.increase(RECOVERY_DELAY);
      await wallet.connect(guardian1).approveRecovery();
      
      // Remove approving guardian
      await guardians.removeGuardian(guardian1.address);
      
      const details = await getRecoveryDetails();
      expect(details.approvalCount).to.equal(0); // approvalCount reset
    });
  });

  describe("Edge Cases", () => {
    let guardians;
    beforeEach(async () => {
        const guardiansAddr = await wallet.connect(owner).getPallasGuardians();
        guardians = await ethers.getContractAt(
          "IPallasGuardians",
          guardiansAddr,
          owner
        );
    });    
    it("Should prevent duplicate guardian additions", async () => {
      await expect(
        guardians.addGuardian(guardian1.address)
      ).to.be.revertedWith("Address is already a guardian");
    });

    it("Should prevent invalid address for recovery", async () => {
      await wallet.connect(owner).cancelRecovery();
      await expect(
        wallet.connect(owner).requestRecovery(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid new owner address");
    });

    it("Should prevent exceeding max guardians", async () => {
      // Already has 3, add 2 more
      await guardians.addGuardian(attacker.address);
      await guardians.addGuardian(newOwner.address);
      
      // Attempt to add 6th (should fail)
      await expect(
        guardians.addGuardian((await ethers.getSigners())[6].address)
      ).to.be.revertedWith("Invalid required signatures");
    });
  });
});
