#!/bin/bash

echo "===== 区块链抽奖应用恢复脚本 ====="
echo "正在恢复到原始版本配置..."

# 恢复到React 19
echo "1. 恢复到React 19..."
npm uninstall react react-dom @types/react @types/react-dom
npm install react@19 react-dom@19 @types/react@19 @types/react-dom@19

# 安装所需的依赖
echo "2. 安装缺失的依赖..."
npm install tailwindcss-animate

# 清理缓存
echo "3. 清理npm缓存..."
npm cache clean --force

# 清理Next.js构建缓存
echo "4. 清理Next.js构建缓存..."
rm -rf .next

# 重新安装所有依赖
echo "5. 重新安装所有依赖..."
npm install

# 重新构建项目
echo "6. 构建项目..."
npm run build

echo "===== 恢复完成 ====="
echo "现在可以使用 'npm run dev' 启动项目"
