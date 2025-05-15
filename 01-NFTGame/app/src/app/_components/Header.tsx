"use client";

import { useState } from "react";

interface HeaderProps {
   isConnected: boolean;
   walletAddress: string;
   onConnect: () => void; // 连接钱包函数，现在是同步的，只显示钱包选择框
   onDisconnect: () => void;
   selectedWallet?: string; // 选中的钱包类型
   getAccounts?: () => Promise<string[]>; // 获取所有账户的方法
   switchAccount?: (address: string) => Promise<void>; // 切换账户的方法
}

/**
 * 页面头部组件
 * 包含标题和钱包连接功能
 */
export default function Header({
   isConnected,
   walletAddress,
   onConnect,
   onDisconnect,
   selectedWallet,
   getAccounts,
   switchAccount,
}: HeaderProps) {
   const [showAccountModal, setShowAccountModal] = useState(false);
   const [accounts, setAccounts] = useState<string[]>([]);
   const [isLoading, setIsLoading] = useState(false);

   // 获取账户列表
   const fetchAccounts = async () => {
      if (!getAccounts) return;
      setIsLoading(true);
      try {
         const accountList = await getAccounts();
         setAccounts(accountList);
      } catch (error) {
         console.error("获取账户列表失败:", error);
      } finally {
         setIsLoading(false);
      }
   };

   // 打开账户切换模态框
   const handleAccountSwitch = async () => {
      setShowAccountModal(true);
      await fetchAccounts();
   };

   // 切换到选择的账户
   const handleSelectAccount = async (address: string) => {
      if (!switchAccount) return;
      try {
         await switchAccount(address);
         setShowAccountModal(false);
      } catch (error) {
         console.error("切换账户失败:", error);
      }
   };

   return (
      <header className="container mx-auto px-4 py-8">
         <h1 className="mb-2 text-center font-bold text-4xl">NFT斗图游戏</h1>
         <p className="mb-8 text-center text-xl">
            铸造、交易并使用你的NFT表情包进行对战，获得Gamer代币奖励
         </p>

         <div className="flex justify-center">
            {!isConnected ? (
               <button
                  onClick={onConnect}
                  className="rounded-full bg-yellow-500 px-6 py-3 font-bold text-black text-lg transition-all hover:bg-yellow-600"
               >
                  连接钱包
               </button>
            ) : (
               <div className="flex items-center space-x-4">
                  <div className="relative">
                     <button
                        onClick={handleAccountSwitch}
                        className="flex items-center rounded-full bg-green-500 px-4 py-2 text-white transition-all hover:bg-green-600"
                     >
                        {selectedWallet && (
                           <span className="mr-2 text-sm">
                              {selectedWallet}
                           </span>
                        )}
                        {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                     </button>

                     {/* 账户切换模态框 */}
                     {showAccountModal && (
                        <div className="absolute top-full z-50 mt-2 w-72 rounded-lg border border-gray-700 bg-gray-800 shadow-xl">
                           <div className="p-4">
                              <h3 className="mb-4 font-semibold text-lg text-white">
                                 选择账户
                              </h3>
                              {isLoading ? (
                                 <div className="py-4 text-center text-gray-400">
                                    加载中...
                                 </div>
                              ) : accounts.length === 0 ? (
                                 <div className="py-4 text-center text-gray-400">
                                    没有可用账户
                                 </div>
                              ) : (
                                 <div className="space-y-2">
                                    {accounts.map((account) => (
                                       <button
                                          key={account}
                                          onClick={() =>
                                             handleSelectAccount(account)
                                          }
                                          className={`w-full rounded px-4 py-2 text-left transition-colors ${account.toLowerCase() === walletAddress.toLowerCase() ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"}`}
                                       >
                                          {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                                          {account.toLowerCase() ===
                                             walletAddress.toLowerCase() && (
                                                <span className="ml-2 rounded-full bg-green-500 px-2 py-1 text-white text-xs">
                                                   当前账户
                                                </span>
                                             )}
                                       </button>
                                    ))}
                                 </div>
                              )}
                              <div className="mt-4 flex justify-end">
                                 <button
                                    onClick={() => setShowAccountModal(false)}
                                    className="text-gray-400 text-sm hover:text-white"
                                 >
                                    关闭
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </header>
   );
}
