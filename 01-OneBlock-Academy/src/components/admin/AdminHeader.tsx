// ./src/components/admin/AdminHeader.tsx
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CalendarClock, LogOut, User, CreditCard, Wallet  } from "lucide-react";
import { useAccount, useDisconnect } from 'wagmi';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAdmin, AdminView } from "@/components/AdminContext";

// 组件属性定义
interface AdminHeaderProps {
  title?: string;
  description?: string;
}

const getTitle = () => process.env.NEXT_PUBLIC_ADMIN_TITLE || "oneblock academy 后台管理";

export function AdminHeader({ 
  title: propTitle, 
  description = "区块链课程管理系统"
}: AdminHeaderProps) {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { activeView, setActiveView } = useAdmin();
  const { data: session } = useSession();
  
  const [title, setTitle] = useState("");


    // 获取用户信息
    const userName = session?.user?.name || "未登录";
    const userId = session?.user?.id || "";
    const userAddress = session?.user?.address || "";
    
    // 格式化钱包地址显示
    const formatAddress = (address: string) => {
      if (!address) return "";
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };
    
  
  // 获取当前日期
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    setTitle(propTitle || getTitle());
  }, [propTitle]);

  const handleLogout = async () => {
    try {
      // 断开钱包连接
      await disconnect();
      // 退出登录
      await signOut({ redirect: false });
      // 跳转到首页
      router.push('/');
    } catch (error) {
      console.error('退出失败:', error);
      router.push('/');
    }
  };

  // 视图选项
  const viewOptions: { id: AdminView; label: string }[] = [
    { id: "students", label: "学员管理" },
    { id: "staff", label: "工作人员管理" },
    { id: "announcements", label: "公告管理" },
    { id: "notes", label: "学习笔记管理" },
    { id: "answers", label: "答题卡管理" },
    { id: "grades", label: "成绩管理" },
    { id: "certificates", label: "毕业claim生成" },
  ];

    return (
       <header className="sticky top-0 bg-white border-b z-50">
         <div className="container">
           {/* 顶部标题栏 */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b">
             <div className="flex items-center">
               <Image src="/logo.png" alt="Logo" width={40} height={40} />
               <div className="ml-4">
                 <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                 {description && <p className="text-gray-500 mt-1">{description}</p>}
               </div>
             </div>
             
             <div className="flex flex-col sm:flex-row items-start sm:items-center mt-4 sm:mt-0">
               {/* 用户信息部分 */}
               <div className="flex flex-col mr-6 text-sm">
                 <div className="flex items-center mb-1">
                   <User className="h-4 w-4 mr-1 text-blue-600" />
                   <span className="font-medium">{userName}</span>
                 </div>
                 <div className="flex items-center mb-1">
                   <CreditCard className="h-4 w-4 mr-1 text-blue-600" />
                   <span>ID: {userId}</span>
                 </div>
                 <div className="flex items-center">
                   <Wallet className="h-4 w-4 mr-1 text-blue-600" />
                   <span className="text-gray-600">{formatAddress(userAddress)}</span>
                 </div>
               </div>
   
               {/* 日期和登出按钮 */}
               <div className="flex items-center mt-2 sm:mt-0">
                 <div className="flex items-center text-sm text-gray-500 mr-4">
                   <CalendarClock className="mr-2 h-4 w-4" />
                   {currentDate}
                 </div>
                 {isConnected && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={handleLogout}
                     className="text-red-600 border-red-600 hover:bg-red-50"
                   >
                     <LogOut className="mr-2 h-4 w-4" />
                     登出管理人员
                   </Button>
                 )}
               </div>
             </div>
           </div>
           
           {/* 导航菜单 */}
           <nav className="flex items-center space-x-2 overflow-x-auto py-2">
             {viewOptions.map((option) => (
               <button
                 key={option.id}
                 onClick={() => setActiveView(option.id)}
                 className={`px-4 py-2 rounded-md transition-colors duration-200 whitespace-nowrap ${
                   activeView === option.id
                     ? "bg-blue-600 text-white" 
                     : "text-blue-600 border border-blue-600 hover:bg-blue-100"
                 }`}
               >
                 {option.label}
               </button>
             ))}
           </nav>
         </div>
       </header>
     );
   }