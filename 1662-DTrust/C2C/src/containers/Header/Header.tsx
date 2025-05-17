import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Layout, Row, Col, Menu, Dropdown } from "antd";
import { MenuOutlined } from "@ant-design/icons";

import { useResponsive } from "@src/hooks/useResponsive";

import WalletButton from "@src/components/elements/WalletButton";
import NetworkButton from "@src/components/elements/NetworkButton";

import styles from "./Header.module.scss";

import { IconAppLogo } from "@src/components/icons";
import {
  createPublicClient,
  http,
  createWalletClient,
  parseAbi,
  defineChain,
  decodeEventLog,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
// --- 定义 UserInfo 类型 ---
interface UserInfo {
  role: string;
  departmentId: string;
}
// --- End: 定义 UserInfo 类型 ---
// === 配置 ===
const RPC_URL = 'https://westend-asset-hub-eth-rpc.polkadot.io';
const PRIVATE_KEY = '0xcf27fffdd1a6b9ea37a6a7757f6c5f3712a68d7560c3497575154db6e350414f'; // 确保私钥安全
const privateKey =
  "5fb92d6e98884f76de468fa3f6278f8807c48bebc13595d45af5bdc4da702133";
if (!privateKey) throw new Error("私钥未设置");
const contractAddress = "0x97e0c8f6643df31197fff71ced70f8288c187120";
import { abi as abiOut } from "../../util/ContractVerifier.json";

const polkavmChain = defineChain({
  id: 420420420,
  name: "PolkaVM Local",
  nativeCurrency: { name: "Westend DOT", symbol: "WND", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
});
const publicClient = createPublicClient({
  chain: polkavmChain,
  transport: http(),
});
if (!privateKey) throw new Error("私钥未设置");

const account = privateKeyToAccount(`0x${privateKey}`);

const walletClient = createWalletClient({
  account,
  chain: polkavmChain,
  transport: http(),
});

export default function Header() {
  const { isDesktopOrLaptop, isTabletOrMobile } = useResponsive();

  const [showSider, setShowSider] = useState(false);

  const { Header } = Layout;
  const router = useRouter();

  let activeTabIndex = useMemo(() => {
    return [
      "/",
      // '/stake',
      // '/farming',
      // '/pools',
      // '/project',
      // '/bridge',
    ].indexOf(router.pathname);
  }, [router]);

  const menu = (
    <Menu style={{ background: "#000000", border: "2px solid #FFB85280" }}>
      <div className={[styles["menu-item"]].join(" ")}>
        <Link href="/">
          <div
            className={[
              styles.button,
              activeTabIndex == 0 ? styles["active"] : "",
            ].join(" ")}
          >
            Home
          </div>
        </Link>
      </div>
      {/* <div className={[styles['menu-item']].join(' ')}>
        <Link href="/farming">
          <div className={[styles.button, activeTabIndex == 2 ? styles['active'] : ''].join(' ')}>Farm</div>
        </Link>
      </div>
      <div className={[styles['menu-item']].join(' ')}>
        <Link href="/pools">
          <div className={[styles.button, activeTabIndex == 3 || activeTabIndex == 4 ? styles['active'] : ''].join(' ')}>Projects</div>
        </Link>
      </div>
      <div className={[styles['menu-item']].join(' ')}>
        <Link href="/stake">
          <div className={[styles.button, activeTabIndex == 1 ? styles['active'] : ''].join(' ')}>Staking</div>
        </Link>
      </div>
      <div className={[styles['menu-item']].join(' ')}>
        <WalletButton
          className={styles['wallet-button-mobile']}
          style={{ background: 'none', 'boxShadow': 'none' }}
        ></WalletButton>
      </div> */}
    </Menu>
  );

  const owner = async () => {
    console.log(`使用账户: ${account.address}`);

    // 1. 查询合约拥有者

    const contractOwner = await publicClient.readContract({
      address: contractAddress,
      abi:abiOut,
      functionName: "owner",
      args: [],
    });
    console.log(`合约所有者: ${contractOwner}`);
    console.log(`当前账户: ${account.address}`);

    // 2. 分配权限
    try {
      const targetUser = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac";
      const txHash = await walletClient.writeContract({
        address: contractAddress,
        abi:abiOut,
        functionName: "assignUserRole",
        args: [targetUser],
      });

      console.log(`assignUserRole 交易发送: ${txHash}`);
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      console.log(`assignUserRole 交易确认: 区块 ${receipt.blockNumber}`);

      // 可选：解析事件
      const eventLog = receipt.logs.find((log) => {
        try {
          const decoded = decodeEventLog({
            abi:abiOut,
            data: log.data,
            topics: log.topics,
          });
          return (
            (decoded as { eventName: string }).eventName === "UserRoleAssigned"
          );
        } catch {
          return false;
        }
      });

      if (eventLog) {
        const decodedEvent = decodeEventLog({
          abi:abiOut,
          data: eventLog.data,
          topics: eventLog.topics,
        });
        // 使用类型断言确保 decodedEvent.args 的类型安全
        console.log(
          "🧾 权限分配事件:",
          (decodedEvent as { args: unknown }).args
        );
      }
    } catch (error) {
      console.error("分配角色失败:", error);
    }
    // 3. 查询用户角色信息
    try {
      const targetAddress = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac";
      const targetUserInfo = (await publicClient.readContract({
        address: contractAddress,
        abi:abiOut,
        functionName: "getUserInfo",
        args: [targetAddress],
      })) as UserInfo;

      console.log(`目标用户当前角色: ${targetUserInfo.role}`);
      console.log(`目标用户当前部门: ${targetUserInfo.departmentId}`);
    } catch (error) {
      console.log("获取目标用户信息失败，可能尚未分配角色");
    }
  };
  useEffect(() => {
    owner();
  }, []);
  return (
    <Header className={styles.header}>
      <Row className="main-content">
        <Col span={6}>
          {/* logo */}
          <Link href="/">
            <div className={styles["logo"]} style={{ cursor: "pointer" }}>
              <h1 className={"Boba title app-name " + styles.title}>
                {/* <i className={['icon', styles['logo-icon']].join(' ')}></i> */}
                <span className={styles.logo}>DTrust</span>
                {/* <IconAppLogo className={['icon', styles['logo-icon']].join(' ')} /> */}
                {/* <span className={styles['app-name']}>DTrust</span> */}
              </h1>
            </div>
          </Link>
        </Col>
        <Col
          span={isDesktopOrLaptop ? 18 : 4}
          offset={isDesktopOrLaptop ? 0 : 14}
        >
          {isDesktopOrLaptop ? (
            <Row
              className={styles.menu}
              key="desktop"
              justify="space-between"
              align="middle"
            >
              <Link href="/">
                <div
                  className={[
                    styles.button,
                    activeTabIndex == 0 ? styles["active"] : "",
                  ].join(" ")}
                >
                  Home
                </div>
              </Link>
              {/* <Link href="/farming">
                  <div className={[styles.button, activeTabIndex == 2 ? styles['active'] : ''].join(' ')}>Farm</div>
                </Link>
                <Link href="/pools">
                  <div className={[styles.button, activeTabIndex == 3 || activeTabIndex == 4 ? styles['active'] : ''].join(' ')}>Projects</div>
                </Link>
                <Link href="/stake">
                  <div className={[styles.button, activeTabIndex == 1 ? styles['active'] : ''].join(' ')}>Staking</div>
                </Link> */}
              <WalletButton></WalletButton>
              <NetworkButton></NetworkButton>
            </Row>
          ) : ["/safepal"].includes(router.pathname) ? (
            <>
              <WalletButton
                className={styles["wallet-button-safepal"]}
              ></WalletButton>
            </>
          ) : (
            <>
              <Row
                justify="end"
                align="middle"
                style={{ width: "100%", height: "100%" }}
              >
                <MenuOutlined
                  style={{ fontSize: "0.36rem" }}
                  onClick={() => setShowSider(!showSider)}
                ></MenuOutlined>
              </Row>
              <Layout.Sider
                collapsed={!showSider}
                collapsedWidth={0}
                theme="light"
                onClick={() => setShowSider(!showSider)}
                style={{
                  position: "fixed",
                  right: "0",
                  textIndent: "1em",
                  zIndex: "100",
                }}
              >
                {menu}
              </Layout.Sider>
              <div
                className={styles["sider-background"]}
                onClick={() => setShowSider(!showSider)}
                style={{ display: showSider ? "block" : "none" }}
              >
                &nbsp;
              </div>
            </>
          )}
        </Col>
      </Row>
    </Header>
  );
}
