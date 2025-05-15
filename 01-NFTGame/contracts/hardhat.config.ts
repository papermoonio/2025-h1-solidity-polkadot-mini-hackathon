// 从hardhat配置中导入HardhatUserConfig类型和vars变量访问工具
import { HardhatUserConfig, vars } from 'hardhat/config';
// 导入hardhat基础工具包
import '@nomicfoundation/hardhat-toolbox';
// 导入Polkadot相关的hardhat插件
import '@parity/hardhat-polkadot';

// 定义hardhat配置对象
const config: HardhatUserConfig = {
    // 指定Solidity编译器版本
    solidity: '0.8.26',
    // resolc编译器配置
    resolc: {
        // 设置编译器来源为npm
        compilerSource: 'npm',
    },
    // 配置不同的网络环境
    networks: {
        // hardhat本地测试网络配置
        hardhat: {
            // 启用polkavm支持
            polkavm: true,
            // Uncomment to deploy to a local fork of the westend network.
            // forking: {
            //     url: 'wss://westend-asset-hub-rpc.polkadot.io',
            // },
            // Uncomment to deploy to a local node using the node binary
            nodeConfig: {
                nodeBinaryPath: './bin/substrate-node',
                rpcPort: 8000,
                dev: true,
            },
            // 适配器配置
            adapterConfig: {
                // 指定eth-rpc适配器二进制文件路径
                adapterBinaryPath: './bin/eth-rpc',
                // 启用开发模式
                dev: true,
            },
            // 添加账户预分配资金
            accounts: {
                accountsBalance: "10000000000000000000000" // 10000 ETH
            },
        },
        // 本地节点网络配置
        localNode: {
            // 启用polkavm支持
            polkavm: true,
            // 本地节点URL
            url: `http://127.0.0.1:8545`,
        },
        // Westend资产中心网络配置
        westendAssetHub: {
            // 启用polkavm支持
            polkavm: true,
            // Westend资产中心RPC节点URL
            url: 'https://westend-asset-hub-eth-rpc.polkadot.io',
            // 从环境变量获取账户私钥
            accounts: [vars.get('WESTEND_HUB_PK')],
        },
    }
};

// 导出配置对象
export default config;