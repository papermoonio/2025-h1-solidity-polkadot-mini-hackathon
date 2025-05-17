"use client"

import React from "react"
import Navbar from "./Navbar"
import { useTheme } from "../contexts/ThemeContext"

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <footer className="border-t py-6">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} 区块链抽奖应用. 基于区块链技术的去中心化抽奖平台.</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
