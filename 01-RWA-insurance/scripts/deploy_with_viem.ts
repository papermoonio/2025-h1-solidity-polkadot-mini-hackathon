import { createPublicClient, createWalletClient, defineChain, hexToBigInt, http, getContract } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { config } from "dotenv"
// import solc from 'solc';
import path from 'path';
import fs from 'fs';

config();

export const localChain = (url: string) => defineChain({
  id: 420420420,
  name: 'Testnet',
  network: 'Testnet',
  nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
  },
  rpcUrls: {
      default: {
          http: [url],
      },
  },
  testnet: true,
})

const PRIVATE_KEY = process.env.LOCAL_PRIV_KEY;
if (!PRIVATE_KEY || !PRIVATE_KEY.startsWith("0x")) {
  throw new Error('PRIVATE_KEY is not defined or does not start with "0x". Please check your environment variables.');
}
console.log(`Private key: ${PRIVATE_KEY}`);

async function deploy(contractName: string, args: any[]) {
  // 读取 ABI 和字节码
  const contractPath = path.join(__dirname, `../artifacts-pvm/contracts/${contractName}.sol/${contractName}.json`);
  const contractData = fs.readFileSync(contractPath, 'utf8');
  const parsedData = JSON.parse(contractData);

  // 检查合约数据是否有效
  if (!parsedData || !parsedData.bytecode) {
    throw new Error(`Invalid contract data: ${contractPath}`);
  }

  const bytecode = parsedData.bytecode;
  const abi = parsedData.abi;

  // console.log(`Bytecode: ${bytecode}`);
  console.log(`ABI: ${JSON.stringify(abi)}`);

  // 使用私钥创建钱包
  const wallet = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  const address = wallet.address
  console.log(`Wallet address: ${address}`);

  // 创建钱包客户端，连接到本地节点
  const url = "http://127.0.0.1:8545"
  const client = createWalletClient({
    account: wallet,
    transport: http(), 
    chain: localChain(url), 
  });

  const publicClient = createPublicClient({
    transport: http(),
    chain: localChain(url),
  });
  console.log('Balance:', await publicClient.getBalance({ address }));
  
  // 调试交易
  // const tx = await client.sendTransaction({
  //   account: wallet,
  //   to: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  //   value: hexToBigInt('0x1000'), 
  // });
  // console.log('Transaction result:', tx);

  // 部署合约
  const contract = await client.deployContract({
    abi: abi,
    bytecode: bytecode,
    args: [] // Removed constructor arguments as the ABI shows no inputs
  });
  console.log('Contract deployment result:', contract);

  // 等待交易完成
  const receipt = await publicClient.waitForTransactionReceipt({ hash: contract });
  return receipt.contractAddress;
}

(async () => {
  try {
    const address = await deploy('DividendToken', [0]);
    console.log(`Contract deployed at address: ${address}`);
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
    } else {
      console.log('An unknown error occurred:', e);
    }
  }
})();