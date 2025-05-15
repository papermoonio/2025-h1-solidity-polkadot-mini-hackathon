"use client";

interface MarketSectionProps {
   isConnected: boolean;
   walletAddress?: string;
}

/**
 * NFT市场区域组件
 * 展示用户可出售的NFT和市场上的NFT
 */
export default function MarketSection({ isConnected }: MarketSectionProps) {
   return (
      <section className="mt-12">
         <h2 className="mb-6 font-bold text-2xl">NFT市场</h2>
         <div className="rounded-xl bg-white bg-opacity-10 p-6">
            {isConnected ? (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                     {/* 我的出售列表 */}
                     <div className="rounded-lg bg-white bg-opacity-10 p-4">
                        <h3 className="mb-4 font-semibold text-xl">我的出售</h3>
                        <div className="py-8 text-center text-gray-400">
                           暂无出售中的NFT
                        </div>
                     </div>

                     {/* 市场列表 */}
                     <div className="rounded-lg bg-white bg-opacity-10 p-4">
                        <h3 className="mb-4 font-semibold text-xl">市场列表</h3>
                        <div className="py-8 text-center text-gray-400">
                           暂无可购买的NFT
                        </div>
                     </div>
                  </div>
               </div>
            ) : (
               <p className="py-12 text-center text-gray-400">
                  请先连接钱包以访问NFT市场
               </p>
            )}
         </div>
      </section>
   );
}
