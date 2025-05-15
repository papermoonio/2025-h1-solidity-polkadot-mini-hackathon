"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import Header from "../_components/Header";
import { createWalletClient, custom, parseEther } from "viem";

/**
 * 对战页面组件
 * 处理创建对战和等待其他玩家加入的逻辑
 */
export default function BattlePage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const {
      isConnected,
      walletAddress,
      connectWallet,
      disconnectWallet,
      selectedWallet,
   } = useWalletConnection();

   // 从URL参数中获取NFT信息
   const [nft, setNft] = useState<{
      imageData: string;
      name: string;
      power: number;
   } | null>(null);
   
   const [betAmount, setBetAmount] = useState<string>("0.01");
   const [battleId, setBattleId] = useState<number | null>(null);
   const [isCreatingBattle, setIsCreatingBattle] = useState(false);
   const [error, setError] = useState<string | null>(null);

   // 从URL参数中获取NFT信息
   useEffect(() => {
      if (searchParams) {
         const imageData = searchParams.get("imageData");
         const name = searchParams.get("name");
         const power = searchParams.get("power");
         const bet = searchParams.get("betAmount");

         if (imageData && name && power) {
            setNft({
               imageData,
               name,
               power: parseInt(power),
            });
         }

         if (bet) {
            setBetAmount(bet);
         }
      }
   }, [searchParams]);

   // 从localStorage获取NFT信息
   useEffect(() => {
      const battleDataStr = localStorage.getItem('battleData');
      if (battleDataStr) {
         const battleData = JSON.parse(battleDataStr);
         setNft({
            imageData: battleData.imageData,
            name: battleData.name,
            power: battleData.power,
         });
         setBetAmount(battleData.betAmount);
         
         // 清除localStorage中的数据，避免数据残留
         localStorage.removeItem('battleData');
      }
   }, []);

   /**
    * 创建对战
    * 调用智能合约的startBattle方法
    */
   const createBattle = async () => {
      if (!isConnected || !walletAddress || !nft) {
         setError("请先连接钱包并选择NFT");
         return;
      }

      setIsCreatingBattle(true);
      setError(null);

      try {
         // 检查是否存在以太坊提供者
         if (typeof window === "undefined" || !(window as any).ethereum) {
            throw new Error("未检测到Web3钱包");
         }

         // 创建钱包客户端
         const client = createWalletClient({
            transport: custom((window as any).ethereum),
         });

         // 这里应该调用合约的startBattle方法
         // 由于我们没有实际的合约实例，这里只是模拟
         console.log("创建对战:", {
            nftId: 1, // 实际应用中应该从NFT数据中获取
            betAmount: parseEther(betAmount),
         });

         // 模拟创建成功，获取battleId
         const newBattleId = Math.floor(Math.random() * 1000);
         setBattleId(newBattleId);

         // 实际应用中，这里应该监听合约的BattleStarted事件
         // 并从中获取真实的battleId
      } catch (error) {
         console.error("创建对战失败:", error);
         setError(error instanceof Error ? error.message : "创建对战失败，请重试");
      } finally {
         setIsCreatingBattle(false);
      }
   };

   /**
    * 返回首页
    */
   const goBack = () => {
      router.push("/");
   };

   return (
      <div>
         <Header
            isConnected={isConnected}
            walletAddress={walletAddress}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            selectedWallet={selectedWallet}
         />

         <main className="container mx-auto px-4 py-8">
            <div className="mb-4 flex items-center">
               <button
                  onClick={goBack}
                  className="flex items-center text-purple-300 hover:text-purple-400"
               >
                  <span className="mr-1">←</span> 返回首页
               </button>
            </div>

            <h1 className="mb-6 text-center font-bold text-3xl">斗图对战</h1>

            <div className="mx-auto max-w-2xl rounded-xl bg-white bg-opacity-10 p-6">
               {nft ? (
                  <div className="space-y-6">
                     <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-6 md:space-y-0">
                        <div className="h-32 w-32 overflow-hidden rounded-lg">
                           <img
                              src={nft.imageData}
                              alt={nft.name}
                              className="h-full w-full object-cover"
                           />
                        </div>
                        <div className="text-center md:text-left">
                           <h2 className="mb-2 font-bold text-xl">{nft.name}</h2>
                           <p className="text-yellow-400">战力: {nft.power}</p>
                           <p className="mt-2 text-purple-300">
                              押金: {betAmount} ETH
                           </p>
                        </div>
                     </div>

                     {battleId ? (
                        <div className="rounded-lg bg-green-500 bg-opacity-20 p-4 text-center">
                           <h3 className="mb-2 font-bold text-green-300">
                              对战已创建成功！
                           </h3>
                           <p className="text-white">
                              对战ID: {battleId}
                           </p>
                           <p className="mt-4 text-gray-300">
                              等待其他玩家加入对战...
                           </p>
                           <p className="mt-2 text-sm text-gray-400">
                              (实际应用中，这里应该显示一个二维码或链接，让其他玩家可以扫码加入)
                           </p>
                        </div>
                     ) : (
                        <>
                           {error && (
                              <div className="rounded-lg bg-red-500 bg-opacity-20 p-4 text-center text-red-300">
                                 {error}
                              </div>
                           )}

                           <button
                              onClick={createBattle}
                              disabled={isCreatingBattle}
                              className={`w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-bold text-lg text-white shadow-lg transition-all hover:from-purple-700 hover:to-pink-700 ${
                                 isCreatingBattle
                                    ? "cursor-not-allowed opacity-70"
                                    : "transform hover:scale-[1.02]"
                              }`}
                           >
                              {isCreatingBattle
                                 ? "创建中..."
                                 : "创建对战房间"}
                           </button>
                        </>
                     )}
                  </div>
               ) : (
                  <div className="py-12 text-center text-gray-400">
                     未找到NFT信息，请返回首页重新选择
                  </div>
               )}
            </div>
         </main>
      </div>
   );
}