/* eslint-disable react-hooks/rules-of-hooks */
import { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from "@src/redux/hooks";
import { UnsupportedChainIdError, useWeb3React } from '@web3-react/core'
import {
  providers,
  Contract,
} from 'ethers'
// 从正确的路径导入合约 ABI

import {
  STAKED_TOKEN_ADDRESS,
  EARNED_TOKEN_ADDRESS,
  VALID_CHAINS,
  tokenAbi,
} from '@src/config'
import abiJSON from '@src/util/abis.json'
import chains from '@src/util/chain_id.json'

import { message } from 'antd'

import * as contractActions from '@src/redux/modules/contract'
import * as walletActions from '@src/redux/modules/wallet'

import { useLocalStorage } from './useLocalStorage'
import { connectorLocalStorageKey, walletLocalStorageKey } from '@src/types/Connector'

const validChains = VALID_CHAINS;

function checkMetaMask() {
  // 添加更多检查，确保 window.ethereum 完全加载
  return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask;
}

export function listenToWallet() {
  const dispatch = useAppDispatch();
  let walletAddress = useAppSelector(state => state && state.contract.walletAddress);
  let signer = useAppSelector(state => state && state.contract.signer);
  let chain = useAppSelector(state => state && state.wallet.chain);

  const { chainId, account, active, activate, connector } = useWeb3React()

  const { getLocal } = useLocalStorage();


  useEffect(() => {
    handleAccountsChanged(account)
  }, [account]);

  useEffect(() => {
    handleChainChanged(chainId);
  }, [chainId]);
  

  useEffect(() => {
    // if (!walletAddress || !chain) {
    if (!walletAddress || !chain) {
      dispatch(contractActions.setSigner(null));
      return;
    }
    if (typeof window !== "undefined" && connector) {
      (async () => {
        const _provider = new providers.Web3Provider(await connector.getProvider());
        // Client-side-only code
        const _signer = _provider.getSigner();
        if (_signer) {
          dispatch(contractActions.setSigner(_signer));
        } else {
          // do nothing
          dispatch(contractActions.setSigner(null));
        }
      })();
    }
  }, [connector, walletAddress, chain])
  

  useEffect(() => {
    if (!chain) {
      clearContracts();
      return;
    } else {
    }
    const viewProvider = new providers.JsonRpcProvider(chain.rpc[0]);

    // !! Cannot get the Signer of an INFURA provider. INFURA does not provide or manage private keys.
    // const viewSigner = viewProvider.getSigner();

    if (!signer) {
      clearContracts();
      return;
    } else {
      const depositTokenContract = new Contract(STAKED_TOKEN_ADDRESS, tokenAbi, signer);

      const breContract = new Contract(EARNED_TOKEN_ADDRESS, tokenAbi, signer);

      dispatch(contractActions.setContracts({
        depositTokenContract,
        breContract,
      }))
    }
  }, [signer, chain]);


  function clearContracts() {
    dispatch(contractActions.setContracts({
      depositTokenContract: null,
      breContract: null,
      stakingContract: null,
      saleContract: null,
    }))
  }

  async function handleAccountsChanged(account) {
    if (!account) {
      // MetaMask is locked or the user has not connected any accounts
      // message.warning('Please connect to your wallet.');
      dispatch(contractActions.setWalletAddress(null));
    } else if (account !== walletAddress) {
      // Do any other work!
      dispatch(contractActions.setWalletAddress(account));
      message.success({
        content: 'You have connected to account ' + account,
        duration: 1
      });
    }
  }

  async function handleChainChanged(chainId) {
    const chain = chains.find(v => v.chainId == chainId);
    dispatch(walletActions.setChain(chain));
    // FIXME: do nothing now
    // if(VALID_CHAIN_IDS.includes(~~chainId)) {
    // } else if(chainId){
    //   // invalid network
    //   message.error('Please connect to the right network.');
    //   clearContracts();
    //   dispatch(walletActions.setChain(null));
    //   location.reload();
    // }
  }

  return;
}

export const useWallet = () => {

  const dispatch = useAppDispatch();
  const loading = useAppSelector(state => state && state.contract.loading);
  const signer = useAppSelector(state => state && state.contract.signer);
  const walletShowed = useAppSelector(state => state.wallet.show);
  const chain = useAppSelector(state => state.wallet.chain);
  const isWalletInstalled = useAppSelector(state => state.wallet.isWalletInstalled);
  const walletAddress = useAppSelector(state => state.contract.walletAddress);
  const depositTokenContract = useAppSelector(state => state.contract.depositTokenContract);
  const breContract = useAppSelector(state => state.contract.breContract);

  const saleContract = useAppSelector(state => state.contract.saleContract)
  const [saleAddress, setSaleAddress] = useState('');

  const { getLocal, setLocal } = useLocalStorage();
  // 初始化 自动连接（重要）
  useEffect(function mount() {
    // 添加延迟确保 MetaMask 完全加载
    const timer = setTimeout(() => {
      if (~~getLocal(connectorLocalStorageKey)) {
        getAccount({hideError: true})
          .catch(error => {
            console.error("自动连接钱包失败:", error);
            // 可能需要清除本地存储的连接状态
            if (error.message.includes("User rejected")) {
              setLocal(connectorLocalStorageKey, 0);
            }
          });
        
        // 添加所有必要的事件监听
        if (window.ethereum) {
          window.ethereum.on('connect', (connectInfo: any) => {
            getAccount({hideError: true});
          });
          
          window.ethereum.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length > 0) {
              dispatch(contractActions.setWalletAddress(accounts[0]));
            } else {
              dispatch(contractActions.setWalletAddress(null));
            }
          });
          
          window.ethereum.on('chainChanged', (chainId: string) => {
            getNetwork();
          });
          
          window.ethereum.on('disconnect', () => {
            disconnect();
          });
        }
      }
    }, 1000); // 给页面加载一些时间
    // 清理函数
    return () => {
      clearTimeout(timer);
      if (window.ethereum) {
        window.ethereum.removeListener('connect', () => {});
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('disconnect', () => {});
      }
    };
  }, []);

  /**
   * Init saleContract when saleAddress/userWalletAddress changes
   */


  useEffect(() => {
    if (!signer || !saleAddress) {
      return;
    }
    const saleContract = new Contract(saleAddress, abiJSON['hardhat']['C2NSale'], signer);
    dispatch(contractActions.setContracts({
      saleContract,
    }));
  }, [saleAddress, signer])


  async function getAccount(options?) {
    const hideError = options && options.hideError;
    const showError = !hideError;
    
    try {
      // 确保 window.ethereum 已完全加载
      if (typeof window === 'undefined' || !window.ethereum) {
        showError && message.error({
          content: '请安装 MetaMask 钱包!',
        });
        dispatch(walletActions.setisWalletInstalled(false));
        return Promise.reject(new Error('MetaMask 未安装'));
      }
      
      // 等待一小段时间确保 MetaMask 完全初始化
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!window.ethereum.isMetaMask) {
        showError && message.error({
          content: '请安装 MetaMask 钱包!',
        });
        dispatch(walletActions.setisWalletInstalled(false));
        return Promise.reject(new Error('MetaMask 未安装'));
      }
      
      dispatch(walletActions.setisWalletInstalled(true));
      
      if (!window.ethereum.isConnected()) {
        showError && message.error({
          content: '请连接到 MetaMask!',
        });
        return Promise.reject(new Error('MetaMask 未连接'));
      }
      
      console.log("正在请求钱包地址...");
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts && accounts.length > 0) {
        console.log("获取到钱包地址:", accounts[0]);
        dispatch(contractActions.setWalletAddress(accounts[0]));
        localStorage.setItem('walletAccount', accounts[0]);
        localStorage.setItem(connectorLocalStorageKey, '1');
        return Promise.resolve(accounts[0]);
      } else {
        throw new Error('未找到账户');
      }
    } catch (error) {
      console.error("获取钱包地址失败:", error);
      // 如果是用户拒绝连接，给出更友好的提示
      if (error.code === 4001) {
        showError && message.error({
          content: '您拒绝了连接请求，请在 MetaMask 中批准连接',
        });
      } else {
        showError && message.error({
          content: `连接钱包失败: ${error.message}`,
        });
      }
      return Promise.reject(error);
    }
  }

  async function getNetwork() {
    if (!checkMetaMask()) {
      message.error({
        content: 'Please install metamask!',
      })
      dispatch(walletActions.setisWalletInstalled(false));
      return Promise.reject();
    } else {
      dispatch(walletActions.setisWalletInstalled(true));
    }
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chain = validChains.find(v => v.chainId == chainId);
      dispatch(walletActions.setChain(chain));
    } catch (e) {
      console.error(e);
    }
    return Promise.resolve(chain);
  }

  function setLoading(data) {
    dispatch(contractActions.setLoading(data));
  }

  async function addToken(tokenAddress, symbolName) {
    console.log({ tokenAddress, symbolName }, 'add-token')
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20", // Initially only supports ERC20, but eventually more!
        options: {
          address: tokenAddress, // The address that the token is at.
          symbol: symbolName, // A ticker symbol or shorthand, up to 5 chars.
          decimals: 18 // The number of decimals in the token
        }
      }
    });
  }

  function showWallet(value?) {
    if (value === undefined) {
      dispatch(walletActions.showWallet(!walletShowed));
      return;
    }
    dispatch(walletActions.showWallet(!!value));
    return;
  }

  async function switchNetwork(chainId) {
    if (!walletAddress) {
      return;
    }
    const chain = chains.find(chain => chain.chainId == chainId) || validChains[0];
    const params = [
      {
        chainId: `0x${chain.chainId.toString(16)}`,
        chainName: chain.name,
        nativeCurrency: {
          name: chain.nativeCurrency.name,
          symbol: chain.nativeCurrency.symbol,
          decimals: chain.nativeCurrency.decimals,
        },
        rpcUrls: chain.rpc,
        blockExplorerUrls: [`${chain.infoURL}/`],
      },
    ];
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x' + (chain.chainId).toString(16) }],
      });
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: params,
          });
        } catch (addError) {
          // handle "add" error
        }
      }
      // handle other "switch" errors
    }
  }


  async function connect() {
    await getAccount()
      .then(getNetwork)
      .then((chain) => {
        message.success({
          content: 'Welcome, you\'re currently connected to metamask',
          duration: 1
        });
        // 同时设置两个键
        setLocal(connectorLocalStorageKey, 1);
        setLocal('auto_connect_wallet', 1);
      });
    return Promise.resolve();
  }

  function disconnect() {
    dispatch(contractActions.setWalletAddress(null));
    // dispatch(walletActions.setChain(null));
  
    // 同时清除两个键
    setLocal(connectorLocalStorageKey, 0);
    setLocal('auto_connect_wallet', 0);
    return Promise.resolve();
  }


  return {
    isWalletInstalled,
    walletAddress,
    depositTokenContract,
    breContract,
    saleContract,
    loading,
    saleAddress,
    validChains,
    signer,

    setSaleAddress,
    getAccount,
    setLoading,
    addToken,
    showWallet,
    walletShowed,
    chain,
    switchNetwork,
    connect,
    disconnect,

    isConnected: walletAddress && chain,
  }
}
