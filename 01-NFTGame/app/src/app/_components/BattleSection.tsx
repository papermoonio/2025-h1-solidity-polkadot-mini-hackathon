"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BattleSectionProps {
   isConnected: boolean;
   nft: {
      imageData: string;
      name: string;
      power: number;
   } | null;
   onSelectNFT: (
      nft: {
         imageData: string;
         name: string;
         power: number;
      } | null,
   ) => void;
}

/**
 * 对战区域组件
 * 展示对战入口和选中的NFT
 */
export default function BattleSection({
   isConnected,
   nft,
   onSelectNFT,
}: BattleSectionProps) {
   const router = useRouter();
   const [betAmount, setBetAmount] = useState<string>("0.01");

   /**
    * 处理开始对战按钮点击
    * 使用 localStorage 存储数据并跳转到对战页面
    */
   const handleStartBattle = () => {
      if (!nft) return;
      
      // 将NFT信息存储到localStorage
      const battleData = {
         imageData: nft.imageData,
         name: nft.name,
         power: nft.power,
         betAmount: betAmount
      };
      
      localStorage.setItem('battleData', JSON.stringify(battleData));
      
      // 跳转到对战页面（不带参数）
      router.push('/battle');
   };

   return (
      <section>
         <h2 className="mb-6 font-bold text-2xl">开始对战</h2>
         <div className="rounded-xl bg-white bg-opacity-10 p-6">
            {isConnected ? (
               <div className="space-y-6">
                  {nft && (
                     <div className="mb-4 flex items-center space-x-4 rounded-lg bg-white bg-opacity-20 p-4">
                        <div className="h-20 w-20 overflow-hidden rounded-lg">
                           <img
                              src={nft.imageData}
                              alt={nft.name}
                              className="h-full w-full object-cover"
                           />
                        </div>
                        <div>
                           <h3 className="font-bold">{nft.name}</h3>
                           <p className="text-yellow-400">战力: {nft.power}</p>
                        </div>
                        <button
                           className="ml-auto rounded-full bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
                           onClick={() => onSelectNFT(null)}
                        >
                           取消选择
                        </button>
                     </div>
                  )}
                  
                  {nft && (
                     <div className="mb-4">
                        <label className="mb-2 block font-medium text-purple-200 text-sm">
                           设置押金金额 (ETH)
                        </label>
                        <input
                           type="number"
                           value={betAmount}
                           onChange={(e) => setBetAmount(e.target.value)}
                           min="0.001"
                           step="0.001"
                           className="w-full rounded-lg border border-purple-500/30 bg-gray-700 p-2 text-gray-200 focus:border-purple-500 focus:outline-none"
                        />
                     </div>
                  )}
                  
                  <button
                     className={`rounded-full bg-pink-500 px-8 py-3 font-bold text-lg text-white transition-all hover:bg-pink-600 ${!nft ? "cursor-not-allowed opacity-50" : ""}`}
                     disabled={!nft}
                     onClick={handleStartBattle}
                  >
                     开始斗图对战
                  </button>
               </div>
            ) : (
               <p className="text-center text-gray-400">
                  请先连接钱包以开始游戏
               </p>
            )}
         </div>
      </section>
   );
}
