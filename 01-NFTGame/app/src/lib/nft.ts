import NFTEmojiABI from "contracts/NFTEmoji.json";
import { publicClient, walletClient } from "./blockchain";

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS; // 替换为您的合约地址

/**
 * 铸造NFT
 * @param to 接收地址
 * @returns 返回交易收据
 */
export async function mintNFT(to: string, power: number) {
   // 准备交易请求
   const { request } = await publicClient.simulateContract({
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: NFTEmojiABI.abi,
      functionName: "mint",
      args: [to, power], // 只传入接收地址参数
      account: walletClient.account,
   });

   // 发送交易
   const txHash = await walletClient.writeContract(request);

   // 等待交易确认
   const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
   });

   return receipt;
}
/**
 * 在区块链上销毁NFT
 * @param tokenId 要销毁的NFT ID
 * @returns 返回交易收据
 */
export async function burnNFTOnChain(tokenId: number) {
   // 准备交易请求
   const { request } = await publicClient.simulateContract({
      address: NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: NFTEmojiABI.abi,
      functionName: "burn",
      args: [tokenId],
      account: walletClient.account,
   });

   // 发送交易
   const txHash = await walletClient.writeContract(request);

   // 等待交易确认
   const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
   });

   return receipt;
}
