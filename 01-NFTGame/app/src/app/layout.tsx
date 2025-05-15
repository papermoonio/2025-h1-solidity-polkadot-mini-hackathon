/**
 * 应用主布局组件
 * 提供全局样式和结构
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { TRPCReactProvider } from "@/trpc/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
   title: "NFT斗图游戏",
   description: "收集、交易并使用你的NFT表情包进行对战",
};

/**
 * RootLayout组件
 * @param children - 子页面内容
 */
export default function RootLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <html lang="zh-CN">
         <body
            className={`${inter.className} min-h-screen bg-gray-900 text-white`}
         >
            {/* 主容器 */}
            <div className="container mx-auto px-4 py-8">
               {/* 主内容区 */}
               <main>
                  <TRPCReactProvider>{children}</TRPCReactProvider>
               </main>
               {/* 页脚 */}
               <footer className="mt-12 text-center text-gray-500 text-sm">
                  <p>© {new Date().getFullYear()} NFT斗图游戏 - 版权所有</p>
               </footer>
            </div>
         </body>
      </html>
   );
}
