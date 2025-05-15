"use client";

import { api } from "@/trpc/react";
import { useState } from "react";
import { createWalletClient, custom, hashMessage, verifyMessage } from "viem";
interface NFTGalleryProps {
   isConnected: boolean;
   walletAddress?: string;
   onSelectNFT?: (nft: {
      imageData: string;
      name: string;
      power: number;
   }) => void;
}

/**
 * NFT展示区组件
 * 展示用户铸造的NFT表情包
 */
export default function NFTGallery({
   isConnected,
   walletAddress,
   onSelectNFT,
}: NFTGalleryProps) {
   const [isManageMode, setIsManageMode] = useState(false);

   const { data: nfts, isLoading: isLoadingNFTs } =
      api.nft.getNFTsByOwner.useQuery(
         { ownerAddress: walletAddress || "" },
         {
            enabled: isConnected && !!walletAddress,
         },
      );

   // 获取utils用于刷新缓存
   const utils = api.useUtils();

   // 创建删除NFT的mutation
   const deleteNFTMutation = api.nft.deleteNFT.useMutation({
      onSuccess: () => {
         // 删除成功后刷新NFT列表
         void utils.nft.getNFTsByOwner.invalidate();
         alert("NFT删除成功！");
      },
      onError: (error) => {
         console.error("删除NFT失败:", error);
         alert(error.message || "删除NFT失败，请重试");
      },
   });

   /**
    * 生成删除NFT的签名消息
    * @param tokenId NFT的唯一标识
    * @returns 待签名的消息
    */
   const generateDeleteMessage = (tokenId: number) => {
      return `删除NFT确认\n\nToken ID: ${tokenId}\n钱包地址: ${walletAddress}\n时间戳: ${Date.now()}\n\n此操作不可撤销`;
   };

   /**
    * 处理删除NFT的函数
    * 需要用户先进行签名确认
    */
   const handleDeleteNFT = async (tokenId: number) => {
      if (!walletAddress) return;

      if (confirm("确定要删除这个NFT吗？")) {
         try {
            // 检查是否存在以太坊提供者
            if (typeof window === "undefined" || !(window as any).ethereum) {
               throw new Error("未检测到Web3钱包");
            }

            // 创建钱包客户端
            const client = createWalletClient({
               transport: custom((window as any).ethereum),
            });

            // 生成待签名消息
            const message = generateDeleteMessage(tokenId);
            const messageHash = hashMessage(message);

            // 请求用户签名
            const signature = await client.signMessage({
               message,
               account: walletAddress as `0x${string}`,
            });

            // 验证签名
            const isValid = await verifyMessage({
               message,
               signature,
               address: walletAddress as `0x${string}`,
            });

            if (!isValid) {
               throw new Error("签名验证失败");
            }

            // 签名验证通过，执行删除操作
            await deleteNFTMutation.mutateAsync({
               tokenId,
               ownerAddress: walletAddress,
            });
         } catch (error) {
            console.error("删除NFT失败:", error);
            alert(
               error instanceof Error ? error.message : "删除NFT失败，请重试",
            );
         }
      }
   };

   return (
      <section className="mb-12">
         <div className="mb-6 flex items-center justify-between">
            <h2 className="font-bold text-2xl">我铸造的NFT表情包</h2>
            <button
               onClick={() => setIsManageMode(!isManageMode)}
               className={`text-sm underline hover:cursor-pointer ${isManageMode ? "text-red-400" : ""}`}
            >
               {isManageMode ? "完成管理" : "管理我的表情包"}
            </button>
         </div>
         <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {isConnected ? (
               <>
                  {isLoadingNFTs ? (
                     <div className="col-span-3 py-12 text-center">
                        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-gray-300 border-b-2"></div>
                        <p className="mt-4 text-gray-400">正在加载NFT列表...</p>
                     </div>
                  ) : nfts && nfts.length > 0 ? (
                     <>
                        {nfts.map((nft) => (
                           <div
                              key={nft.tokenId}
                              className="group relative cursor-pointer rounded-xl bg-white bg-opacity-10 p-4 transition-all hover:bg-opacity-20"
                           >
                              {isManageMode && (
                                 <button
                                    className="-top-2 -right-2 absolute z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       void handleDeleteNFT(nft.tokenId);
                                    }}
                                 >
                                    ×
                                 </button>
                              )}
                              <div className="mb-4 aspect-square overflow-hidden rounded-lg">
                                 <img
                                    src={nft.imageData}
                                    alt={nft.name}
                                    className="h-full w-full object-cover"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <h3 className="font-bold text-lg">
                                    {nft.name}
                                 </h3>
                                 <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-300">
                                       稀有度: {nft.rarity}%
                                    </span>
                                    <span className="text-yellow-400">
                                       搞笑值: {nft.power}
                                    </span>
                                 </div>
                                 <div className="flex items-center justify-between">
                                    <button
                                       className="rounded-full bg-blue-500 px-4 py-2 text-sm text-white transition-all hover:bg-blue-600"
                                       onClick={(e) => {
                                          e.stopPropagation(); // 阻止事件冒泡
                                          onSelectNFT?.({
                                             imageData: nft.imageData,
                                             name: nft.name,
                                             power: nft.power,
                                          });
                                       }}
                                    >
                                       去战斗
                                    </button>
                                    <button className="rounded-full bg-purple-500 px-4 py-2 text-sm text-white transition-all hover:bg-purple-600">
                                       交易
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </>
                  ) : (
                     // 没有NFT时显示提示
                     <div className="col-span-3 py-12 text-center text-gray-400">
                        您还没有铸造任何NFT表情包
                     </div>
                  )}
               </>
            ) : (
               <div className="col-span-3 py-12 text-center text-gray-400">
                  请连接钱包以查看您的NFT表情包
               </div>
            )}
         </div>
      </section>
   );
}
