"use client";

import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useState } from "react";
import BattleSection from "./_components/BattleSection";
import Header from "./_components/Header";
import MarketSection from "./_components/MarketSection";
import MintSection from "./_components/MintSection";
import NFTGallery from "./_components/NFTGallery";

/**
 * NFT斗图游戏首页
 * 使用自定义Hook管理钱包连接功能
 */
export default function Home() {
   const {
      isConnected,
      walletAddress,
      connectWallet,
      disconnectWallet,
      selectedWallet,
      showWalletModal,
      setShowWalletModal,
      connectSpecificWallet,
      supportedWallets,
   } = useWalletConnection();

   const [selectedNFT, setSelectedNFT] = useState<{
      imageData: string;
      name: string;
      power: number;
   } | null>(null);

   return (
      <div>
         <Header
            isConnected={isConnected}
            walletAddress={walletAddress}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            selectedWallet={selectedWallet}
         />

         {/* 钱包选择模态框 */}
         {showWalletModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
               <div className="w-full max-w-md rounded-xl bg-gray-800 p-6">
                  <h3 className="mb-4 font-bold text-xl">选择钱包</h3>
                  <div className="space-y-3">
                     {supportedWallets.map((wallet) => (
                        <button
                           key={wallet.name}
                           onClick={() => connectSpecificWallet(wallet.name)}
                           className="flex w-full items-center space-x-3 rounded-lg bg-gray-700 p-3 transition-colors hover:bg-gray-600"
                        >
                           <img
                              src={wallet.icon}
                              alt={wallet.name}
                              className="h-8 w-8"
                           />
                           <span>{wallet.name}</span>
                        </button>
                     ))}
                  </div>
                  <button
                     onClick={() => setShowWalletModal(false)}
                     className="mt-4 w-full rounded-lg bg-red-500 py-2 text-white hover:bg-red-600"
                  >
                     取消
                  </button>
               </div>
            </div>
         )}

         <main className="container mx-auto px-4 py-8">
            <MintSection
               isConnected={isConnected}
               walletAddress={walletAddress}
            />
            <NFTGallery
               isConnected={isConnected}
               walletAddress={walletAddress}
               onSelectNFT={setSelectedNFT}
            />
            <BattleSection
               isConnected={isConnected}
               nft={selectedNFT}
               onSelectNFT={setSelectedNFT}
            />
            <MarketSection
               isConnected={isConnected}
               walletAddress={walletAddress}
            />
         </main>
      </div>
   );
}
