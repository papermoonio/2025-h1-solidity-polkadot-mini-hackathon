import { ethers } from "ethers"
import LotteryFactoryABI from "../abis/LotteryFactory.json"
import SimpleLotteryABI from "../abis/SimpleLottery.json"

// 从环境变量获取合约地址，如果未设置则使用默认值
export const LOTTERY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_LOTTERY_FACTORY_ADDRESS || "0x84F045AB0F7Fe1278A1D2fb2E334409894A8E35D"

// 支持的网络列表及其合约地址
export const SUPPORTED_NETWORKS: Record<number, {
  name: string;
  rpcUrl: string;
  explorer: string;
  symbol: string;
  decimals: number;
  factoryAddress: string;
}> = {
  // Moonbase Alpha测试网
  1287: {
    name: "Moonbase Alpha",
    rpcUrl: "https://rpc.testnet.moonbeam.network",  // 修改为延迟最低的HTTP RPC
    explorer: "https://moonbase.moonscan.io",
    symbol: "DEV",
    decimals: 18,
    factoryAddress: LOTTERY_FACTORY_ADDRESS // 默认使用环境变量中的地址
  },
  // 本地开发网络
  1337: {
    name: "本地开发网络",
    rpcUrl: "http://localhost:8545",
    explorer: "",
    symbol: "ETH",
    decimals: 18,
    factoryAddress: process.env.NEXT_PUBLIC_LOCAL_FACTORY_ADDRESS || LOTTERY_FACTORY_ADDRESS
  },
  // 这里可以添加更多网络...
}

// 备用RPC列表 - 按延迟从低到高排序
export const BACKUP_RPCS = [
  // WebSocket连接 - 最快
  "wss://moonbase-alpha.drpc.org",  // 0.122s - 最佳性能
  // HTTP连接 - 按延迟排序
  "https://rpc.testnet.moonbeam.network",  // 0.144s
  "https://rpc.api.moonbase.moonbeam.network",  // 0.253s
  "https://moonbeam-alpha.api.onfinality.io/public",  // 0.331s
  "https://moonbase-rpc.dwellir.com",  // 0.368s
  "https://moonbase-alpha.public.blastapi.io",  // 0.380s
  "https://moonbase-alpha.drpc.org",  // 0.440s
  // 备用WebSocket - 不太稳定
  "wss://moonbase-alpha.public.blastapi.io",  // 1.021s - 性能较差
  // 原有备用
  "https://moonbase.unitedbloc.com:1000",
  "https://moonbase.unitedbloc.com:3001"
];

// 抽奖状态枚举
export enum LotteryState {
  Open = 0,
  Drawing = 1,
  Claimable = 2,
  Closed = 3,
}

// 获取当前网络信息
export function getCurrentNetworkInfo(chainId: number) {
  return SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS] || null;
}

// 获取当前网络的代币符号
export function getCurrentNetworkSymbol(chainId: number) {
  const network = getCurrentNetworkInfo(chainId);
  return network ? network.symbol : "ETH";
}

// 获取当前chainId的工厂合约地址
export function getFactoryAddress(chainId?: number): string {
  if (!chainId) return LOTTERY_FACTORY_ADDRESS;
  
  const network = getCurrentNetworkInfo(chainId);
  return network?.factoryAddress || LOTTERY_FACTORY_ADDRESS;
}

// 获取 LotteryFactory 合约实例
export function getLotteryFactoryContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  let chainId: number | undefined;
  
  try {
    console.log("创建LotteryFactory合约实例");
    console.log("使用合约地址:", LOTTERY_FACTORY_ADDRESS);
    console.log("ABI包含的方法数量:", LotteryFactoryABI.abi.length);
    
    // 检查ABI中是否包含关键方法
    const methods = LotteryFactoryABI.abi
      .filter((item: any) => item.type === 'function')
      .map((item: any) => item.name);
    console.log("ABI中的方法:", methods);
    
    const hasGetAllLotteryIds = methods.includes('getAllLotteryIds');
    console.log("ABI中包含getAllLotteryIds方法:", hasGetAllLotteryIds);
    
    // 可用的chainId
    if ('provider' in signerOrProvider && signerOrProvider.provider) {
      signerOrProvider.provider.getNetwork().then(network => {
        console.log("当前连接的网络chainId:", network.chainId);
      }).catch(console.error);
    } else if ('getNetwork' in signerOrProvider) {
      signerOrProvider.getNetwork().then(network => {
        console.log("当前连接的网络chainId:", network.chainId);
      }).catch(console.error);
    }
    
    // 创建合约实例
    return new ethers.Contract(LOTTERY_FACTORY_ADDRESS, LotteryFactoryABI.abi, signerOrProvider);
  } catch (error) {
    console.error("创建合约实例失败:", error);
    throw error;
  }
}

// 获取 SimpleLottery 合约实例
export function getLotteryInstanceContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, SimpleLotteryABI.abi, signerOrProvider)
}

// 使用RPC提供商获取只读合约实例
export async function getReadOnlyLotteryFactoryContract(rpcUrl?: string) {
  let lastError: any = null;
  
  // 1. 如果指定了RPC URL，先尝试使用它
  if (rpcUrl) {
    try {
      console.log("使用指定的RPC URL:", rpcUrl);
      const provider = rpcUrl.startsWith('wss') 
        ? new ethers.WebSocketProvider(rpcUrl)
        : new ethers.JsonRpcProvider(rpcUrl);
        
      try {
        const network = await provider.getNetwork();
        console.log("连接成功，网络ID:", network.chainId.toString());
        
        const code = await provider.getCode(LOTTERY_FACTORY_ADDRESS);
        console.log("合约代码长度:", code.length);
        
        if (code !== '0x') {
          console.log("找到合约代码!");
          return getLotteryFactoryContract(provider);
        } else {
          console.log("指定RPC上合约地址没有代码");
        }
      } catch (error) {
        console.error("检查网络或合约时出错:", error);
      }
    } catch (error) {
      console.error("连接到指定RPC失败:", error);
      lastError = error;
    }
  }
  
  // 2. 尝试使用WebSocket连接（通常性能最好）
  console.log("尝试WebSocket RPC连接 (性能通常最佳)...");
  const wsRpcs = BACKUP_RPCS.filter(url => url.startsWith('wss://'));
  
  for (const wsRpc of wsRpcs) {
    try {
      console.log(`尝试WebSocket: ${wsRpc}`);
      const wsProvider = new ethers.WebSocketProvider(wsRpc);
      
      try {
        const network = await wsProvider.getNetwork();
        console.log(`WebSocket连接成功, 网络: ${network.chainId}`);
        
        const code = await wsProvider.getCode(LOTTERY_FACTORY_ADDRESS);
        if (code !== '0x') {
          console.log(`WebSocket ${wsRpc} 找到合约代码! 长度: ${code.length}`);
          return getLotteryFactoryContract(wsProvider);
        } else {
          console.log(`WebSocket ${wsRpc} 未找到合约代码`);
        }
      } catch (error) {
        console.error(`WebSocket ${wsRpc} 检查网络或合约失败:`, error);
      }
    } catch (error) {
      console.error(`WebSocket ${wsRpc} 连接失败:`, error);
    }
  }
  
  // 3. 尝试HTTP连接
  console.log("尝试HTTP RPC连接...");
  const httpRpcs = BACKUP_RPCS.filter(url => url.startsWith('http'));
  
  for (const httpRpc of httpRpcs) {
    try {
      console.log(`尝试HTTP: ${httpRpc}`);
      const httpProvider = new ethers.JsonRpcProvider(httpRpc);
      
      try {
        const network = await httpProvider.getNetwork();
        console.log(`HTTP连接成功, 网络: ${network.chainId}`);
        
        const code = await httpProvider.getCode(LOTTERY_FACTORY_ADDRESS);
        if (code !== '0x') {
          console.log(`HTTP ${httpRpc} 找到合约代码! 长度: ${code.length}`);
          return getLotteryFactoryContract(httpProvider);
        } else {
          console.log(`HTTP ${httpRpc} 未找到合约代码`);
          
          // 如果是第一个HTTP连接，尝试低级调用
          if (httpRpc === httpRpcs[0]) {
            try {
              console.log("尝试原始JSON-RPC调用...");
              const response = await fetch(httpRpc, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 1,
                  method: 'eth_getCode',
                  params: [LOTTERY_FACTORY_ADDRESS, 'latest']
                }),
              });
              
              const data = await response.json();
              console.log("原始RPC调用结果:", data);
              
              if (data.result && data.result !== '0x') {
                console.log("原始调用找到了合约代码! 长度:", data.result.length);
                return getLotteryFactoryContract(httpProvider);
              }
            } catch (rawError) {
              console.error("原始RPC调用失败:", rawError);
            }
          }
        }
      } catch (error) {
        console.error(`HTTP ${httpRpc} 检查网络或合约失败:`, error);
      }
    } catch (error) {
      console.error(`HTTP ${httpRpc} 连接失败:`, error);
    }
  }
  
  // 4. 所有方法都失败，使用默认网络作为最后手段
  console.warn("所有RPC尝试失败，使用默认Moonbase Alpha网络");
  const provider = new ethers.JsonRpcProvider(SUPPORTED_NETWORKS[1287].rpcUrl);
  
  if (lastError) {
    console.error("无法找到有效的合约实例:", lastError);
  }
  
  return getLotteryFactoryContract(provider);
}

// 使用RPC提供商获取只读抽奖实例合约
export function getReadOnlyLotteryInstanceContract(address: string, rpcUrl?: string) {
  const provider = new ethers.JsonRpcProvider(rpcUrl || SUPPORTED_NETWORKS[1287].rpcUrl)
  return getLotteryInstanceContract(address, provider)
}

// 格式化wei为ETH单位的字符串
export function formatEther(wei: bigint | string): string {
  return ethers.formatEther(wei).toString()
}

// 解析ETH字符串为wei
export function parseEther(eth: string): bigint {
  return ethers.parseEther(eth)
}

// 处理合约错误
export function handleContractError(error: any): string {
  // 检查是否有reason属性
  if (error.reason) return error.reason;
  
  // 检查是否包含特定错误信息
  if (error.message) {
    // 检查常见的错误模式
    if (error.message.includes('execution reverted')) {
      const match = error.message.match(/execution reverted: (.+?)"/);
      if (match && match[1]) return match[1];
    }
    if (error.message.includes('user rejected')) {
      return '用户拒绝了交易';
    }
    if (error.message.includes('insufficient funds')) {
      return '余额不足，无法完成交易';
    }
    return error.message;
  }
  
  // 返回通用错误
  return '交易失败，请检查网络连接和钱包余额';
}

// 创建新抽奖
export async function createLottery(
  signer: ethers.Signer,
  lotteryId: string,
  name: string,
  entryFee: string,
  drawTimeInSeconds: number
) {
  try {
    const factory = getLotteryFactoryContract(signer)
    
    // 将ETH转换为Wei
    const entryFeeWei = ethers.parseEther(entryFee)
    
    // 计算开奖时间（当前时间 + 指定的秒数）
    const drawTime = Math.floor(Date.now() / 1000) + drawTimeInSeconds
    
    // 调用创建彩票的合约方法
    const tx = await factory.createLottery(lotteryId, name, entryFeeWei, drawTime, {
      value: ethers.parseEther("0.01") // 假设部署合约需要支付一定数量的ETH
    })
    
    await tx.wait()
    
    return tx
  } catch (error) {
    throw new Error(handleContractError(error));
  }
}

// 创建一个安全的合约调用辅助函数
export async function safeContractCall<T>(
  contract: ethers.Contract,
  methodName: string,
  args: any[] = []
): Promise<T | null> {
  try {
    // 检查方法是否存在
    if (typeof contract[methodName] !== 'function') {
      console.error(`合约没有${methodName}方法`);
      return null;
    }
    
    // 特殊处理getAllLotteryIds方法 - 直接使用低级调用避免解码问题
    if (methodName === 'getAllLotteryIds') {
      try {
        console.log('使用低级调用获取彩票ID列表');
        
        const provider = contract.runner?.provider;
        if (!provider) {
          console.error('无法获取提供者进行低级调用');
          return null;
        }
        
        // 获取函数选择器
        const selector = contract.interface.getFunction(methodName)?.selector;
        if (!selector) {
          console.error(`无法获取${methodName}的函数选择器`);
          return null;
        }
        
        // 执行低级调用
        const contractAddress = await contract.getAddress();
        console.log(`合约地址: ${contractAddress}, 调用方法: ${methodName}`);
        
        const result = await provider.call({
          to: contractAddress,
          data: selector
        });
        
        console.log(`低级调用getAllLotteryIds返回结果: ${result}`);
        
        // 如果是0x，表示空数组，直接返回空数组
        if (result === '0x' || result === '0x0') {
          console.log('彩票ID列表为空，返回空数组');
          return [] as unknown as T;
        }
        
        // 尝试解码结果
        try {
          const decoded = contract.interface.decodeFunctionResult(methodName, result)[0];
          console.log('成功解码彩票ID列表:', decoded);
          return decoded as T;
        } catch (decodeError) {
          console.error('解码getAllLotteryIds结果失败，返回空数组:', decodeError);
          return [] as unknown as T;
        }
      } catch (lowLevelError) {
        console.error('低级调用getAllLotteryIds失败:', lowLevelError);
        return [] as unknown as T;
      }
    }
    
    // 其他方法的处理
    try {
      console.log(`尝试调用${methodName}方法`);
      const result = await contract[methodName].staticCall(...args);
      console.log(`${methodName}调用成功:`, result);
      return result as T;
    } catch (staticError) {
      console.error(`${methodName}静态调用失败:`, staticError);
      
      // 尝试低级调用
      try {
        const provider = contract.runner?.provider;
        if (!provider) {
          console.error('无法获取提供者进行低级调用');
          return null;
        }
        
        const selector = contract.interface.getFunction(methodName)?.selector;
        if (!selector) {
          console.error(`无法获取${methodName}的函数选择器`);
          return null;
        }
        
        // 编码参数
        let data = selector;
        if (args.length > 0) {
          try {
            const encodedArgs = contract.interface.encodeFunctionData(methodName, args);
            data = encodedArgs;
          } catch (encodeError) {
            console.error('参数编码失败:', encodeError);
          }
        }
        
        // 执行低级调用
        const contractAddress = await contract.getAddress();
        const result = await provider.call({
          to: contractAddress,
          data
        });
        
        // 特殊处理空结果
        if (result === '0x' || result === '0x0') {
          console.log(`${methodName}返回空结果`);
          
          // 根据方法返回类型返回合适的默认值
          if (methodName.startsWith('get') && methodName.endsWith('s')) {
            // 假设返回复数的getter方法返回数组
            return [] as unknown as T;
          }
          return null;
        }
        
        // 尝试解码结果
        try {
          return contract.interface.decodeFunctionResult(methodName, result)[0] as T;
        } catch (decodeError) {
          console.error('无法解码低级调用结果:', decodeError);
          return null;
        }
      } catch (lowLevelError) {
        console.error('低级调用失败:', lowLevelError);
        return null;
      }
    }
  } catch (error) {
    console.error(`调用合约方法${methodName}失败:`, error);
    return null;
  }
}

// 获取抽奖总数
export async function getLotteryCount(provider: ethers.Provider) {
  const factory = getLotteryFactoryContract(provider)
  const allLotteryIds = await safeContractCall<string[]>(factory, 'getAllLotteryIds')
  return allLotteryIds?.length || 0
}

// 获取抽奖合约地址
export async function getLotteryInstanceAddress(provider: ethers.Provider, lotteryId: string) {
  const factory = getLotteryFactoryContract(provider)
  return await factory.getLotteryInstanceAddress(lotteryId)
}

// 获取最新的抽奖列表
export async function getLatestLotteries(provider: ethers.Provider, count: number) {
  const factory = getLotteryFactoryContract(provider)
  // 使用 getAllLotteryIds 获取所有彩票ID
  const allLotteryIds = await safeContractCall<string[]>(factory, 'getAllLotteryIds') || []
  
  // 获取最新的n个彩票ID（最新的在数组末尾）
  const latestIds = allLotteryIds
    .slice(Math.max(0, allLotteryIds.length - count))
    .reverse() // 反转顺序，最新的排在前面
  
  return latestIds
}

// 获取用户创建的抽奖列表
export async function getOwnedLotteries(provider: ethers.Provider, ownerAddress: string) {
  // 由于合约中没有 getOwnedLotteries 方法，我们需要通过其他方式实现
  // 这里是一个简单的实现，实际应用中可能需要监听事件等方式
  const factory = getLotteryFactoryContract(provider)
  const allLotteryIds = await factory.getAllLotteryIds()
  
  // 这里需要遍历所有彩票，检查每个彩票的所有者
  // 注意：这种方法在彩票数量多时效率较低
  const ownedLotteries = []
  
  for (const id of allLotteryIds) {
    try {
      const address = await factory.getLotteryInstanceAddress(id)
      const instance = getLotteryInstanceContract(address, provider)
      const details = await instance.getLotteryDetails()
      
      // 获取owner地址，适配不同的参数名
      const ownerFromDetails = details.ownerAddress || details.owner;
      
      if (ownerFromDetails && ownerFromDetails.toLowerCase() === ownerAddress.toLowerCase()) {
        ownedLotteries.push(id)
      }
    } catch (error) {
      console.error(`检查彩票 ${id} 所有者时出错:`, error)
    }
  }
  
  return ownedLotteries
}

// 获取抽奖详情
export async function getLotteryDetails(provider: ethers.Provider, lotteryAddress: string) {
  const instance = getLotteryInstanceContract(lotteryAddress, provider)
  
  try {
    // 获取基本信息
    console.log("获取抽奖详情，地址:", lotteryAddress);
    const details = await instance.getLotteryDetails();
    console.log("合约返回的原始详情:", details);
    
    // 直接检查数组属性，在ethers v6中，返回值既是数组也是对象
    console.log("合约返回数据类型检查:", {
      是否数组: Array.isArray(details),
      长度: details.length,
      第一个元素: details[0],
      第二个元素: details[1],
      第三个元素: details[2],
      对象属性: Object.keys(details)
    });
    
    // 获取参与者列表
    const participants = await instance.getParticipants();
    console.log("参与者列表:", participants);
    
    // 检查合约返回的名称字段
    console.log("抽奖名称调试:", {
      原始lotteryName: details.lotteryName,
      结构化解包: details[0], // getLotteryDetails第一个返回值应该是名称
      是否为空: !details.lotteryName && !details[0]
    });
    
    // 安全处理可能的null值，并支持不同的参数名格式
    const safeFormatEther = (value: any) => {
      if (value === null || value === undefined) return "0";
      try {
        return ethers.formatEther(value);
      } catch (error) {
        console.error("格式化ETH数值失败:", error, "原始值:", value);
        return "0";
      }
    };
    
    // 安全获取数值
    const safeNumber = (value: any) => {
      if (value === null || value === undefined) return 0;
      try {
        return Number(value);
      } catch (error) {
        console.error("转换为数字失败:", error, "原始值:", value);
        return 0;
      }
    };
    
    // 处理可能的不同参数名和结构化返回值
    // 根据SimpleLottery.sol中getLotteryDetails函数的定义，返回顺序是：
    // lotteryName, ownerAddress, fee, time, pool, state, winnerAddress
    
    // 优先从数组中获取名称，因为合约返回的第一个值就是名称
    let lotteryName = details[0];
    if (!lotteryName || lotteryName === "") {
      // 如果数组中第一个值为空，尝试从对象属性中获取
      lotteryName = details.lotteryName || details.name || "";
      console.log("从对象属性中获取名称:", lotteryName);
    } else {
      console.log("从数组中获取名称:", lotteryName);
    }
    
    // 如果名称还是为空，使用ID作为名称
    if (!lotteryName || lotteryName === "") {
      // 从合约调用getLotteryId()获取ID
      try {
        const lotteryId = await instance.lotteryId();
        if (lotteryId) {
          lotteryName = `${lotteryId}`;
          console.log("使用合约ID作为名称:", lotteryName);
        }
      } catch (err) {
        console.log("获取合约ID失败:", err);
      }
    }
    
    const owner = details[1] || details.ownerAddress || details.owner || ethers.ZeroAddress;
    const entryFee = safeFormatEther(details[2] || details.fee || details.entryFee);
    const drawTime = safeNumber(details[3] || details.time || details.drawTime);
    const prizePool = safeFormatEther(details[4] || details.pool || details.prizePool);
    const currentState = safeNumber(details[5] || details.state || details.currentState);
    const winner = details[6] || details.winnerAddress || details.winner || ethers.ZeroAddress;
    
    return {
      lotteryName,
      owner,
      entryFee,
      drawTime,
      prizePool,
      currentState,
      winner,
      participants: participants || [],
    };
  } catch (error) {
    console.error("获取抽奖详情失败:", error);
    // 返回一个默认对象，避免前端崩溃
    return {
      lotteryName: "获取详情失败",
      owner: ethers.ZeroAddress,
      entryFee: "0",
      drawTime: 0,
      prizePool: "0",
      currentState: 0,
      winner: ethers.ZeroAddress,
      participants: [],
    };
  }
}

// 参与抽奖
export async function enterLottery(signer: ethers.Signer, lotteryAddress: string, entryFee: string) {
  const instance = getLotteryInstanceContract(lotteryAddress, signer)
  
  // 将ETH转换为Wei
  const entryFeeWei = ethers.parseEther(entryFee)
  
  // 修复：将enterLottery改为enter，与合约函数名匹配
  try {
    console.log("调用参与抽奖函数，地址:", lotteryAddress, "费用:", entryFeeWei.toString());
    const tx = await instance.enter({ value: entryFeeWei })
    console.log("交易发送成功，等待确认...");
    await tx.wait()
    console.log("交易已确认");
    return tx
  } catch (error) {
    console.error("参与抽奖失败:", error);
    // 尝试提供更详细的错误信息
    if (error instanceof Error) {
      console.error("错误详情:", error.message);
      
      // 检查特定错误，帮助调试
      if (error.message.includes("is not a function")) {
        console.error("合约方法不存在，请检查方法名是否正确");
      }
    }
    throw error;
  }
}

// 开奖
export async function drawWinner(signer: ethers.Signer, lotteryAddress: string) {
  const instance = getLotteryInstanceContract(lotteryAddress, signer)
  
  const tx = await instance.drawWinner()
  await tx.wait()
  
  return tx
}

// 领奖
export async function claimPrize(signer: ethers.Signer, lotteryAddress: string) {
  const instance = getLotteryInstanceContract(lotteryAddress, signer)
  
  const tx = await instance.claimPrize()
  await tx.wait()
  
  return tx
}

// 重置/停止抽奖
export async function resetLottery(signer: ethers.Signer, lotteryAddress: string) {
  const contract = getLotteryInstanceContract(lotteryAddress, signer)
  try {
    const tx = await contract.resetLottery()
    return await tx.wait()
  } catch (error: any) {
    // 解析合约错误
    if (error.reason) {
      throw new Error(error.reason)
    } else if (error.message) {
      throw new Error(error.message)
    } else {
      throw error
    }
  }
}

// 监听抽奖事件
export function listenToLotteryEvents(
  lotteryAddress: string,
  provider: ethers.Provider,
  callbacks: {
    onEntered?: (participant: string) => void
    onWinnerDrawn?: (winner: string) => void
    onPrizeClaimed?: () => void
    onStateChanged?: (state: number) => void
  },
) {
  const contract = getLotteryInstanceContract(lotteryAddress, provider)

  // 监听参与事件
  if (callbacks.onEntered) {
    contract.on("EnteredLottery", (lotteryId, participant) => {
      callbacks.onEntered?.(participant)
    })
  }

  // 监听开奖事件
  if (callbacks.onWinnerDrawn) {
    contract.on("WinnerDrawn", (lotteryId, winner) => {
      callbacks.onWinnerDrawn?.(winner)
    })
  }

  // 监听领奖事件
  if (callbacks.onPrizeClaimed) {
    contract.on("PrizeClaimed", (lotteryId, winner, amount) => {
      callbacks.onPrizeClaimed?.()
    })
  }

  // 监听状态变化事件
  if (callbacks.onStateChanged) {
    contract.on("LotteryStateChanged", (lotteryId, state) => {
      callbacks.onStateChanged?.(Number(state))
    })
  }

  // 返回清理函数
  return () => {
    contract.removeAllListeners()
  }
}

// 暴露全局调试对象，用于在浏览器控制台中调试
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.contractDebug = {
    // 用于检查合约实例
    checkContract: async () => {
      try {
        console.log("合约调试工具启动...");
        const provider = new ethers.JsonRpcProvider(SUPPORTED_NETWORKS[1287].rpcUrl);
        console.log("创建Provider完成, RPC:", SUPPORTED_NETWORKS[1287].rpcUrl);
        
        // 检查合约代码
        const code = await provider.getCode(LOTTERY_FACTORY_ADDRESS);
        console.log("合约地址:", LOTTERY_FACTORY_ADDRESS);
        console.log("该地址上是否有代码:", code !== '0x');
        console.log("代码长度:", code.length);
        
        // 检查ABI
        const methods = LotteryFactoryABI.abi
          .filter((item: any) => item.type === 'function')
          .map((item: any) => item.name);
        console.log("ABI中的所有方法:", methods);
        
        // 创建合约实例
        const contract = new ethers.Contract(LOTTERY_FACTORY_ADDRESS, LotteryFactoryABI.abi, provider);
        console.log("合约实例创建成功");
        
        // 检查方法
        if (typeof contract.getAllLotteryIds === 'function') {
          console.log("getAllLotteryIds方法存在，尝试调用...");
          try {
            const result = await contract.getAllLotteryIds.staticCall();
            console.log("调用成功! 结果:", result);
            return { success: true, result };
          } catch (error) {
            console.error("调用失败:", error);
            return { success: false, error };
          }
        } else {
          console.error("合约中没有getAllLotteryIds方法");
          return { success: false, error: "方法不存在" };
        }
      } catch (error) {
        console.error("检查合约失败:", error);
        return { success: false, error };
      }
    },
    
    // 检查所有可支持的网络
    tryAllNetworks: async () => {
      const results: Record<string, any> = {};
      
      for (const [chainIdStr, network] of Object.entries(SUPPORTED_NETWORKS)) {
        try {
          const chainId = Number(chainIdStr);
          console.log(`尝试连接网络 ${chainId}: ${network.name}`);
          const provider = new ethers.JsonRpcProvider(network.rpcUrl);
          const networkInfo = await provider.getNetwork();
          console.log(`成功连接到网络: ${networkInfo.chainId}`);
          
          const code = await provider.getCode(LOTTERY_FACTORY_ADDRESS);
          const hasCode = code !== '0x';
          console.log(`合约地址 ${LOTTERY_FACTORY_ADDRESS} 在网络 ${chainId} 上${hasCode ? '有' : '没有'}代码`);
          
          if (hasCode) {
            const contract = new ethers.Contract(LOTTERY_FACTORY_ADDRESS, LotteryFactoryABI.abi, provider);
            try {
              const result = await contract.getAllLotteryIds.staticCall();
              console.log(`调用成功! 网络 ${chainId} 上有 ${result.length} 个抽奖`);
              results[chainIdStr] = { success: true, count: result.length };
            } catch (error: any) {
              console.error(`在网络 ${chainId} 上调用失败:`, error);
              results[chainIdStr] = { success: false, error: error.message };
            }
          } else {
            results[chainIdStr] = { success: false, error: "没有合约代码" };
          }
        } catch (error: any) {
          console.error(`连接网络 ${chainIdStr} 失败:`, error);
          results[chainIdStr] = { success: false, error: error.message };
        }
      }
      
      return results;
    }
  };
  
  console.log("合约调试工具已加载，使用window.contractDebug.checkContract()检查合约");
}
