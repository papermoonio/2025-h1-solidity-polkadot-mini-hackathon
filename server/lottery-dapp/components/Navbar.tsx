import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { useWeb3 } from "../contexts/Web3Context"
import { useTheme } from "../contexts/ThemeContext"
import { Button } from "./ui/button"
import { truncateAddress } from "../utils/format"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { 
  Menu, 
  ChevronDown, 
  User, 
  LogOut, 
  Plus, 
  Home, 
  Award, 
  AlertTriangle,
  Globe,
  Moon,
  Sun
} from "lucide-react"
import { getCurrentNetworkInfo } from "../services/contracts"
import NetworkSwitcher from "./NetworkSwitcher"

export default function Navbar() {
  const { account, chainId, networkName, isConnected, isNetworkSupported, connectWallet, disconnectWallet } = useWeb3()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [connecting, setConnecting] = useState(false)

  // 获取当前网络的区块浏览器地址
  const getExplorerUrl = () => {
    if (!chainId) return "";
    const networkInfo = getCurrentNetworkInfo(chainId);
    return networkInfo?.explorer || "";
  };

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
  }

  // 断开连接
  const handleDisconnect = () => {
    disconnectWallet();
  }

  // 处理导航
  const handleNavigation = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  }
  
  // 在区块浏览器中查看地址
  const viewOnExplorer = () => {
    if (!account) return;
    const explorerUrl = getExplorerUrl();
    if (explorerUrl) {
      window.open(`${explorerUrl}/address/${account}`, '_blank');
    }
  };

  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Award className="h-6 w-6" />
            <span className="font-bold text-xl md:inline-block">区块链抽奖</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-primary ${
                router.pathname === "/" ? "text-primary" : "text-foreground/60"
              }`}
            >
              首页
            </Link>
            <Link
              href="/create"
              className={`transition-colors hover:text-primary ${
                router.pathname === "/create" ? "text-primary" : "text-foreground/60"
              }`}
            >
              创建抽奖
            </Link>
            {isConnected && (
              <Link
                href="/profile"
                className={`transition-colors hover:text-primary ${
                  router.pathname === "/profile" ? "text-primary" : "text-foreground/60"
                }`}
              >
                个人中心
              </Link>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 主题切换按钮 */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? '切换至亮色模式' : '切换至暗色模式'}
            className="mr-1"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {isConnected ? (
            <div className="flex items-center gap-2">
              {/* 网络切换器 */}
              <NetworkSwitcher />
              
              {/* 网络信息显示 - 已由NetworkSwitcher替代，可以移除 */}
              {/* <div className="hidden md:flex items-center border rounded-full px-3 py-1 text-sm">
                <Globe className="mr-1 h-3 w-3" />
                <span className={isNetworkSupported ? "text-foreground" : "text-destructive"}>
                  {networkName || "未知网络"}
                </span>
              </div> */}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline-block">
                      {truncateAddress(account || "")}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                  <DropdownMenuItem disabled>
                    <Globe className="mr-2 h-4 w-4" />
                    <span className={isNetworkSupported ? "" : "text-destructive"}>
                      {networkName || "未知网络"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>个人中心</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation("/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>创建抽奖</span>
                  </DropdownMenuItem>
                  {getExplorerUrl() && (
                    <DropdownMenuItem onClick={viewOnExplorer}>
                      <Award className="mr-2 h-4 w-4" />
                      <span>在浏览器中查看</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDisconnect}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>断开连接</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button onClick={handleConnect} disabled={connecting} className="hidden md:flex">
              {connecting ? "连接中..." : "连接钱包"}
            </Button>
          )}
          
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              aria-label="菜单"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="space-y-2 border-t px-4 py-3">
            {isConnected && (
              <>
                {/* 添加网络切换器 */}
                <div className="mb-3 flex justify-center">
                  <NetworkSwitcher />
                </div>
              </>
            )}
            <div
              className="flex items-center space-x-2 py-2 cursor-pointer"
              onClick={() => handleNavigation("/")}
            >
              <Home className="h-5 w-5 text-muted-foreground" />
              <span>首页</span>
            </div>
            <div
              className="flex items-center space-x-2 py-2 cursor-pointer"
              onClick={() => handleNavigation("/create")}
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
              <span>创建抽奖</span>
            </div>
            {isConnected && (
              <div
                className="flex items-center space-x-2 py-2 cursor-pointer"
                onClick={() => handleNavigation("/profile")}
              >
                <User className="h-5 w-5 text-muted-foreground" />
                <span>个人中心</span>
              </div>
            )}
            
            {/* 主题切换选项 */}
            <div
              className="flex items-center space-x-2 py-2 cursor-pointer"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-5 w-5 text-muted-foreground" />
                  <span>切换至亮色模式</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <span>切换至暗色模式</span>
                </>
              )}
            </div>
            
            {isConnected ? (
              <div
                className="flex items-center space-x-2 py-2 border-t mt-2 pt-4 cursor-pointer"
                onClick={handleDisconnect}
              >
                <LogOut className="h-5 w-5 text-muted-foreground" />
                <span>断开连接</span>
              </div>
            ) : (
              <Button 
                onClick={handleConnect} 
                disabled={connecting}
                className="w-full mt-2"
              >
                {connecting ? "连接中..." : "连接钱包"}
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  )
} 