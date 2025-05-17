/*
 * @Author: 齐大胜 782395122@qq.com
 * @Date: 2024-12-28 19:12:12
 * @LastEditors: 齐大胜 782395122@qq.com
 * @LastEditTime: 2024-12-28 19:15:33
 * @FilePath: /park-view1/app/config.ts
 * @Description: 
 * 
 * Copyright (c) 2024 by 齐大胜 email: 782395122@qq.com, All Rights Reserved. 
 */
import { http, createConfig } from '@wagmi/core'
import { mainnet, sepolia } from '@wagmi/core/chains'

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})