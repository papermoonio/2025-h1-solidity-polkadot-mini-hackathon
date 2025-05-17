import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractVerifier } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ContractVerifier", function () {
  let contractVerifier: ContractVerifier;
  let owner: SignerWithAddress;
  let uploader: SignerWithAddress;
  let viewer: SignerWithAddress;
  let otherAccount: SignerWithAddress;
  
  // 测试数据
  const contractId = 1n;
  const fileHash = ethers.keccak256(ethers.toUtf8Bytes("test-file-content"));
  const remark = "Initial version";
  const contractType = "NDA";
  
  beforeEach(async function () {
    // 获取测试账户
    [owner, uploader, viewer, otherAccount] = await ethers.getSigners();
    
    // 部署合约
    const ContractVerifierFactory = await ethers.getContractFactory("ContractVerifier");
    contractVerifier = await ContractVerifierFactory.deploy() as ContractVerifier;
    await contractVerifier.waitForDeployment();
  });
  
  describe("部署", function () {
    it("应该将部署者设置为 owner", async function () {
      expect(await contractVerifier.owner()).to.equal(owner.address);
    });
  });
  
  describe("用户角色管理", function () {
    it("owner 应该能够分配上传者角色", async function () {
      await contractVerifier.assignUserRole(uploader.address);
      
      const userInfo = await contractVerifier.getUserInfo(uploader.address);
      expect(userInfo.role).to.equal("Uploader");
      expect(userInfo.departmentId).to.equal("DPT");
    });
    
    it("非 owner 不应该能够分配角色", async function () {
      await expect(
        contractVerifier.connect(otherAccount).assignUserRole(uploader.address)
      ).to.be.revertedWith("Not owner");
    });
  });
  
  describe("合约上传", function () {
    beforeEach(async function () {
      // 为上传者分配角色
      await contractVerifier.assignUserRole(uploader.address);
    });
    
    it("上传者应该能够上传合约", async function () {
      await contractVerifier.connect(uploader).uploadContract(
        contractId,
        fileHash,
        remark,
        contractType
      );
      
      // 验证合约已上传
      expect(await contractVerifier.isHashExists(fileHash)).to.be.true;
      expect(await contractVerifier.getLatestHash(contractId)).to.equal(fileHash);
      
      // 验证合约元数据
      const meta = await contractVerifier.getContractMeta(contractId);
      expect(meta.contractType).to.equal(contractType);
    });
    
    it("非上传者不应该能够上传合约", async function () {
      await expect(
        contractVerifier.connect(otherAccount).uploadContract(
          contractId,
          fileHash,
          remark,
          contractType
        )
      ).to.be.revertedWith("Not uploader");
    });
    
    it("应该能够上传多个版本的合约", async function () {
      // 上传第一个版本
      await contractVerifier.connect(uploader).uploadContract(
        contractId,
        fileHash,
        remark,
        contractType
      );
      
      // 上传第二个版本
      const fileHash2 = ethers.keccak256(ethers.toUtf8Bytes("updated-content"));
      const remark2 = "Updated version";
      
      await contractVerifier.connect(uploader).uploadContract(
        contractId,
        fileHash2,
        remark2,
        contractType
      );
      
      // 验证历史记录
      expect(await contractVerifier.getHistoryCount(contractId)).to.equal(2n);
      expect(await contractVerifier.getLatestHash(contractId)).to.equal(fileHash2);
      
      // 验证第一个版本
      const version1 = await contractVerifier.getHistory(contractId, 0);
      expect(version1.fileHash).to.equal(fileHash);
      expect(version1.uploader).to.equal(uploader.address);
      expect(version1.remark).to.equal(remark);
      
      // 验证第二个版本
      const version2 = await contractVerifier.getHistory(contractId, 1);
      expect(version2.fileHash).to.equal(fileHash2);
      expect(version2.uploader).to.equal(uploader.address);
      expect(version2.remark).to.equal(remark2);
    });
  });
  
  describe("访问控制", function () {
    beforeEach(async function () {
      // 为上传者分配角色
      await contractVerifier.assignUserRole(uploader.address);
      
      // 上传合约
      await contractVerifier.connect(uploader).uploadContract(
        contractId,
        fileHash,
        remark,
        contractType
      );
    });
    
    it("owner 应该能够授予访问权限", async function () {
      await contractVerifier.grantAccessToContract(contractId, viewer.address);
      
      expect(await contractVerifier.canAccessContract(contractId, viewer.address)).to.be.true;
      
      // 验证查看者已添加到元数据
      const meta = await contractVerifier.getContractMeta(contractId);
      expect(meta.allowedViewers).to.include(viewer.address);
    });
    
    it("owner 应该能够撤销访问权限", async function () {
      // 先授予权限
      await contractVerifier.grantAccessToContract(contractId, viewer.address);
      expect(await contractVerifier.canAccessContract(contractId, viewer.address)).to.be.true;
      
      // 然后撤销权限
      await contractVerifier.revokeAccessFromContract(contractId, viewer.address);
      expect(await contractVerifier.canAccessContract(contractId, viewer.address)).to.be.false;
    });
    
    it("非 owner 不应该能够授予或撤销访问权限", async function () {
      await expect(
        contractVerifier.connect(otherAccount).grantAccessToContract(contractId, viewer.address)
      ).to.be.revertedWith("Not owner");
      
      await expect(
        contractVerifier.connect(otherAccount).revokeAccessFromContract(contractId, viewer.address)
      ).to.be.revertedWith("Not owner");
    });
  });
  
  describe("查询功能", function () {
    beforeEach(async function () {
      // 为上传者分配角色
      await contractVerifier.assignUserRole(uploader.address);
      
      // 上传合约
      await contractVerifier.connect(uploader).uploadContract(
        contractId,
        fileHash,
        remark,
        contractType
      );
    });
    
    it("应该能够查询上传者的合约历史", async function () {
      const uploaderHistory = await contractVerifier.getUploaderHistory(uploader.address);
      expect(uploaderHistory.length).to.equal(1);
      expect(uploaderHistory[0]).to.equal(contractId);
    });
    
    it("应该能够验证哈希是否存在", async function () {
      expect(await contractVerifier.isHashExists(fileHash)).to.be.true;
      
      const nonExistentHash = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      expect(await contractVerifier.isHashExists(nonExistentHash)).to.be.false;
    });
    
    it("应该在没有上传合约时抛出错误", async function () {
      const nonExistentId = 999n;
      await expect(
        contractVerifier.getLatestHash(nonExistentId)
      ).to.be.revertedWith("No contract uploaded");
    });
    
    it("应该在请求无效版本时抛出错误", async function () {
      await expect(
        contractVerifier.getHistory(contractId, 1) // 只有一个版本，索引为0
      ).to.be.revertedWith("Invalid version");
    });
  });
});