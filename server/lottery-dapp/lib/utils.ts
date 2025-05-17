import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 合并 Tailwind CSS 类名
 * @param inputs 类名数组
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 格式化以太币金额
 * @param amount 金额（ETH）
 * @param decimals 小数位数
 * @returns 格式化后的金额字符串
 */
export function formatEther(amount: string, decimals = 4): string {
  const num = Number.parseFloat(amount)
  if (isNaN(num)) return "0"
  return num.toFixed(decimals)
}
