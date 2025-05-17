// components/Button.js
"use client"
import React from 'react'
import clsx from 'clsx'

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  outline: 'border border-gray-400 text-white hover:bg-gray-800',
}
const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'px-4 py-2 rounded-lg font-medium transition duration-200 ease-in-out',
        variants[variant],
        {
          'opacity-50 cursor-not-allowed': disabled || loading,
        },
        className
      )}
    >
      {loading ? '加载中...' : children}
    </button>
  )
}

export default Button
