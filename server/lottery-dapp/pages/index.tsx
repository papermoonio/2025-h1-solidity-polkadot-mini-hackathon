import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useWeb3 } from "../contexts/Web3Context"
import { useToast } from "../components/ui/use-toast"
import Layout from "../components/Layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Badge } from "../components/ui/badge"
import { Skeleton } from "../components/ui/skeleton"
import { Search } from "lucide-react"
import {
  getReadOnlyLotteryFactoryContract,
  getReadOnlyLotteryInstanceContract,
  getLotteryFactoryContract,
  getLotteryInstanceContract,
  formatEther,
  LotteryState,
  getCurrentNetworkSymbol,
  SUPPORTED_NETWORKS,
  LOTTERY_FACTORY_ADDRESS,
  safeContractCall,
  BACKUP_RPCS
} from "../services/contracts"
import {
  Trophy,
  Users,
  Clock,
  Gift,
  Award,
  ArrowRight,
  Plus,
  AlertTriangle,
  SearchIcon,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
} from "lucide-react"
import { formatDateTime, truncateAddress, isValidAddress } from "../utils/format"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import ContractErrorAlert from "../components/ContractErrorAlert"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import BigNumber from "bignumber.js"

// 添加全局window接口声明
declare global {
  interface Window {
    contractDebug?: {
      checkContract: () => Promise<any>;
      tryAllNetworks: () => Promise<Record<string, any>>;
    }
  }
}

interface LotteryDetails {
  id: string;
  name: string;
  entryFee: string;
  drawTime: number;
  prizePool: string;
  state: number;
  winner: string;
  owner: string;
  address: string; // 添加address字段
}

// 视图类型枚举
type ViewType = 'card' | 'list';

export default function Home() {
  const router = useRouter()
  const { provider, signer, account, chainId, isConnected, isNetworkSupported, connectWallet, switchNetwork, disconnectWallet, disconnecting } = useWeb3()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [lotteries, setLotteries] = useState<LotteryDetails[]>([])
  const [filteredLotteries, setFilteredLotteries] = useState<LotteryDetails[]>([])
  const [connecting, setConnecting] = useState(false)
  const [contractError, setContractError] = useState(false)
  const [lotteryIdInput, setLotteryIdInput] = useState("")
  const [showIdInput, setShowIdInput] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('card') // 默认卡片视图
  
  // 获取当前网络的代币符号
  const tokenSymbol = chainId ? getCurrentNetworkSymbol(chainId) : "ETH";

  // 切换视图类型
  const toggleViewType = () => {
    setViewType(prev => prev === 'card' ? 'list' : 'card');
  };

  // 获取所有抽奖信息
  const fetchLotteries = useCallback(async () => {
    try {
      setLoading(true)
      setContractError(false)
      
      console.log("开始获取抽奖列表...");
      
      // 使用只读提供商获取数据，不管是否已连接钱包
      let factoryContract;
      try {
        if (provider) {
          console.log("使用已连接的Web3 provider");
          factoryContract = getLotteryFactoryContract(provider);
        } else {
          console.log("未连接钱包，使用只读provider");
          // 使用异步版本的getReadOnlyLotteryFactoryContract
          factoryContract = await getReadOnlyLotteryFactoryContract();
        }
        console.log("合约地址:", LOTTERY_FACTORY_ADDRESS);
        
        // 检查合约代码存在性
        const contractProvider = factoryContract.runner?.provider;
        if (contractProvider) {
          const code = await contractProvider.getCode(LOTTERY_FACTORY_ADDRESS);
          if (code === '0x') {
            console.error("合约地址上没有代码，可能是地址错误或网络问题");
            toast({
              title: "合约不存在",
              description: "指定地址上没有合约代码，请检查合约地址或网络设置",
              variant: "destructive",
            });
            setContractError(true);
            setLoading(false);
            return;
          }
        }
      } catch (providerError) {
        console.error("创建合约实例失败:", providerError);
        toast({
          title: "连接合约失败",
          description: "无法创建合约实例，请检查网络连接",
          variant: "destructive",
        });
        setContractError(true);
        setLoading(false);
        return;
      }
      
      // 获取所有抽奖ID
      console.log("尝试获取抽奖ID列表...");
      const lotteryIds = await safeContractCall<string[]>(factoryContract, 'getAllLotteryIds') || [];
      console.log("获取到抽奖ID列表:", lotteryIds);
      
      if (lotteryIds.length === 0) {
        console.log("没有找到抽奖");
        setLotteries([]);
        setFilteredLotteries([]);
        setLoading(false);
        
        // 显示一个友好的提示而不是错误
        toast({
          title: "暂无抽奖",
          description: "目前没有任何活跃的抽奖，可以尝试创建一个新的抽奖",
          variant: "default",
        });
        return;
      }
      
      // 获取每个抽奖的详细信息
      const lotteriesData: LotteryDetails[] = []

      for (const id of lotteryIds) {
        try {
          // 获取该抽奖实例的合约地址
          const instanceAddress = await factoryContract.getLotteryInstanceAddress(id)
          
          if (instanceAddress && instanceAddress !== ethers.ZeroAddress) {
            // 获取该抽奖实例的详细信息
            const instanceContract = provider 
              ? getLotteryInstanceContract(instanceAddress, provider)
              : getReadOnlyLotteryInstanceContract(instanceAddress)
            
            // 获取基本信息
            const details = await instanceContract.getLotteryDetails()
            
            // 调试日志
            console.log(`获取抽奖(${id})详情:`, details);
            console.log("抽奖名称字段:", {
              lotteryName: details.lotteryName,
              name: details.name,
              结构化解包: details[0],
              id: details.id,
              原始对象: Object.keys(details)
            });
            
            // 安全处理可能的null值，并支持不同的参数名格式
            const safeFormatEther = (value: any) => {
              if (value === null || value === undefined) return "0";
              try {
                return formatEther(value);
              } catch (error) {
                console.error("格式化ETH数值失败:", error, "原始值:", value);
                return "0";
              }
            };
            
            // 处理结构化返回值和不同参数名
            const lotteryName = details.lotteryName || details[0] || details.name || "";
            
            // 将信息格式化后添加到列表
            lotteriesData.push({
              id: id,
              name: lotteryName,
              entryFee: safeFormatEther(details.fee || details[2] || details.entryFee),
              drawTime: Number(details.time || details[3] || details.drawTime || 0),
              prizePool: safeFormatEther(details.pool || details[4] || details.prizePool),
              state: Number(details.state || details[5] || details.currentState || 0),
              address: instanceAddress,
              winner: details.winnerAddress || details[6] || details.winner || ethers.ZeroAddress,
              owner: details.ownerAddress || details[1] || details.owner || ethers.ZeroAddress
            })
          }
        } catch (err) {
          console.error(`获取抽奖 ${id} 详情失败:`, err)
          // 继续处理下一个，而不终止整个流程
        }
      }

      // 对抽奖按开奖时间排序，最近的排在前面
      lotteriesData.sort((a, b) => a.drawTime - b.drawTime)
      
      setLotteries(lotteriesData)
      setFilteredLotteries(lotteriesData) // 初始时显示所有抽奖
      setContractError(false)
    } catch (error) {
      console.error("获取抽奖列表失败:", error)
      
      let errorMessage = "未知错误";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "获取抽奖列表失败",
        description: errorMessage.length > 100 ? errorMessage.substring(0, 100) + "..." : errorMessage,
        variant: "destructive",
      })
      
      setContractError(true)
      // 如果出错，显示空列表
      setLotteries([])
      setFilteredLotteries([])
    } finally {
      setLoading(false)
    }
  }, [provider, toast])

  // 初始化时加载抽奖
  useEffect(() => {
    fetchLotteries()
    
    // 设置定时器，每60秒刷新一次
    const intervalId = setInterval(fetchLotteries, 60000)
    
    return () => clearInterval(intervalId)
  }, [fetchLotteries])

  // 当链ID变化时重新加载数据
  useEffect(() => {
    if (chainId) {
      fetchLotteries();
    }
  }, [chainId, fetchLotteries]);

  // 处理搜索
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLotteries(lotteries)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = lotteries.filter(
      lottery => 
        lottery.id.toLowerCase().includes(query) || 
        lottery.name.toLowerCase().includes(query)
    )
    
    setFilteredLotteries(filtered)
  }, [searchQuery, lotteries])

  // 连接钱包
  const handleConnect = async () => {
    if (connecting) return;
    
    try {
      setConnecting(true);
      await connectWallet();
    } catch (error) {
      console.error("连接钱包失败:", error);
    } finally {
      setConnecting(false);
    }
  };

  // 获取抽奖状态展示
  const getLotteryStateDisplay = (state: LotteryState, drawTime: number) => {
    const now = Date.now()
    
    switch (state) {
      case LotteryState.Open:
        return drawTime > now ? (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            进行中
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            等待开奖
          </Badge>
        )
      case LotteryState.Drawing:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            开奖中
          </Badge>
        )
      case LotteryState.Claimable:
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            可领奖
          </Badge>
        )
      case LotteryState.Closed:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            已结束
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            未知
          </Badge>
        )
    }
  }

  // 格式化时间显示，更加友好
  const formatDrawTime = (timestamp: number) => {
    // 使用共享的时间格式化函数，与详情页保持一致
    return formatDateTime(timestamp);
  };

  // 当链不支持时，显示提示
  const renderChainSupportMessage = () => {
    if (!chainId || isNetworkSupported) return null;
    
    return (
      <div className="mb-8 p-4 border border-yellow-300 bg-yellow-50 rounded-lg text-yellow-800">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <h3 className="font-semibold">网络提示</h3>
        </div>
        <p className="mt-1">
          当前网络可能不支持抽奖合约。如果无法看到抽奖列表，请尝试切换到支持的网络。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.keys(SUPPORTED_NETWORKS).map(id => (
            <Button 
              key={id}
              variant="outline" 
              size="sm"
              className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
              onClick={() => switchToNetwork(Number(id))}
            >
              切换到 {SUPPORTED_NETWORKS[Number(id) as keyof typeof SUPPORTED_NETWORKS].name}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // 切换网络
  const switchToNetwork = async (networkId: number) => {
    if (!isConnected) {
      await connectWallet();
    }
    
    try {
      const result = await switchNetwork(networkId);
      if (result) {
        toast({
          title: "网络切换成功",
          description: `已切换到 ${SUPPORTED_NETWORKS[networkId as keyof typeof SUPPORTED_NETWORKS].name}`,
        });
      }
    } catch (error) {
      console.error("切换网络失败:", error);
    }
  };

  // 处理ID查询跳转
  const handleSearchById = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lotteryIdInput.trim()) {
      toast({
        title: "请输入ID",
        description: "请输入要查询的抽奖ID",
        variant: "destructive",
      })
      return
    }
    
    router.push(`/lottery/${lotteryIdInput.trim()}`)
  }

  // 合约错误提示
  const shouldShowContractError = contractError && !disconnecting;

  return (
    <Layout>
      <div className="container mx-auto px-4">
        {/* 英雄区 */}
        <section className="py-12 md:py-24 lg:py-32 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">区块链去中心化抽奖平台</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-[800px]">
            基于区块链技术的公平、透明的抽奖系统，所有过程均在链上进行，无法篡改
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {!isConnected ? (
              <Button size="lg" onClick={handleConnect} disabled={connecting}>
                {connecting ? "连接中..." : "连接钱包参与抽奖"}
              </Button>
            ) : (
              <Button size="lg" onClick={() => router.push("/create")}>
                创建新的抽奖
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={() => window.scrollTo({
              top: document.getElementById('lotteries')?.offsetTop,
              behavior: 'smooth'
            })}>
              查看所有抽奖
            </Button>
          </div>
          
          {/* 参与抽奖快速入口 */}
          <div className="mt-8 w-full max-w-md">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-between"
              onClick={() => setShowIdInput(!showIdInput)}
            >
              <span>通过ID直接参与抽奖</span>
              {showIdInput ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showIdInput && (
              <div className="mt-2 p-4 border rounded-lg bg-white dark:bg-gray-800 transition-all">
                <form onSubmit={handleSearchById}>
                  <div className="space-y-2">
                    <Label htmlFor="lottery-id">抽奖ID</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="lottery-id"
                        placeholder="输入抽奖ID"
                        value={lotteryIdInput}
                        onChange={(e) => setLotteryIdInput(e.target.value)}
                      />
                      <Button type="submit">
                        查找
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      输入抽奖ID可以直接跳转到相应的抽奖页面参与
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
        
        {/* 网络提示 */}
        {renderChainSupportMessage()}
        
        {/* 合约错误提示 */}
        {shouldShowContractError && (
          <ContractErrorAlert onRetry={fetchLotteries} />
        )}
        
        {/* 抽奖列表 */}
        <section id="lotteries" className="py-12">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold">最新抽奖活动</h2>
              {/* 视图切换按钮 */}
              <Button 
                variant="outline" 
                size="icon"
                className="ml-2"
                onClick={toggleViewType}
                title={viewType === 'card' ? "切换到列表视图" : "切换到卡片视图"}
              >
                {viewType === 'card' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
              </Button>
            </div>
            
            {/* 搜索框 */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索抽奖ID或名称"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {loading ? (
            // 加载占位
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-10 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredLotteries.length === 0 ? (
            // 无结果
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchQuery ? "未找到匹配的抽奖活动" : "暂无抽奖活动"}
              </p>
            </div>
          ) : viewType === 'card' ? (
            // 卡片视图
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLotteries.map((lottery) => (
                <Card key={lottery.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="mb-1">
                          {lottery.name || `抽奖 #${lottery.id}`}
                        </CardTitle>
                        <CardDescription>ID: {lottery.id}</CardDescription>
                      </div>
                      {getLotteryStateDisplay(lottery.state, lottery.drawTime)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">入场费</span>
                        <span className="font-medium">{lottery.entryFee} {tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">奖池</span>
                        <span className="font-medium">{lottery.prizePool} {tokenSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">开奖时间</span>
                        <span className="font-medium">
                          {formatDrawTime(lottery.drawTime)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full"
                      onClick={() => router.push(`/lottery/${lottery.id}`)}
                    >
                      查看详情
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            // 列表视图
            <div className="overflow-hidden border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">抽奖名称</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">入场费</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">奖池</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">开奖时间</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">状态</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLotteries.map((lottery) => (
                    <tr key={lottery.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{lottery.name || `抽奖 #${lottery.id}`}</td>
                      <td className="px-4 py-3 text-muted-foreground">{lottery.id}</td>
                      <td className="px-4 py-3">{lottery.entryFee} {tokenSymbol}</td>
                      <td className="px-4 py-3">{lottery.prizePool} {tokenSymbol}</td>
                      <td className="px-4 py-3">{formatDrawTime(lottery.drawTime)}</td>
                      <td className="px-4 py-3">
                        {getLotteryStateDisplay(lottery.state, lottery.drawTime)}
                      </td>
                      <td className="px-4 py-3">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/lottery/${lottery.id}`)}
                        >
                          查看详情
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}

// 图标组件
function Shield(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  )
}

function Coins(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  )
}