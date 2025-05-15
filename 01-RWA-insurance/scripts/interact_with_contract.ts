import { createPublicClient, createWalletClient, defineChain, http, getContract } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";
import path from "path";
import fs from "fs";

config();

export const localChain = (url: string) => defineChain({
  id: 420420420,
  name: "Testnet",
  network: "Testnet",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [url],
    },
  },
  testnet: true,
});

const PRIVATE_KEY = process.env.LOCAL_PRIV_KEY;
if (!PRIVATE_KEY || !PRIVATE_KEY.startsWith("0x")) {
  throw new Error('PRIVATE_KEY is not defined or does not start with "0x". Please check your environment variables.');
}

async function interact(contractAddress: string, contractName: string) {
  // Read ABI
  const contractPath = path.join(__dirname, `../artifacts-pvm/contracts/${contractName}.sol/${contractName}.json`);
  const contractData = fs.readFileSync(contractPath, "utf8");
  const parsedData = JSON.parse(contractData);

  const abi = parsedData.abi;

  // Create wallet and public clients
  const wallet = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
  const address = wallet.address;
  console.log(`Wallet address: ${address}`);

  const url = "http://127.0.0.1:8545";
  const client = createWalletClient({
    account: wallet,
    transport: http(),
    chain: localChain(url),
  });

  const publicClient = createPublicClient({
    transport: http(),
    chain: localChain(url),
  });

  // Interact with the contract
  const contract = getContract({
    address: contractAddress as `0x${string}`,
    abi: abi,
    client, // Use the client directly
  });

  // Example: Call a function to get the total supply
  const totalSupply = await contract.read.totalSupply([]); // Explicitly pass an empty array for args
  console.log("Total Supply:", totalSupply);

  // Example: Call a function to get the balance of the wallet
  const balance = await contract.read.balanceOf([address]);
  console.log("Balance of wallet:", balance);

  // Example: Send a transaction to mint tokens
  const mintTx = await contract.write.mint([address, BigInt(1000)]);
  console.log("Mint transaction hash:", mintTx);

  // Wait for the transaction to be mined using the public client
  const receipt = await publicClient.waitForTransactionReceipt({ hash: mintTx });
  console.log("Mint transaction receipt:", receipt);
}

(async () => {
  try {
    const contractAddress = "0xc01ee7f10ea4af4673cfff62710e1d7792aba8f3"; // Replace with the deployed contract address
    const contractName = "DividendToken";
    await interact(contractAddress, contractName);
  } catch (e) {
    if (e instanceof Error) {
      console.log(e.message);
    } else {
      console.log("An unknown error occurred:", e);
    }
  }
})();
