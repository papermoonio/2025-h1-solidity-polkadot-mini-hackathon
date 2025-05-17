'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAccount, useDisconnect } from 'wagmi';
import { signOut } from 'next-auth/react';
import { useRouter } from "next/navigation";
import { useLearning } from "@/components/LearningContext";
import { useEffect, useState } from "react";

const getTitle = () => process.env.NEXT_PUBLIC_ITEM_TITLE || "oneblock academy";

export function Header() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { setActiveView } = useLearning();

  const [title, setTitle] = useState("");

  useEffect(() => {
    setTitle(getTitle());
  }, []);

  const handleLogout = async () => {
    try {
      // 断开钱包连接
      await disconnect();
      // 退出登录
      await signOut({ redirect: false }); // 禁用 NextAuth 的默认跳转
      // 跳转到首页
      router.push('/');
    } catch (error) {
      console.error('退出失败:', error);
      // 如果退出失败，仍然跳转到首页
      router.push('/');
    }
  };

  return (
    <header className="sticky top-0 bg-white border-b z-50 py-4">
      <div className="container flex flex-col items-center">
        <div className="flex items-center justify-center mb-2">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <h1 className="text-2xl font-bold ml-2">{title}</h1>
        </div>
        <nav className="flex items-center space-x-4">

          <button
            onClick={() => setActiveView("materials")}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
          >
            学习资源
          </button>
          <button
            onClick={() => setActiveView("table")}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
          >
            作业答题卡
          </button>
          <button
            onClick={() => setActiveView("editor")}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
          >
            编辑笔记
          </button>
          <button
            onClick={() => setActiveView("list")}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-100 transition-colors duration-200"
          >
            学习笔记
          </button>
          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-blue-600 border-blue-600 hover:bg-blue-100 transition-colors duration-200"
            >
              登出钱包
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}