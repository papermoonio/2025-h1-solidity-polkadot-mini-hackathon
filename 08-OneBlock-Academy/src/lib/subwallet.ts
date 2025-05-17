import {  injected } from 'wagmi/connectors'
import type { EIP1193Provider ,EIP1193EventMap} from 'viem';
import { Chain } from 'wagmi/chains'

declare global {
  interface Window {
    injectedWeb3?: {
      'subwallet-js'?: {
        enable: () => Promise<{
          accounts: {
            get: () => Promise<Array<{ address: string }>>;
            subscribe: (callback: (accounts: Array<{ address: string }>) => void) => () => void;
          };
          signer: {
            signPayload: (payload: unknown) => Promise<{ signature: string }>;
            signRaw: (raw: { data: string }) => Promise<{ signature: string }>;
          };
        }>;
        on?: EIP1193Provider['on'];
        removeListener?: EIP1193Provider['removeListener'];
      };
    };
  }
}

const assetHubWestendTestnet: Chain = {
  id: 420420421,
  name: 'Asset‑Hub Westend Testnet',
 // network: 'asset-hub-westend-testnet',
  nativeCurrency: {
    name: 'Westend DOT',
    symbol: 'WND',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
    },
    public: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-asset-hub.parity-chains-scw.parity.io',
    },
    blockscout: {
      name: 'Blockscout',
      url: 'https://blockscout-asset-hub.parity-chains-scw.parity.io',
    },
  },
  testnet: true,
}

// ==================== 自定义 SubWallet 连接器 ====================
// 修改后的subWalletConnector配置
export const subWalletConnector = injected({
  target: {
    id: 'subwallet',
    name: 'SubWallet',
    provider: () => {
      if (typeof window === 'undefined') return undefined;
      
      const provider = window.injectedWeb3?.['subwallet-js'];
      if (!provider) return undefined;

      // 存储事件监听器
      const listeners: Record<string, Set<(...args: unknown[]) => void>> = {
        connect: new Set(),
        disconnect: new Set(),
        chainChanged: new Set(),
        accountsChanged: new Set(),
        message: new Set()
      };

      // 自定义事件监听实现
      const on = <event extends keyof EIP1193EventMap>(
        event: event,
        listener: EIP1193EventMap[event]
      ) => {
        // 将事件和监听器存储在本地
        if (!listeners[event as string]) {
          listeners[event as string] = new Set();
        }
        listeners[event as string].add(listener as (...args: unknown[]) => void);
        
        // 如果 SubWallet 提供了原生事件支持，也注册一下
        if (provider.on) {
          provider.on(event, listener);
        } else {
          console.log(`自定义实现: 已注册 ${String(event)} 事件监听器`);
          
          // 为 accountsChanged 事件设置自定义轮询
          if (event === 'accountsChanged') {
            setupAccountsPolling(listeners);
          }
        }
      };

      // 设置账户轮询函数
      let pollingInterval: ReturnType<typeof setInterval> | null = null;
      const setupAccountsPolling = (listeners: Record<string, Set<(...args: unknown[]) => void>>) => {
        // 避免重复设置
        if (pollingInterval) return;
        
        let lastAccounts: string[] = [];
        
        pollingInterval = setInterval(async () => {
          try {
            if (!window.injectedWeb3?.['subwallet-js']) {
              // 钱包不可用，触发断开连接事件
              if (lastAccounts.length > 0) {
                lastAccounts = [];
                listeners.disconnect.forEach(listener => {
                  listener({ code: 1000, reason: "Wallet disconnected" });
                });
              }
              return;
            }
            
            const extension = await provider.enable();
            const accounts = (await extension.accounts.get()).map(a => a.address);
            
            // 检查账户是否变化
            if (JSON.stringify(accounts) !== JSON.stringify(lastAccounts)) {
              console.log('检测到账户变化:', accounts);
              // 触发 accountsChanged 事件
              listeners.accountsChanged.forEach(listener => {
                listener(accounts);
              });
              
              // 如果之前没有账户但现在有了，触发 connect 事件
              if (lastAccounts.length === 0 && accounts.length > 0) {
                listeners.connect.forEach(listener => {
                  listener({ chainId: `0x${assetHubWestendTestnet.id.toString(16)}` });
                });
              }
              
              lastAccounts = accounts;
            }
          } catch (error) {
            console.error('账户轮询错误:', error);
          }
        }, 1000); // 每秒检查一次
      };

      const removeListener = <event extends keyof EIP1193EventMap>(
        event: event,
        listener: EIP1193EventMap[event]
      ) => {
        // 从本地存储中移除监听器
        if (listeners[event as string]) {
          listeners[event as string].delete(listener as (...args: unknown[]) => void);
        }
        
        // 如果 SubWallet 提供了原生事件支持，也移除一下
        if (provider.removeListener) {
          provider.removeListener(event, listener);
        } else {
          console.log(`自定义实现: 已移除 ${String(event)} 事件监听器`);
        }
      };

      return {
        request: async ({ method, params }: { method: string; params?: unknown[] }) => {
          try {
            // 日志记录开始请求
            console.log(`SubWallet 请求方法: ${method}`, params);
            
            // 检查 SubWallet 是否已安装
            if (!window.injectedWeb3?.['subwallet-js']) {
              console.error('SubWallet 未安装或不可用');
              throw new Error('SubWallet 未安装或不可用。请安装 SubWallet 扩展并刷新页面。');
            }
            
            // 启用 SubWallet 并显示详细信息
            console.log('尝试启用 SubWallet...');
            const extension = await provider.enable();
            console.log('SubWallet 已启用:', extension);
            
            // 类型安全的请求处理
            switch (method) {
              case 'eth_requestAccounts':
              case 'eth_accounts': {
                // 获取账户前记录日志
                console.log('正在请求 SubWallet 账户...');
                
                try {
                  // 首先尝试强制打开钱包以进行选择
                  if (typeof window.injectedWeb3?.['subwallet-js']?.enable === 'function') {
                    console.log('正在尝试显示 SubWallet UI...');
                    await window.injectedWeb3?.['subwallet-js']?.enable();
                  }
                } catch (error) {
                  console.warn('尝试显示 SubWallet UI 失败:', error);
                }
                
                const accounts = await extension.accounts.get();
                console.log('获取到的所有 SubWallet 账户:', accounts);
                
                // 分类并显示所有账户信息
                const substrateAccounts = accounts.filter(a => !a.address.startsWith('0x'));
                const evmAccounts = accounts.filter(a => a.address.startsWith('0x') && a.address.length === 42);
                const otherAccounts = accounts.filter(a => 
                  a.address.startsWith('0x') && a.address.length !== 42
                );
                
                console.log('Substrate 账户:', substrateAccounts);
                console.log('EVM 账户:', evmAccounts);
                console.log('其他格式账户:', otherAccounts);
                
                // 过滤和转换地址
                const addresses = evmAccounts.map(a => a.address) as string[];
                
                // 如果没有找到以太坊地址，显示详细错误
                if (addresses.length === 0) {
                  // 尝试提示用户在钱包中创建或导入 EVM 账户
                  console.error('未找到以太坊格式的地址。您需要在 SubWallet 中添加 EVM 账户。');
                  console.info('发现的 Substrate 账户:', substrateAccounts.length);
                  
                  // 如果有 Substrate 账户但没有 EVM 账户，提供指导
                  if (substrateAccounts.length > 0) {
                    throw new Error('请在 SubWallet 中添加 EVM 账户 (0x 开头的地址)。您当前只有 Substrate 格式的账户。');
                  } else {
                    throw new Error('未找到任何 SubWallet 账户。请确保您已登录 SubWallet 并添加了 EVM 账户。');
                  }
                }
                
                // 手动触发 connect 事件
                setTimeout(() => {
                  listeners.connect.forEach(listener => {
                    listener({ chainId: `0x${assetHubWestendTestnet.id.toString(16)}` });
                  });
                  // 同时触发 accountsChanged 事件
                  listeners.accountsChanged.forEach(listener => {
                    listener(addresses);
                  });
                }, 50);
                
                return addresses;
              }
              
              case 'eth_chainId': {
                return `0x${assetHubWestendTestnet.id.toString(16)}`;
              }
              
              case 'personal_sign': {
                const [message] = params as [string, string];
                const { signature } = await extension.signer.signRaw({
                  data: message
                });
                return signature;
              }
              
              case 'eth_sendTransaction': {
                throw new Error('SubWallet 尚未实现 eth_sendTransaction 方法，请使用原生交易方法');
              }
              
              case 'eth_signTransaction': {
                throw new Error('SubWallet 尚未实现 eth_signTransaction 方法，请使用原生交易方法');
              }
              
              case 'eth_sign': {
                const [ message] = params as [string, string];
                const { signature } = await extension.signer.signRaw({
                  data: message
                });
                return signature;
              }
              
              case 'eth_getBalance': {
                throw new Error('请通过 RPC 直接查询余额');
              }
              
              case 'wallet_switchEthereumChain': {
                // 由于 SubWallet 是多链钱包，此处仅返回成功
                // 实际应用中可能需要更复杂的处理
                return null;
              }
              
              case 'wallet_addEthereumChain': {
                // 添加新链的处理
                return null;
              }
              
              case 'wallet_requestPermissions': {
                try {
                  // 在 SubWallet 中，获取账户权限通常通过 enable() 方法
                  // 这里我们已经调用了 enable()，所以只需返回一个模拟的权限对象
                  const accounts = await extension.accounts.get();
                  return [{
                    parentCapability: 'eth_accounts',
                    caveats: [{
                      type: 'restrictReturnedAccounts',
                      value: accounts.map(a => a.address)
                    }]
                  }];
                } catch (error) {
                  console.error('权限请求失败:', error);
                  throw error;
                }
              }
              
              case 'eth_getTransactionCount':
              case 'eth_getTransactionReceipt':
              case 'eth_getBlockByNumber':
              case 'eth_blockNumber':
              case 'net_version': {
                throw new Error(`请通过 RPC 直接查询 ${method}`);
              }
              
              default:
                throw new Error(`方法 ${method} 不受支持`);
            }
          } catch (error) {
            console.error(`SubWallet 请求错误:`, error);
            throw error;
          }
        },
        on,
        removeListener,
        // 必要的 EIP-1193 属性
        isSubWallet: true,
        isConnected: () => {
          try {
            return !!window.injectedWeb3?.['subwallet-js'];
          } catch (e) {
            console.log(e)
            return false;
          }
        },
        // 实现标准监听器
        once: <event extends keyof EIP1193EventMap>(
          event: event,
          listener: EIP1193EventMap[event]
        ) => {
          // 使用正确的类型，避免 any
          const wrappedListener = (...args: unknown[]) => {
            removeListener(event, wrappedListener as EIP1193EventMap[event]);
            (listener as (...args: unknown[]) => void)(...args);
          };
          on(event, wrappedListener as EIP1193EventMap[event]);
        },
        // 实现链ID获取
        getChainId: async () => {
          return `0x${assetHubWestendTestnet.id.toString(16)}`;
        },
        // 实现断开连接
        disconnect: async () => {
          console.log('SubWallet 断开连接请求');
          // 触发断开连接事件
          listeners.disconnect.forEach(listener => {
            listener({ code: 1000, reason: "User disconnected" });
          });
          return;
        }
      } as unknown as EIP1193Provider;
    },
  },
});