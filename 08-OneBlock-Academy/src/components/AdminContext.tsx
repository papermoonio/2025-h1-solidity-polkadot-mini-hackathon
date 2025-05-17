'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

// Admin 视图类型
export type AdminView = 
  | "students" 
  | "staff" 
  | "announcements" 
  | "notes" 
  | "answers" 
  | "grades" 
  | "certificates"
  | "claim";

// 上下文提供者接口
interface AdminContextValue {
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
}

// 创建上下文
const AdminContext = createContext<AdminContextValue | undefined>(undefined);

// Context Provider 组件
interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [activeView, setActiveView] = useState<AdminView>("students");

  return (
    <AdminContext.Provider value={{ activeView, setActiveView }}>
      {children}
    </AdminContext.Provider>
  );
}

// 自定义 Hook，用于访问上下文
export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}