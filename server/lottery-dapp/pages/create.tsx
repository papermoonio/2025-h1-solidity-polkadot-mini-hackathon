import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useWeb3 } from "../contexts/Web3Context"
import { createLottery } from "../services/contracts"
import Layout from "../components/Layout"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Calendar } from "../components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, RefreshCw } from "lucide-react"
import { cn } from "../utils/cn"
import { useToast } from "../components/ui/use-toast"
import LoadingSpinner from "../components/LoadingSpinner"

export default function CreateLottery() {
  const { signer, account, isConnected, isCorrectNetwork, connectWallet } = useWeb3()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [refreshingConnection, setRefreshingConnection] = useState(false)
  const [lotteryId, setLotteryId] = useState("")
  const [name, setName] = useState("")
  const [entryFee, setEntryFee] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // 默认7天后
  const [time, setTime] = useState("12:00")
  const [forceRerender, setForceRerender] = useState(0)
  
  // 强制刷新钱包连接状态
  const refreshWalletConnection = async () => {
    setRefreshingConnection(true);
    try {
      console.log("正在强制刷新钱包连接状态...");
      
      // 检查钱包是否已安装
      if (!window.ethereum) {
        throw new Error("未检测到钱包插件");
      }
      
      // 检查钱包是否已连接
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      
      if (accounts && accounts.length > 0) {
        console.log("检测到已连接的账户:", accounts[0]);
        
        // 强制刷新连接
        await connectWallet();
        
        // 强制重新渲染组件
        setForceRerender(prev => prev + 1);
        
        toast({
          title: "连接状态已刷新",
          description: "钱包已连接成功!",
        });
      } else {
        // 如果没有已连接的账户，请求连接
        console.log("未检测到已连接的账户，请求连接...");
        await connectWallet();
        
        toast({
          title: "请连接钱包",
          description: "请在钱包中确认连接请求",
        });
      }
    } catch (error) {
      console.error("刷新连接失败:", error);
      toast({
        title: "刷新连接失败",
        description: "请尝试刷新页面或重新连接钱包",
        variant: "destructive",
      });
    } finally {
      setRefreshingConnection(false);
    }
  };

  // 页面加载时检查钱包状态
  useEffect(() => {
    const checkWalletStatus = async () => {
      // 检查是否有MetaMask或其他钱包
      if (window.ethereum) {
        // 检查是否已连接但状态未同步
        if (window.ethereum.selectedAddress && !isConnected) {
          console.log("检测到钱包地址但状态未同步:", window.ethereum.selectedAddress);
          refreshWalletConnection();
        } else if (isConnected) {
          console.log("钱包已连接:", account);
        }
      }
    };
    
    checkWalletStatus();
  }, [isConnected, account, forceRerender]);

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 再次检查是否连接状态有误
    if (window.ethereum && window.ethereum.selectedAddress && (!signer || !isConnected || !isCorrectNetwork)) {
      toast({
        title: "连接状态不同步",
        description: "检测到钱包已连接但状态未同步，正在尝试重新同步...",
      });
      
      await refreshWalletConnection();
      
      // 如果刷新后仍未连接，显示错误
      if (!signer || !isConnected || !isCorrectNetwork) {
        toast({
          title: "请先连接钱包",
          description: "您需要连接支持的网络才能创建抽奖。",
          variant: "destructive",
        });
        return;
      }
    } else if (!signer || !isConnected || !isCorrectNetwork) {
      toast({
        title: "请先连接钱包",
        description: "您需要连接支持的网络才能创建抽奖。",
        variant: "destructive",
      });
      return;
    }

    if (!lotteryId || !name || !entryFee || !date) {
      toast({
        title: "表单不完整",
        description: "请填写所有必填字段。",
        variant: "destructive",
      })
      return
    }

    // 验证抽奖ID格式
    if (!/^[a-zA-Z0-9_-]+$/.test(lotteryId)) {
      toast({
        title: "无效的抽奖ID",
        description: "抽奖ID只能包含字母、数字、下划线和连字符。",
        variant: "destructive",
      })
      return
    }

    // 验证抽奖费用
    const entryFeeNum = parseFloat(entryFee)
    if (isNaN(entryFeeNum) || entryFeeNum <= 0) {
      toast({
        title: "无效的参与费用",
        description: "参与费用必须大于0。",
        variant: "destructive",
      })
      return
    }

    // 计算时间戳
    const [hours, minutes] = time.split(":").map(Number)
    const drawDate = new Date(date)
    drawDate.setHours(hours, minutes, 0, 0)

    // 验证时间是否在未来
    if (drawDate.getTime() <= Date.now()) {
      toast({
        title: "无效的开奖时间",
        description: "开奖时间必须在未来。",
        variant: "destructive",
      })
      return
    }

    // 计算与当前时间的差距（秒）
    const currentTime = Math.floor(Date.now() / 1000);
    const drawTimeUnix = Math.floor(drawDate.getTime() / 1000);
    const drawTimeInSeconds = drawTimeUnix - currentTime;

    setLoading(true)
    try {
      await createLottery(signer, lotteryId, name, entryFee, drawTimeInSeconds)
      
      toast({
        title: "创建成功",
        description: "抽奖已成功创建！",
      })
      
      // 跳转到首页
      router.push("/")
    } catch (error: any) {
      console.error("创建抽奖失败:", error)
      
      toast({
        title: "创建失败",
        description: error.message || "创建抽奖时出错，请稍后再试。",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 检查并显示钱包和网络状态
  const renderConnectionStatus = () => {
    if (account && isConnected) {
      return (
        <div className="mt-4 p-4 border rounded-md inline-block bg-green-50 text-green-800">
          <p className="text-sm">
            当前连接的钱包地址: {account.slice(0, 6)}...{account.slice(-4)}<br/>
            当前网络: {isCorrectNetwork ? "Moonbase Alpha (兼容)" : "不兼容的网络"}
          </p>
        </div>
      );
    } else if (account) {
      return (
        <div className="mt-4 p-4 border rounded-md inline-block bg-yellow-50 text-yellow-800">
          <p className="text-sm">
            检测到钱包地址: {account.slice(0, 6)}...{account.slice(-4)}<br/>
            但连接状态未同步，请点击上方按钮刷新状态
          </p>
        </div>
      );
    }
    return null;
  };

  if (!isConnected || !isCorrectNetwork) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">请先连接钱包</h1>
          <p className="text-muted-foreground mb-4">
            您需要连接钱包并切换到 Moonbase Alpha 测试网才能创建抽奖。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Button onClick={() => router.push("/")} variant="outline">
              返回首页
            </Button>
            <Button 
              onClick={refreshWalletConnection} 
              disabled={refreshingConnection}
              className="flex items-center"
            >
              {refreshingConnection ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  刷新中...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新连接状态
                </>
              )}
            </Button>
          </div>
          
          {renderConnectionStatus()}
          
          <div className="mt-8 max-w-md mx-auto p-4 bg-blue-50 text-blue-800 rounded-md">
            <h3 className="font-semibold mb-2">常见问题解决方法:</h3>
            <ul className="text-sm list-disc list-inside space-y-2">
              <li>尝试刷新整个页面（按F5或浏览器刷新按钮）</li>
              <li>确保您已在钱包中切换到了Moonbase Alpha测试网</li>
              <li>在OKX钱包中点击"刷新"或"重新连接"</li>
              <li>如果上述方法都不起作用，尝试重启浏览器</li>
            </ul>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">创建新抽奖</h1>
        
        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lotteryId">抽奖ID</Label>
              <Input
                id="lotteryId"
                placeholder="输入唯一的抽奖ID（字母、数字、下划线）"
                value={lotteryId}
                onChange={(e) => setLotteryId(e.target.value)}
                required
                pattern="[a-zA-Z0-9_-]+"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                设置一个唯一的ID，用于识别您的抽奖活动
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">抽奖名称</Label>
              <Input
                id="name"
                placeholder="输入抽奖活动名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entryFee">参与费用 (ETH)</Label>
              <Input
                id="entryFee"
                type="number"
                step="0.001"
                min="0.001"
                placeholder="例如: 0.01"
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                设置参与者需要支付的ETH数量
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>开奖日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "yyyy年MM月dd日") : "选择日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="time">开奖时间</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    创建中...
                  </>
                ) : (
                  "创建抽奖"
                )}
              </Button>
            </div>
          </form>
        </div>
        
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">注意事项:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>创建抽奖需要支付少量燃料费</li>
            <li>开奖后，中奖者可以领取全部奖池金额</li>
            <li>开奖时间到达后，创建者可以点击"开奖"按钮来选择随机中奖者</li>
            <li>创建后的抽奖参数无法修改，请确认无误再提交</li>
          </ul>
        </div>
      </div>
    </Layout>
  )
} 