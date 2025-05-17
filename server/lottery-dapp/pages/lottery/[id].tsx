import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { useWeb3 } from "../../contexts/Web3Context"
import {
  getLotteryInstanceAddress,
  getLotteryDetails,
  enterLottery,
  drawWinner,
  claimPrize,
} from "../../services/contracts"
import { formatDateTime, truncateAddress, calculateCountdown, isValidAddress } from "../../utils/format"
import { Button } from "../../components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card"
import { Separator } from "../../components/ui/separator"
import { Badge } from "../../components/ui/badge"
import { ethers } from "ethers"
import { useToast } from "../../components/ui/use-toast"
import {
  ArrowLeft,
  Users,
  Clock,
  Award,
  Gift,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Timer,
} from "lucide-react"
import Layout from "../../components/Layout"
import LoadingSpinner from "../../components/LoadingSpinner"

export default function LotteryDetail() {
  const router = useRouter()
  const { id } = router.query
  const { provider, signer, account, isConnected, isCorrectNetwork } = useWeb3()
  const { toast } = useToast()

  const [lottery, setLottery] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false })

  // 获取抽奖详情
  const fetchLotteryDetails = async () => {
    if (!provider || !id || typeof id !== "string") return

    try {
      const address = await getLotteryInstanceAddress(provider, id)
      if (address === ethers.ZeroAddress) {
        toast({
          title: "抽奖不存在",
          description: `找不到ID为 ${id} 的抽奖`,
          variant: "destructive",
        })
        router.push("/")
        return
      }

      const details = await getLotteryDetails(provider, address)
      console.log("抽奖详情页获取到的原始数据:", details);
      console.log("抽奖名称字段:", {
        lotteryName: details.lotteryName,
        name: details.name,
        id
      });
      
      // 确保lotteryName被正确设置
      if (!details.lotteryName && !details.name) {
        console.warn("警告: 未能获取到抽奖名称，将使用ID作为名称");
      }
      
      setLottery({ id, address, ...details })
    } catch (error) {
      console.error("获取抽奖详情失败:", error)
      toast({
        title: "获取详情失败",
        description: "无法获取抽奖详情",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 更新倒计时
  const updateCountdown = () => {
    if (!lottery) return

    const timeRemaining = calculateCountdown(lottery.drawTime)
    setCountdown(timeRemaining)
  }

  // 初始化和轮询
  useEffect(() => {
    if (provider && isConnected && isCorrectNetwork && id) {
      fetchLotteryDetails()
    }
  }, [provider, id, isConnected, isCorrectNetwork])

  // 倒计时定时器
  useEffect(() => {
    if (!lottery) return

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)

    return () => clearInterval(timer)
  }, [lottery])

  // 参与抽奖
  const handleEnterLottery = async () => {
    if (!signer || !lottery) return

    setProcessing(true)
    try {
      const tx = await enterLottery(signer, lottery.address, lottery.entryFee)
      
      toast({
        title: "参与成功",
        description: "您已成功参与抽奖",
      })
      
      // 刷新数据
      fetchLotteryDetails()
    } catch (error: any) {
      console.error("参与抽奖失败:", error)
      
      let errorMessage = "参与抽奖时发生错误"
      if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "参与失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // 开奖
  const handleDrawWinner = async () => {
    if (!signer || !lottery) return

    setProcessing(true)
    try {
      await drawWinner(signer, lottery.address)
      
      toast({
        title: "开奖成功",
        description: "已成功开奖，请刷新页面查看中奖者",
      })
      
      // 刷新数据
      fetchLotteryDetails()
    } catch (error: any) {
      console.error("开奖失败:", error)
      
      let errorMessage = "开奖时发生错误"
      if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "开奖失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // 领奖
  const handleClaimPrize = async () => {
    if (!signer || !lottery) return

    setProcessing(true)
    try {
      await claimPrize(signer, lottery.address)
      
      toast({
        title: "领奖成功",
        description: "奖金已转入您的钱包",
      })
      
      // 刷新数据
      fetchLotteryDetails()
    } catch (error: any) {
      console.error("领奖失败:", error)
      
      let errorMessage = "领奖时发生错误"
      if (error.reason) {
        errorMessage = error.reason
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "领奖失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  // 检查当前用户是否已参与
  const hasEntered = () => {
    if (!lottery || !account) return false
    return lottery.participants.some(
      (participant: string) => participant.toLowerCase() === account.toLowerCase()
    )
  }

  // 检查当前用户是否是创建者
  const isOwner = () => {
    if (!lottery || !account) return false
    return lottery.owner.toLowerCase() === account.toLowerCase()
  }

  // 检查当前用户是否是中奖者
  const isWinner = () => {
    if (!lottery || !account || !lottery.winner || !isValidAddress(lottery.winner)) return false
    return lottery.winner.toLowerCase() === account.toLowerCase()
  }

  // 渲染抽奖状态
  const renderLotteryState = () => {
    if (!lottery) return null

    switch (lottery.currentState) {
      case 0:
        return <Badge className="text-white bg-green-500">进行中</Badge>
      case 1:
        return <Badge className="text-white bg-yellow-500">开奖中</Badge>
      case 2:
        return <Badge className="text-white bg-blue-500">可领奖</Badge>
      case 3:
        return <Badge className="text-gray-700 bg-gray-300">已结束</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  // 渲染操作按钮
  const renderActionButton = () => {
    if (!lottery || !isConnected || !isCorrectNetwork) return null

    // 已结束状态
    if (lottery.currentState === 3) {
      return (
        <Button disabled className="w-full">
          抽奖已结束
        </Button>
      )
    }

    // 可领奖状态 & 是中奖者
    if (lottery.currentState === 2 && isWinner()) {
      return (
        <Button
          onClick={handleClaimPrize}
          disabled={processing}
          className="w-full bg-blue-500 hover:bg-blue-600"
        >
          {processing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              处理中...
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              领取奖金
            </>
          )}
        </Button>
      )
    }

    // 进行中状态 & 时间已到 & 是开奖者
    if (lottery.currentState === 0 && countdown.isExpired && isOwner()) {
      return (
        <Button onClick={handleDrawWinner} disabled={processing} className="w-full bg-yellow-500 hover:bg-yellow-600">
          {processing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              处理中...
            </>
          ) : (
            <>
              <Award className="mr-2 h-4 w-4" />
              开始抽奖
            </>
          )}
        </Button>
      )
    }

    // 进行中状态 & 时间未到 & 未参与
    if (lottery.currentState === 0 && !countdown.isExpired && !hasEntered()) {
      return (
        <Button onClick={handleEnterLottery} disabled={processing} className="w-full">
          {processing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              处理中...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              参与抽奖
            </>
          )}
        </Button>
      )
    }

    // 进行中状态 & 时间未到 & 已参与
    if (lottery.currentState === 0 && !countdown.isExpired && hasEntered()) {
      return (
        <Button disabled className="w-full bg-green-500">
          <CheckCircle className="mr-2 h-4 w-4" />
          已参与
        </Button>
      )
    }

    // 进行中状态 & 时间已到 & 非开奖者
    if (lottery.currentState === 0 && countdown.isExpired && !isOwner()) {
      return (
        <Button disabled className="w-full">
          <Timer className="mr-2 h-4 w-4" />
          等待开奖
        </Button>
      )
    }

    // 开奖中状态
    if (lottery.currentState === 1) {
      return (
        <Button disabled className="w-full">
          <LoadingSpinner size="sm" className="mr-2" />
          正在开奖...
        </Button>
      )
    }

    // 可领奖状态 & 非中奖者
    if (lottery.currentState === 2 && !isWinner()) {
      return (
        <Button disabled className="w-full">
          <AlertCircle className="mr-2 h-4 w-4" />
          未中奖
        </Button>
      )
    }

    return null
  }

  if (!isConnected || !isCorrectNetwork) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">请先连接钱包</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            您需要连接钱包并切换到 Moonbase Alpha 测试网才能查看抽奖详情。
          </p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </div>
      </Layout>
    )
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">加载抽奖详情中...</p>
        </div>
      </Layout>
    )
  }

  if (!lottery) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4 text-destructive">抽奖不存在</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">找不到该抽奖或抽奖ID无效。</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回首页
            </Button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/" className="text-muted-foreground hover:text-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回抽奖列表
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    {lottery.lotteryName || lottery.name || `抽奖 #${lottery.id}`}
                  </CardTitle>
                  <CardDescription className="mt-1">ID: {lottery.id}</CardDescription>
                </div>
                <div>{renderLotteryState()}</div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center p-4 rounded-lg border">
                  <CreditCard className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <p className="text-sm text-muted-foreground">参与费用</p>
                    <p className="text-lg font-medium">{lottery.entryFee} ETH</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 rounded-lg border">
                  <Gift className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <p className="text-sm text-muted-foreground">当前奖池</p>
                    <p className="text-lg font-medium">{lottery.prizePool} ETH</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 rounded-lg border">
                  <Users className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <p className="text-sm text-muted-foreground">参与人数</p>
                    <p className="text-lg font-medium">{lottery.participants.length} 人</p>
                  </div>
                </div>
                
                <div className="flex items-center p-4 rounded-lg border">
                  <Clock className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <p className="text-sm text-muted-foreground">开奖时间</p>
                    <p className="text-lg font-medium">{formatDateTime(lottery.drawTime).split("（")[0]}</p>
                  </div>
                </div>
              </div>
              
              {lottery.currentState === 0 && !countdown.isExpired && (
                <div className="p-4 rounded-lg border bg-muted/50">
                  <h3 className="flex items-center text-lg font-medium mb-2">
                    <Timer className="mr-2 h-5 w-5" />
                    距离开奖还有
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-md bg-background">
                      <p className="text-2xl font-bold">{countdown.days}</p>
                      <p className="text-xs text-muted-foreground">天</p>
                    </div>
                    <div className="p-2 rounded-md bg-background">
                      <p className="text-2xl font-bold">{countdown.hours}</p>
                      <p className="text-xs text-muted-foreground">时</p>
                    </div>
                    <div className="p-2 rounded-md bg-background">
                      <p className="text-2xl font-bold">{countdown.minutes}</p>
                      <p className="text-xs text-muted-foreground">分</p>
                    </div>
                    <div className="p-2 rounded-md bg-background">
                      <p className="text-2xl font-bold">{countdown.seconds}</p>
                      <p className="text-xs text-muted-foreground">秒</p>
                    </div>
                  </div>
                </div>
              )}
              
              {lottery.winner && isValidAddress(lottery.winner) && (
                <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950">
                  <h3 className="flex items-center text-lg font-medium mb-2 text-blue-800 dark:text-blue-300">
                    <Award className="mr-2 h-5 w-5" />
                    中奖者信息
                  </h3>
                  <p className="mb-1">
                    <span className="font-medium">地址: </span>
                    <Link
                      href={`https://moonbase.moonscan.io/address/${lottery.winner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      {lottery.winner}
                    </Link>
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">奖金: </span>
                    <span>{lottery.prizePool} ETH</span>
                  </p>
                  {isWinner() && (
                    <div className="mt-2 text-blue-700 dark:text-blue-300 font-medium">
                      恭喜您中奖！请及时领取奖金。
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-2">
              {renderActionButton()}
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>参与者列表</CardTitle>
              <CardDescription>当前共 {lottery.participants.length} 人参与</CardDescription>
            </CardHeader>
            <CardContent>
              {lottery.participants.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  暂无参与者
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {lottery.participants.map((participant: string, index: number) => (
                    <div
                      key={`${participant}-${index}`}
                      className={`p-3 rounded-md border ${
                        participant.toLowerCase() === account?.toLowerCase()
                          ? "bg-primary/10 border-primary"
                          : "bg-muted/30"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="truncate flex-1">
                          <Link
                            href={`https://moonbase.moonscan.io/address/${participant}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline truncate"
                          >
                            {truncateAddress(participant)}
                          </Link>
                        </div>
                        {participant.toLowerCase() === account?.toLowerCase() && (
                          <Badge variant="outline" className="ml-2 whitespace-nowrap">
                            我
                          </Badge>
                        )}
                        {lottery.winner &&
                          isValidAddress(lottery.winner) &&
                          participant.toLowerCase() === lottery.winner.toLowerCase() && (
                            <Badge className="ml-2 bg-yellow-500 text-white whitespace-nowrap">
                              <Award className="mr-1 h-3 w-3" />
                              中奖
                            </Badge>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
} 