import type { MetaMaskInpageProvider } from "@metamask/providers";
import { useEffect, useState } from "react";
import { createWalletClient, custom } from "viem";

/**
 * 支持的钱包类型
 */
interface WalletProvider {
   name: string;
   icon: string;
   check: () => boolean;
   connector: () => Promise<any>;
}

/**
 * 支持的钱包列表配置
 */
const SUPPORTED_WALLETS: WalletProvider[] = [
   {
      name: "MetaMask",
      icon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
      check: () =>
         typeof window !== "undefined" &&
         !!(window as any).ethereum?.isMetaMask,
      connector: async () => (window as any).ethereum as MetaMaskInpageProvider,
   },
   {
      name: "Coinbase Wallet",
      icon: "/Coinbase Wallet.svg",
      check: () =>
         typeof window !== "undefined" &&
         !!(window as any).ethereum?.isCoinbaseWallet,
      connector: async () => (window as any).ethereum as MetaMaskInpageProvider,
   },
   {
      name: "Trust Wallet",
      icon: "/Trust Wallet.jpg",
      check: () =>
         typeof window !== "undefined" && !!(window as any).ethereum?.isTrust,
      connector: async () => (window as any).ethereum as MetaMaskInpageProvider,
   },
];

/**
 * 钱包连接Hook
 * 处理多种以太坊钱包的连接、断开连接等操作
 * @returns {Object} 钱包连接状态和操作方法
 */
export function useWalletConnection() {
   const [walletAddress, setWalletAddress] = useState<string>("");
   const [isConnected, setIsConnected] = useState<boolean>(false);
   const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
   const [selectedWallet, setSelectedWallet] = useState<string>("");

   /**
    * 检查钱包连接状态
    * 在组件加载时恢复之前保存的钱包状态
    */
   useEffect(() => {
      const checkWalletConnection = async () => {
         if (typeof window !== "undefined") {
            const storedAddress = localStorage.getItem("walletAddress");
            const storedConnected = localStorage.getItem("walletConnected");

            if (storedAddress && storedConnected === "true") {
               try {
                  const provider = (window as any)
                     .ethereum as MetaMaskInpageProvider;
                  const accounts = (await provider.request({
                     method: "eth_accounts",
                  })) as string[];

                  if (
                     accounts &&
                     accounts[0] &&
                     accounts[0].toLowerCase() === storedAddress.toLowerCase()
                  ) {
                     setWalletAddress(storedAddress);
                     setIsConnected(true);
                  } else {
                     localStorage.removeItem("walletAddress");
                     localStorage.removeItem("walletConnected");
                  }
               } catch (error) {
                  console.error("检查钱包状态时出错:", error);
                  localStorage.removeItem("walletAddress");
                  localStorage.removeItem("walletConnected");
               }
            }
         }
      };

      checkWalletConnection();
   }, []);

   /**
    * 连接指定的钱包
    * @param walletName 要连接的钱包名称
    */
   const connectSpecificWallet = async (walletName: string) => {
      try {
         const wallet = SUPPORTED_WALLETS.find((w) => w.name === walletName);
         if (!wallet) {
            throw new Error("不支持的钱包类型");
         }

         if (!wallet.check()) {
            window.open(getWalletInstallUrl(walletName), "_blank");
            throw new Error(`请先安装 ${walletName}`);
         }

         const provider = await wallet.connector();
         await provider.request({
            method: "eth_requestAccounts",
         });

         const client = createWalletClient({
            transport: custom(provider),
         });

         const [address] = await client.getAddresses();

         if (!address) {
            throw new Error("未能获取钱包地址");
         }

         setWalletAddress(address);
         setIsConnected(true);
         setSelectedWallet(walletName);
         setShowWalletModal(false);

         localStorage.setItem("walletAddress", address);
         localStorage.setItem("walletConnected", "true");
         localStorage.setItem("selectedWallet", walletName);
      } catch (error) {
         if ((error as any).code === 4001) {
            alert("用户拒绝了连接请求");
         } else if ((error as any).code === -32002) {
            alert("钱包连接请求正在处理中，请检查钱包");
         } else {
            console.error("连接钱包失败:", error);
            alert(
               error instanceof Error
                  ? error.message
                  : "连接钱包时发生错误，请稍后重试",
            );
         }
      }
   };

   /**
    * 获取钱包安装链接
    * @param walletName 钱包名称
    * @returns 安装链接
    */
   const getWalletInstallUrl = (walletName: string): string => {
      switch (walletName) {
         case "MetaMask":
            return "https://metamask.io/download/";
         case "Coinbase Wallet":
            return "https://www.coinbase.com/wallet/downloads";
         case "WalletConnect":
            return "https://walletconnect.com/";
         case "Trust Wallet":
            return "https://trustwallet.com/download";
         default:
            return "";
      }
   };

   /**
    * 连接钱包
    * 显示钱包选择对话框
    */
   const connectWallet = () => {
      setShowWalletModal(true);
   };

   /**
    * 断开钱包连接
    * 清除本地状态并通知用户
    */
   const disconnectWallet = () => {
      setWalletAddress("");
      setIsConnected(false);
      setSelectedWallet("");

      if (typeof window !== "undefined") {
         localStorage.removeItem("walletConnected");
         localStorage.removeItem("walletAddress");
         localStorage.removeItem("selectedWallet");
      }

      console.log("钱包已断开连接");
      alert("钱包已断开连接");
   };

   return {
      walletAddress,
      isConnected,
      connectWallet,
      disconnectWallet,
      showWalletModal,
      setShowWalletModal,
      connectSpecificWallet,
      selectedWallet,
      supportedWallets: SUPPORTED_WALLETS,
      /**
       * 获取所有可用账户（主动请求授权）
       * @returns Promise<string[]> 所有账户地址
       */
      getAccounts: async () => {
         if (typeof window === "undefined" || !(window as any).ethereum) {
            return [];
         }
         try {
            const provider = (window as any).ethereum as MetaMaskInpageProvider;
            // 主动请求授权，弹窗让用户勾选多个账户
            const accounts = (await provider.request({
               method: "eth_requestAccounts",
            })) as string[];
            return accounts || [];
         } catch (error) {
            console.error("获取账户列表失败:", error);
            return [];
         }
      },
      /**
       * 切换当前钱包账户
       * @param address 目标账户地址
       */
      switchAccount: async (address: string) => {
         if (!address) return;
         setWalletAddress(address);
         localStorage.setItem("walletAddress", address);
      },
   };
}
