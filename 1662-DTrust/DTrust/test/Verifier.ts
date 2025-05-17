import { expect } from "chai";
import hre from "hardhat";
import { parseAbi, parseEther } from "viem";
import { defineChain } from "viem";
import { getContract } from "viem";

describe("ContractVerifier (Real chain interaction)", function () {
  const CONTRACT_ADDRESS = "0xc01Ee7f10EA4aF4673cFff62710E1D7792aBa8f3";
  const CONTRACT_ABI = parseAbi([
    "function uploadContract(uint256 contractId, bytes32 fileHash, string remark, string contractType) external",
    "function getLatestHash(uint256 contractId) view returns (bytes32)",
  ]);

  const polkavmChain = defineChain({
    id: 420420420,
    name: 'PolkaVM Local',
    nativeCurrency: { name: 'Unit', symbol: 'UNIT', decimals: 18 },
    rpcUrls: {
      default: { http: ['http://127.0.0.1:8545'] },
      public: { http: ['http://127.0.0.1:8545'] },
    },
  });

  it("should upload a contract file hash", async function () {
    // ✅ 修复点：指定 chain 参数
    const [walletClient] = await hre.viem.getWalletClients({ chain: polkavmChain });

    // 推荐：使用合约名称
    const contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      client: { wallet: walletClient, chain: polkavmChain },
    });
    
    const contractId = 1001;
    const fileHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("dummy-file"));
    const remark = "Initial upload";
    const contractType = "SalesAgreement";

    const hash = await contract.write.uploadContract([contractId, fileHash, remark, contractType]);
    console.log("Tx sent:", hash);


    // 等待上链
    const publicClient = await hre.viem.getPublicClient();
    await publicClient.waitForTransactionReceipt({ hash });

    // 验证数据
    const latestHash = await contract.read.getLatestHash([contractId]);
    expect(latestHash).to.equal(fileHash);
  });
});
