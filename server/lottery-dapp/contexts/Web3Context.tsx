"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { ethers } from "ethers"
import { useToast } from "../components/ui/use-toast"
import { SUPPORTED_NETWORKS, getCurrentNetworkInfo } from "../services/contracts"

interface Web3ContextType {
  provider: ethers.Provider | null
  signer: ethers.Signer | null
  account: string | null
  chainId: number | null
  networkName: string | null
  isConnected: boolean
  isNetworkSupported: boolean
  isCorrectNetwork: boolean
  disconnecting: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchNetwork: (chainId: number) => Promise<boolean>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children }: { children: React.ReactNode }) {
  // 默认提供商 - 使用公共RPC
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [browserProvider, setBrowserProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const { toast } = useToast();

  const isConnected = !!account;
  const isNetworkSupported = chainId !== null && getCurrentNetworkInfo(chainId) !== null;
  const isCorrectNetwork = chainId === 1287;

  // 检查MetaMask是否存在
  const isMetaMaskAvailable = () => {
    return typeof window !== "undefined" && window.ethereum !== undefined;
  };

  // 初始化默认provider
  useEffect(() => {
    try {
      // 默认使用以太坊主网的公共RPC
      const defaultProvider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
      setProvider(defaultProvider);
    } catch (error) {
      console.error("初始化默认Provider失败:", error);
    }
  }, []);

  // 监听网络和账户变化
  useEffect(() => {
    if (!isMetaMaskAvailable()) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      console.log("账户变化:", accounts);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        if (browserProvider) {
          try {
            const updatedSigner = await browserProvider.getSigner();
            setSigner(updatedSigner);
          } catch (error) {
            console.error("获取Signer失败:", error);
          }
        }
      } else {
        // 账户断开
        setAccount(null);
        setSigner(null);
        localStorage.removeItem('isWalletConnected');
      }
    };

    const handleChainChanged = async (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      console.log("网络变化:", newChainId);
      setChainId(newChainId);
      
      // 获取网络名称
      const networkInfo = getCurrentNetworkInfo(newChainId);
      setNetworkName(networkInfo?.name || `Chain ID: ${newChainId}`);
      
      // 更新Signer和Provider
      if (browserProvider) {
        try {
          // 检查用户是否已经连接
          const accounts = await browserProvider.listAccounts();
          if (accounts.length > 0) {
            const updatedSigner = await browserProvider.getSigner();
            setSigner(updatedSigner);
            
            // 提示网络变化
            toast({
              title: "网络已切换",
              description: `当前网络: ${networkInfo?.name || `Chain ID: ${newChainId}`}`,
            });
            
            // 如果是支持的网络，更新RPC Provider为该网络的RPC
            if (networkInfo) {
              try {
                const networkProvider = new ethers.JsonRpcProvider(networkInfo.rpcUrl);
                setProvider(networkProvider);
              } catch (error) {
                console.error("设置网络Provider失败:", error);
              }
            }
          }
        } catch (error) {
          console.error("更新Signer失败:", error);
        }
      }
    };

    if (window.ethereum.on) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
    
    return undefined;
  }, [browserProvider, toast]);

  // 初始化Provider和检查是否已连接
  useEffect(() => {
    const initProvider = async () => {
      if (!isMetaMaskAvailable()) {
        console.log("MetaMask未安装，使用默认Provider");
        return;
      }

      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setBrowserProvider(web3Provider);
        
        // 检查当前网络
        const network = await web3Provider.getNetwork();
        const currentChainId = Number(network.chainId);
        setChainId(currentChainId);
        
        // 获取网络名称
        const networkInfo = getCurrentNetworkInfo(currentChainId);
        setNetworkName(networkInfo?.name || `Chain ID: ${currentChainId}`);
        
        // 如果是支持的网络，更新Provider
        if (networkInfo) {
          try {
            const networkProvider = new ethers.JsonRpcProvider(networkInfo.rpcUrl);
            setProvider(networkProvider);
          } catch (error) {
            console.error("设置网络Provider失败:", error);
          }
        }
        
        // 检查是否有已连接的账户
        const isWalletConnected = localStorage.getItem('isWalletConnected') === 'true';
        
        if (isWalletConnected) {
          // 只有在之前连接过的情况下才自动获取账户
          try {
            const accounts = await web3Provider.listAccounts();
            if (accounts.length > 0) {
              const newSigner = await web3Provider.getSigner();
              setSigner(newSigner);
              setAccount(accounts[0].address);
              
              console.log("已自动连接到账户:", accounts[0].address);
              console.log("当前网络:", currentChainId);
            }
          } catch (error) {
            console.error("自动连接账户失败:", error);
            localStorage.removeItem('isWalletConnected');
          }
        }
      } catch (error) {
        console.error("初始化Web3Provider失败:", error);
      }
    };

    initProvider();
  }, []);

  // 连接钱包
  const connectWallet = async () => {
    if (!isMetaMaskAvailable()) {
      toast({
        title: "MetaMask未安装",
        description: "请安装MetaMask钱包后再尝试连接",
        variant: "destructive",
      });
      return;
    }

    // 重新初始化Provider以防刚安装MetaMask
    if (!browserProvider) {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      setBrowserProvider(web3Provider);
    }
    
    try {
      console.log("正在请求账户...");
      // 请求连接
      await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (!browserProvider) return;
      
      // 获取账户信息
      const accounts = await browserProvider.listAccounts();
      if (accounts.length === 0) {
        toast({
          title: "连接失败",
          description: "未能获取钱包账户",
          variant: "destructive",
        });
        return;
      }
      
      const newSigner = await browserProvider.getSigner();
      setSigner(newSigner);
      setAccount(accounts[0].address);
      
      // 检查当前网络
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      
      // 获取网络名称
      const networkInfo = getCurrentNetworkInfo(currentChainId);
      setNetworkName(networkInfo?.name || `Chain ID: ${currentChainId}`);
      
      // 如果是支持的网络，更新Provider
      if (networkInfo) {
        try {
          const networkProvider = new ethers.JsonRpcProvider(networkInfo.rpcUrl);
          setProvider(networkProvider);
        } catch (error) {
          console.error("设置网络Provider失败:", error);
        }
      }
      
      // 保存连接状态
      localStorage.setItem('isWalletConnected', 'true');
      
      console.log("连接成功:", accounts[0].address);
      console.log("当前网络:", currentChainId);
      
      toast({
        title: "连接成功",
        description: `钱包已连接: ${accounts[0].address.substring(0, 6)}...${accounts[0].address.substring(accounts[0].address.length - 4)}`,
      });
      
      // 如果当前网络不支持，提示用户
      if (!networkInfo) {
        toast({
          title: "网络提示",
          description: `当前网络 (Chain ID: ${currentChainId}) 不在支持列表中，部分功能可能不可用`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("连接钱包失败:", error);
      toast({
        title: "连接失败",
        description: "连接钱包时发生错误",
        variant: "destructive",
      });
    }
  };

  // 切换网络
  const switchNetwork = async (targetChainId: number) => {
    if (!isMetaMaskAvailable()) {
      toast({
        title: "MetaMask未安装",
        description: "请安装MetaMask钱包后再尝试切换网络",
        variant: "destructive",
      });
      return false;
    }

    const networkInfo = getCurrentNetworkInfo(targetChainId);
    if (!networkInfo) {
      toast({
        title: "不支持的网络",
        description: `链ID ${targetChainId} 不在支持的网络列表中`,
        variant: "destructive",
      });
      return false;
    }

    try {
      // 确保window.ethereum存在
      if (!window.ethereum) throw new Error("MetaMask不可用");
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (error: any) {
      // 如果网络不存在，尝试添加
      if (error.code === 4902 && window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: networkInfo.name,
              nativeCurrency: {
                name: networkInfo.symbol,
                symbol: networkInfo.symbol,
                decimals: networkInfo.decimals || 18
              },
              rpcUrls: [networkInfo.rpcUrl],
              blockExplorerUrls: networkInfo.explorer ? [networkInfo.explorer] : undefined
            }]
          });
          return true;
        } catch (addError) {
          console.error('添加网络失败', addError);
          toast({
            title: "添加网络失败",
            description: '无法添加网络，请检查权限或手动切换',
            variant: "destructive",
          });
          return false;
        }
      }
      console.error('切换网络失败', error);
      toast({
        title: "切换网络失败",
        description: error.message || '未知错误',
        variant: "destructive",
      });
      return false;
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    // 设置断开连接中状态为true
    setDisconnecting(true);
    
    // MetaMask、OKX等大多数Web3钱包不支持程序化断开连接
    // 只能清除本地状态，钱包插件可能仍认为已连接
    setAccount(null);
    setSigner(null);
    
    // 清除连接状态
    localStorage.removeItem('isWalletConnected');
    
    // 显示提示，告知用户需要从钱包插件完全断开
    toast({
      title: "应用已断开连接",
      description: "注意：大多数钱包(如OKX)需要您在钱包插件中手动断开连接。请在钱包插件中断开网站连接以完全断开。",
    });
    
    console.log("应用已断开钱包连接，但钱包插件可能仍认为已连接");
    
    // 添加一个非常短暂的延迟后刷新页面，几乎是立即刷新，避免显示合约错误提示
    setTimeout(() => {
      window.location.reload();
    }, 10);
  };

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        account,
        chainId,
        networkName,
        isConnected,
        isNetworkSupported,
        isCorrectNetwork,
        disconnecting,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
