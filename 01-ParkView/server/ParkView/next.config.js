/*
 * @Author: 齐大胜 782395122@qq.com
 * @Date: 2024-12-28 20:00:04
 * @LastEditors: 齐大胜 782395122@qq.com
 * @LastEditTime: 2024-12-28 20:13:08
 * @FilePath: /park-view1/next.config.js
 * @Description:
 *
 * Copyright (c) 2024 by 齐大胜 email: 782395122@qq.com, All Rights Reserved.
 */

const createNextIntlPlugin = require('next-intl/plugin');
 
const withNextIntl = createNextIntlPlugin(
    "./app/i18n/request.ts", // or './app/i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    
    images: {
        dangerouslyAllowSVG: true,
        contentDispositionType: "attachment",
        contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            "pino-pretty": false,
        };
        return config;
    },

    // 添加 rewrites 配置
    async rewrites() {
        return [
            {
                source: "/park/v1/parking-spot", // 代理本地路径
                destination: "http://localhost:8000/park/v1/parking-spot", // 目标后端路径
                //destination: "https://park.matrix-net.tech/", // 目标后端路径
            },
            {
                source: "/camaro/v1/file", // 代理本地路径
                destination: "https://park.matrix-net.tech/camaro/v1/file", // 目标后端路径
                //destination: "http://localhost:8000/park/v1/parking-spot", // 目标后端路径
            },
        ];
    },
};

//module.exports = nextConfig;
module.exports = withNextIntl(nextConfig);
