/**
 * 格式化地址，显示前几位和后几位
 * @param address 完整地址
 * @param startChars 开头显示的字符数
 * @param endChars 结尾显示的字符数
 * @returns 格式化后的地址
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return ""
  if (address.length <= startChars + endChars) return address
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * 检查地址是否有效（不为零地址）
 * @param address 要检查的地址
 * @returns 如果地址有效返回true，否则返回false
 */
export function isValidAddress(address: string): boolean {
  if (!address) return false
  return address !== '0x0000000000000000000000000000000000000000'
}

/**
 * 格式化日期和时间
 * @param timestamp 时间戳（毫秒或秒）
 */
export function formatDateTime(timestamp: number | string): string {
  if (!timestamp) return "未设置";
  
  try {
    // 输出调试信息
    console.log("原始时间戳:", timestamp, "类型:", typeof timestamp);
    
    // 确保时间戳是毫秒
    const timestampNumber = typeof timestamp === "string" ? parseInt(timestamp) : timestamp;
    console.log("解析后的时间戳:", timestampNumber);
    
    // 检查时间戳是否合理（排除明显的错误值）
    if (timestampNumber <= 0) {
      console.error("时间戳无效 (小于等于0):", timestampNumber);
      return "无效时间";
    }
    
    // 如果时间戳是秒级的（小于2100000000），则转换为毫秒
    // 通常判断依据：Unix时间戳秒级约为10位数，毫秒级约为13位数
    let timestampMs;
    if (timestampNumber < 2100000000) {
      timestampMs = timestampNumber * 1000;
      console.log("转换为毫秒后:", timestampMs);
    } else {
      timestampMs = timestampNumber;
    }
    
    // 进一步验证时间戳合理性 - 不应该是1970年附近的日期
    const date = new Date(timestampMs);
    console.log("转换为日期对象:", date.toString());
    
    if (date.getFullYear() < 2000) {
      console.error("时间戳可能有问题, 转换为1970年附近日期:", date.toString());
      return "时间数据错误";
    }
    
    // 如果日期无效，尝试其他方式
    if (isNaN(date.getTime())) {
      console.log("日期无效，尝试其他转换方法");
      // 尝试作为字符串日期解析
      const fallbackDate = new Date(timestamp.toString());
      if (!isNaN(fallbackDate.getTime())) {
        return fallbackDate.toLocaleString("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      }
      return "日期格式错误";
    }
    
    // 添加人性化的时间描述
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    let humanReadable = "";
    
    if (diff > 0) {
      // 将来时间
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        humanReadable = `（${days}天${hours}小时后）`;
      } else if (hours > 0) {
        humanReadable = `（${hours}小时${minutes}分钟后）`;
      } else if (minutes > 0) {
        humanReadable = `（${minutes}分钟后）`;
      } else {
        humanReadable = "（即将开始）";
      }
    } else {
      // 过去时间
      humanReadable = "（已过期）";
    }
    
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }) + " " + humanReadable;
  } catch (error) {
    console.error("格式化日期时出错:", error, "原始值:", timestamp);
    return String(timestamp) || "日期格式错误";
  }
}

/**
 * 计算倒计时
 * @param targetTime 目标时间戳（秒）
 */
export function calculateCountdown(targetTime: number | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  if (!targetTime) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  
  // 确保目标时间是毫秒
  const targetTimeNumber = typeof targetTime === "string" ? parseInt(targetTime) : targetTime;
  const targetMs = targetTimeNumber * 1000 > Date.now() ? targetTimeNumber * 1000 : targetTimeNumber;
  
  // 计算剩余时间（毫秒）
  const now = Date.now();
  let remainingMs = targetMs - now;
  
  // 如果目标时间已过，返回全零
  if (remainingMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }
  
  // 计算天数、小时、分钟和秒数
  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  remainingMs %= 1000 * 60 * 60 * 24;
  
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  remainingMs %= 1000 * 60 * 60;
  
  const minutes = Math.floor(remainingMs / (1000 * 60));
  remainingMs %= 1000 * 60;
  
  const seconds = Math.floor(remainingMs / 1000);
  
  return { days, hours, minutes, seconds, isExpired: false };
}

/**
 * 格式化以太币金额
 * @param amount 金额（以Wei为单位）
 * @param decimals 小数位数
 */
export function formatEther(amount: string | number, decimals = 6): string {
  if (!amount) return "0";
  
  // 将Wei转换为ETH（1 ETH = 10^18 Wei）
  const amountStr = typeof amount === "string" ? amount : amount.toString();
  const amountBN = BigInt(amountStr);
  const divisor = BigInt(10) ** BigInt(18);
  
  // 计算整数部分和小数部分
  const wholePart = amountBN / divisor;
  const fractionalPart = amountBN % divisor;
  
  // 将小数部分转换为字符串，并填充前导零
  let fractionalStr = fractionalPart.toString().padStart(18, "0");
  
  // 截取指定的小数位数
  fractionalStr = fractionalStr.substring(0, decimals);
  
  // 处理小数部分的末尾零
  fractionalStr = fractionalStr.replace(/0+$/, "");
  
  // 组合整数和小数部分
  return fractionalStr ? `${wholePart}.${fractionalStr}` : wholePart.toString();
}
