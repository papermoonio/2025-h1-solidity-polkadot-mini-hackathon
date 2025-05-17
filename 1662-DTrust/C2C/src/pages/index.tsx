import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AppProps } from "next/app";
import styles from "./index.module.scss";
import axios from "@src/api/axios";

import { Row, Col, Button, Upload, UploadProps, message } from "antd";
import LivePoolCard from "@src/components/elements/LivePoolCard";
import WalletButton from "@src/components/elements/WalletButton";

import { useThirdParty } from "@src/hooks/useThirdParty";
import { useResponsive } from "@src/hooks/useResponsive";
import ScrollAnimation from "react-animate-on-scroll";

import HomeBanner from "@src/containers/HomeBanner/HomeBanner";

import {
  IconIndexSuccess,
  IconTwitter,
  IconMedium,
  IconTelegram,
  IconPerson,
  IconHeart,
  IconBoba,
  IconIndexGroup_3,
  IconIndexGroup_5,
  IconBeforeTitle,
} from "@src/components/icons";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  keccak256,
  toHex,
  defineChain,
  custom,
} from "viem";
import { mainnet } from "viem/chains";
import Image from "next/image";
import { abi as abiOut } from "../util/ContractVerifier.json";
import { useWallet } from "@src/hooks/useWallet";

const CONTRACT_ADDRESS = "0x97e0c8f6643df31197fff71ced70f8288c187120";
const RPC_URL = "https://westend-asset-hub-eth-rpc.polkadot.io";
const contractAddress = "0x97e0c8f6643df31197fff71ced70f8288c187120"; // 合约地址

const westendAssetHub = defineChain({
  id:420420421, // ❗ 示例 Chain ID, 请替换为 Westend Asset Hub 的实际 Chain ID
  name: 'Westend Asset Hub',
  nativeCurrency: { name: 'Westend Dot', symbol: 'WND', decimals: 18 }, // ❗ 示例原生代币, 请核实并替换
  rpcUrls: { 
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  // blockExplorers: { // 可选: 如果有区块浏览器
  //   default: { name: 'ExplorerName', url: 'https://explorer.example.com' },
  // },
});

// 创建公共客户端（只读）
const client = createPublicClient({
  transport: http(RPC_URL),
});
const Index = ({ Component, pageProps }: AppProps) => {
  const [projectData, setProjectData] = useState([]);
  const [livePoolsData, setLivePoolsData] = useState([]);
  const [cardIndex, setCardIndex] = useState(1);
  const { walletAddress: reduxWalletAddress, connect } = useWallet();
  const [walletAddress, setWalletAddress] = useState(reduxWalletAddress);
  
  // 当 Redux 中的钱包地址变化时，更新本地状态
  useEffect(() => {
    setWalletAddress(reduxWalletAddress);
  }, [reduxWalletAddress]);
  



  const {} = useThirdParty();
  let { isDesktopOrLaptop, isTabletOrMobile } = useResponsive();

  const createOption = async () => {
    // 调用合约函数，例如 owner()
    const result = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: abiOut,
      functionName: "owner",
      args: [], // 如果函数有参数，填在这里
    });

    console.log("owner() 返回值:", result);
  };

  const send = async (contractId,fileHash) => {
    if (!walletAddress) {
      message.error("请先连接钱包");
      return;
    }
    // 使用 window.ethereum 作为 provider
    const walletClient = createWalletClient({
      account: walletAddress,
      chain: westendAssetHub,
      transport:
        typeof window !== "undefined" && window.ethereum
          ? custom(window.ethereum) // ✅ 包装成 transport 函数
          : http(),
    });

    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: abiOut,
      functionName: "uploadContract",
      args: [
        contractId, 
        fileHash, 
        "6.0.0", 
        "NDA",
      ],
      chain: westendAssetHub,
      account: walletAddress,
    });
    console.log(`uploadContract 交易发送: ${txHash}`);
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
    });
    console.log(`uploadContract 交易确认: 区块 ${receipt.blockNumber}`);
};
  const exportHashAndId = async (info) => {
    // 读取文件并计算哈希
    const file = info.file.originFileObj;
    const fileBuffer = await file.arrayBuffer();
    // 正确转换为 Uint8Array 后再 toHex
    const fileHash = keccak256(toHex(new Uint8Array(fileBuffer)));

     // 打印哈希值
  console.log("上传文件的哈希值:", fileHash);
  message.info(`文件哈希值: ${fileHash}`);
  message.info(`钱包地址: ${walletAddress}`);
    // 检查钱包是否已连接
    if (!walletAddress) {
      message.error("请先连接钱包！");
      return;
    }

    // 生成一个简单的 contractId，实际应用中需要更可靠的方式
    const contractId = BigInt(Date.now());
    send(contractId,fileHash);
  };
  const isHashExists = async (fileHash) => {
    // 6. 检查 hash 是否存在
    const exists = await client.readContract({
      address: contractAddress,
      abi: abiOut,
      functionName: "isHashExists",
      args: [fileHash],
    });
    console.log(`🔍 Hash 是否存在: ${exists}`);
    alert(`文件哈希值: ${fileHash.slice(0, 10)}...${fileHash.slice(-8)}\n验证结果: ${exists ? '✅ 已存在于区块链中' : '❌ 不存在于区块链中'}`);
  };

  const verifyHashAndId = async (info) => {
    // 读取文件并计算哈希
    const file = info.file.originFileObj;
    const fileBuffer = await file.arrayBuffer();
    // 正确转换为 Uint8Array 后再 toHex
    const fileHash = keccak256(toHex(new Uint8Array(fileBuffer)));
    isHashExists(fileHash);
  };
  useEffect(() => {
    axios
      .get("/boba/product/list")
      .then((res) => {
        setProjectData(res.data);
        setLivePoolsData(
          res.data
            .sort((a, b) => {
              return a.status - b.status;
            })
            .slice(0, 3)
        );
      })
      .catch((error) => {});

    return () => {};
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      let index = cardIndex + 1;
      if (index > 3) {
        index = 1;
      }
      setCardIndex(index);
    }, 5000);
    return () => {
      clearInterval(timer);
    };
  }, [cardIndex]);
  const props: UploadProps = {
    name: "file",
    action: "https://www.mocky.io/v2/5cc8019d300000980a055e76",
    headers: {
      authorization: "authorization-text",
    },
    onChange(info) {
      if (info.file.status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
        exportHashAndId(info);
      }
    },
  };
  const propsVerify: UploadProps = {
    name: "file",
    action: "https://www.mocky.io/v2/5cc8019d300000980a055e76",
    headers: {
      authorization: "authorization-text",
    },
    onChange(info) {
      if (info.file.status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
        verifyHashAndId(info);
      }
    },
  };
  const section1 = useMemo(() => {
    return (
      <section
        className={[
          styles["sec-1"],
          styles["sec"],
          "sec-1",
          styles["animated-1"],
        ].join(" ")}
      >
        <div className={"background " + styles["background-1"]}></div>
        <div className="main-content">
          {/* <HomeBanner></HomeBanner> */}

          <Row>
            <Col span={isDesktopOrLaptop ? 18 : 24}>
              <h1 className="title">
                数据真实性验证平台
                <br />
                on Dtrust
              </h1>
              <div className="desc">
                点击按钮上传合同
                <br />
                Click the button to upload the file.
                <br />Generate a hash and upload it to the blockchain.
              </div>
              <Upload {...props}>
                <Button className={styles["button"] + " button"}>
                  文件上传
                </Button>
              </Upload>
            </Col>
            <Col span={isDesktopOrLaptop ? 6 : 0}>
              {isDesktopOrLaptop ? (
                // ? <IconIndexSuccess style={{ position: 'absolute', right: '0', top: '10%' }} />
                <div className={styles.banner}></div>
              ) : (
                <></>
              )}
            </Col>
          </Row>
        </div>
        <style lang="scss">{`
        .sec-1 {
          position: relative;
          background-color: #000000;
        }
        .sec-1 h1 {
          font-size: 0.46rem;
          color: #ffffff;
        }
        .sec-1 .main-content {
          padding-top: .1rem;
          padding-bottom: 1rem;
        }
        .sec-1 .desc {
          margin-top: 23px;
          line-height: 40px;
          font-size: 0.20rem;
        }
        .sec-1 .button {
          margin-top: 30px;
          font-size: 0.22rem;
        }
        .sec-1 .medias {
          margin-top: 28px;
        }
        .sec-1 .circle {
          display: inline-block;
          width: 40px;
          height: 40px;
          background-color: transparent;
          border-radius: 50%;
          margin-right: 10px;
          cursor: pointer;
          text-align: center;
          line-height: 40px;
        }
        .sec-1 .circle:hover {
          filter: brightness(0.5);
        }
        .sec-1 .medias i.icon {
        }
        .sec-1 .extra {
          margin-top: 115px;
        }
        .sec-1 .extra .icon {
          display: inline-block;
          margin-left: 38px;
          margin-right: 12px;
          vertical-align: middle;
        }
        @media (max-width: 769px) {
          .sec-1 .main-content {
            padding-top: .5rem;
          }
        }
      `}</style>
      </section>
    );
  }, [isDesktopOrLaptop]);

  const section2 = useMemo(() => {
    return (
      <ScrollAnimation
        offset={0}
        scrollableParentSelector={".main-body"}
        animateOnce
        animateIn={styles["animated-2"]}
      >
        <section
          className={[styles["sec-2"], styles["sec"], "sec-2"].join(" ")}
        >
          <div className={"background " + styles["background-2"]}></div>
          <div className="main-content">
            <Row align="middle">
              <Col
                span={isDesktopOrLaptop ? 12 : 24}
                className={styles["appear"]}
              >
                <h2 className={styles["colored-title"]}>
                  <IconBeforeTitle className={styles["before-title"]} />
                  文件校验
                  <br />
                  Less Trust, More Truth!
                </h2>
                <div className="desc">
                  BMoving from trust-based systems to truth-based systems,
                  <br />
                  where truth is enforced by code, data, and decentralized mechanisms
                  <br />
                  ather than assumptions of integrity.
                </div>
                <Upload {...propsVerify}>
                  <Button className={styles["button"] + " button"}>
                  文件校验
                  </Button>
                </Upload>
              </Col>
              {isDesktopOrLaptop ? (
                <Col
                  span={12}
                  style={{ height: "600px" }}
                  className={styles["focus-" + cardIndex]}
                >
                  {livePoolsData.map((info, index) => {
                    return (
                      <LivePoolCard
                        info={info}
                        key={index}
                        className={[
                          styles["card"],
                          styles["card-" + (index + 1)],
                        ].join(" ")}
                        onClick={() => {
                          setCardIndex(index + 1);
                        }}
                      ></LivePoolCard>
                    );
                  })}
                </Col>
              ) : (
                <></>
              )}
            </Row>
          </div>
          <style lang="scss">{`
        .sec-2 h2 {
          margin-top: 56px;
        }
        .sec-2 .desc {
          margin-top: 66px;
        }
        .sec-2 .button{
          margin-top: 40px;
          font-size: 0.22rem;
        }
      `}</style>
        </section>
      </ScrollAnimation>
    );
  }, [isDesktopOrLaptop, livePoolsData, cardIndex]);

  const section3 = useMemo(() => {
    return (
      <ScrollAnimation
        scrollableParentSelector={".main-body"}
        animateIn={styles["animated-3"]}
        animateOnce
      >
        <section className={`${styles["sec-3"]} ${styles["sec"]} sec-3`}>
          <div className="main-content">
            <h2
              className={[styles["colored-title"], styles["appear"]].join(" ")}
            >
              <IconBeforeTitle className={styles["before-title"]} />
              Features
            </h2>
            <Row className="features" justify="space-around" gutter={0}>
              {[
                [<>Easy to Use</>, ""],
                [<>Fairest Staking</>, ""],
                [<>Sustainable Community</>, ""],
                [<>Brightest Projects</>, ""],
              ].map((val, index) => (
                <Col
                  span={isDesktopOrLaptop ? 6 : 12}
                  style={{ textAlign: "center" }}
                  key={index}
                >
                  <div
                    className={[
                      "feature",
                      styles["feature-" + (index + 1)],
                      styles["appear"],
                    ].join(" ")}
                    key={index}
                  >
                    <i className="icon">{IconIndexGroup_3[index]()}</i>
                    {/* <i className={"icon absolute-horizontal-center "+styles['icon-index-3-'+(index+1)]}></i> */}
                    <div className="text absolute-horizontal-center">
                      {val[0]}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>

          <style lang="scss">{`
        .sec-3 h2 {
          margin-top: 96px;
        }
        .sec-3 .features {
          margin-top: 72px;
        }
        .sec-3 .feature {
          display: inline-block;
          width: 250px;
          height: 250px;
          border-radius: 50%;
          margin-bottom: 59px;
          vertical-align: middle;
          position: relative;
          background-image: linear-gradient(171deg, #4DCC8A33 0%, #1EA15233 100%);
          transition: all 1s;
          cursor: pointer;
        }
        .sec-3 .feature:hover {
          background-image: linear-gradient(171deg, #4DCC8AA0 0%, #1EA152A0 100%);
        }
        .sec-3 .text {
          width: 100%;
          position: absolute;
          top: 142px;
          text-align: center;
          font-size: 0.20rem;
        }
        .sec-3 .icon {
          display: inline-block;
          position: absolute;
          top: 21%;
          left: 0;
          width: 100%;
          text-align: center;
        }
        @media (max-width: 769px) {
          .sec-3 .feature {
            width: 125px;
            height: 125px;
            margin-bottom: 1rem;
          }
          .sec-3 .icon {
            top: 50%;
            transform: translateY(-50%);
          }
        }
      `}</style>
        </section>
      </ScrollAnimation>
    );
  }, [isDesktopOrLaptop]);

  const section4 = (
    <ScrollAnimation
      scrollableParentSelector={".main-body"}
      animateIn={styles["animated-4"]}
      animateOnce
    >
      <section className={`${styles["sec-4"]} ${styles["sec"]} sec-4`}>
        <div className={"background " + styles["background-4"]}></div>
        <div className="main-content">
          <h2 className={[styles["colored-title"], styles["appear"]].join(" ")}>
            <IconBeforeTitle className={styles["before-title"]} />
            Investors
          </h2>
          <Row justify="space-between">
            <Col
              span={isDesktopOrLaptop ? 12 : 24}
              className={["desc", styles["appear"]].join(" ")}
            >
              You can find various investment opportunities in the trustworthy{" "}
              <br />
              platform, often with limited-time perks and pricing for you as the{" "}
              <br />
              earliest investors. Just get a preview of these projects, register
              for <br />
              early access in the campaign and join their growth journey
              together.
            </Col>
            <Col span={isDesktopOrLaptop ? 12 : 24} className="features">
              <Row justify="space-around">
                {[
                  [<>Exponential ROI</>],
                  [<>Zero Platform Fee</>],
                  [<>Fairest Token Price</>],
                  [<>Insured Project Outcomes</>],
                ].map((val, index) => (
                  <Col
                    span={11}
                    className={[
                      "feature",
                      styles["pop"],
                      styles["feature-" + (index + 1)],
                    ].join(" ")}
                    key={index}
                  >
                    <div className="text absolute-horizontal-center">
                      {val[0]}
                    </div>
                  </Col>
                ))}
              </Row>
            </Col>
          </Row>
        </div>
        <style lang="scss">{`
          .sec-4 h2 {
            margin-top: 0;
            margin-bottom: 90px;
          }
          .sec-4 .desc {
            width: 55%;
            margin-bottom: 20px;
          }
          .sec-4 .extra {
            font-family: LucidaGrande;
            margin-top: 123px;
            font-size: 0.35rem;
            color: #FFB852;
          }
          .sec-4 .features {
          }
          .sec-4 .feature {
            display: inline-block;
            width: 100%;
            height: 133px;
            border-radius: 16px;
            margin-bottom: 20px;
            background-image: linear-gradient(179deg, #D7FF1E80 0%, #FFB85280 100%);
            transition: all 1s;
            transform: scale(1);
          }
          .sec-4 .feature:hover {
            background-image: linear-gradient(179deg, #D7FF1EBD 0%, #FFB852BD 100%);
            transform: scale(1.1);
          }
          .sec-4 .text {
            width: 100%;
            position: absolute;
            top: 50%;
            text-align: center;
            font-size: 0.24rem;
            transform: translateY(-50%);
          }
          @media (max-width:769px) {
            .sec-4 h2 {
              margin-bottom: 20px;
            }
          }
        `}</style>
      </section>
    </ScrollAnimation>
  );

  const section5 = (
    <ScrollAnimation
      scrollableParentSelector={".main-body"}
      animateIn={styles["animated-5"]}
      animateOnce
    >
      <section
        className={`${styles["sec-5"]} ${styles["sec"]} sec-5 ${styles["appear"]}`}
      >
        <div className="main-content">
          <h2 className={styles["colored-title"]}>
            <IconBeforeTitle className={styles["before-title"]} />
            Project Teams
          </h2>
          <div className="desc">
            Feel free to easily access resources in C2N that help you succeed at
            every step from fundraising to market expansion. Besides raising
            money,
            <br />
            hope you can enjoy your time in our community and continuously find
            your investors, partners, advisors and customers.
          </div>
          <div className="features">
            {[
              [
                <>
                  Abundant
                  <br />
                  Investment
                </>,
                "",
              ],
              [
                <>
                  Free Marketing
                  <br />
                  Expansion
                </>,
                "",
              ],
              [
                <>
                  Full-scope of Blockchain
                  <br />
                  Consulting Services
                </>,
                "",
              ],
              [
                <>
                  Exponential Growth
                  <br />
                </>,
                "",
              ],
            ].map((val, index) => (
              <div
                className={[
                  "feature",
                  styles["appear"],
                  styles["feature-" + (index + 1)],
                ].join(" ")}
                key={index}
              >
                <i className={"icon " + styles["icon-index-5-" + (index + 1)]}>
                  {IconIndexGroup_5[index]()}
                </i>
                <div className="text">{val[0]}</div>
              </div>
            ))}
          </div>
          <style lang="scss">{`
          .sec-5 h2 {
            margin-top: 80px;
            margin-bottom: 57px;
          }
          .sec-5 .desc {
          }
          .sec-5 .extra {
            font-family: Arial;
            margin-top: 40px;
            font-size: 0.22rem;
            color: #FFB852;
          }
          .sec-5 .features {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            width: 100%;
            margin-top: 40px;
          }
          .sec-5 .feature {
            flex-shrink: 0;
            flex-grow: 0;
            display: inline-block;
            width: 25%;
            min-width: 300px;
            padding-top: 1px;
            border-radius: 16px;
            position: relative;
            cursor: initial;
            text-align: center;
          }
          .sec-5 .text {
            width: 100%;
            position: relative;
            margin-top: 0.3rem;
            text-align: center;
            font-size: 0.24rem;
          }
          .sec-5 .icon {
            display: inline-block;
            width: 120px;
            height: 120px;
            border-radius: 16px;            
            margin-top: 30px;
            background-color: #d4f524;
            cursor: pointer;
          }
          @media (max-width:769px) {
            .sec-5 h2 {
              margin-bottom: 20px;
            }
            .sec-5 .features {
              margin-top: 0;
            }
            .sec-5 .feature {
              width: 25%;
              min-width: 150px;
            }
            .sec-5 .text {
              font-size: 0.16rem;
            }
          }
        `}</style>
        </div>
      </section>
    </ScrollAnimation>
  );

  const section6 = (
    <ScrollAnimation
      scrollableParentSelector={".main-body"}
      animateIn={styles["animated-6"]}
      animateOnce
    >
      <section
        className={`${styles["sec-6"]} ${styles["sec"]} sec-6 ${styles["appear"]}`}
      >
        <div className="main-content">
          <h2 className={styles["colored-title"]}>
            <IconBeforeTitle className={styles["before-title"]} />
            In Our Community
          </h2>
          <div className="desc">
            Come and let’s brew our own network together! Members in our
            community have the same right to make their own voices heard and
            access valued
            <br />
            information. Our community is always hunting for the next big things
            that surprise and delight. At the early stage of these projects, as
            a member inside,
            <br />
            you own the right to push forward the implementation of them.
          </div>
          <Row className="features" justify="space-between" gutter={[16, 16]}>
            {[
              [<>Fair Policies</>],
              [
                <>
                  Everyone&apos;s
                  <br />
                  Voice Matters
                </>,
              ],
              [<>Secret Fortune</>],
              [
                <>
                  Brew the next big
                  <br />
                  things together!
                </>,
              ],
            ].map((val, index) => (
              <Col
                span={isDesktopOrLaptop ? 6 : 12}
                key={index}
                style={{ textAlign: "center" }}
              >
                <div className="feature">
                  <div className="text absolute-horizontal-center">
                    {val[0]}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
          <style lang="scss">{`
            .sec-6 h2 {
              margin-top: 80px;
            }
            .sec-6 .desc {
              margin-top: 57px;
            }
            .sec-6 .extra {
              font-family: Arial;
              margin-top: 40px;
              font-size: 0.22rem;
              color: #FFB852;
            }
            .sec-6 .features {
              width: 100%;
              margin-top: 24px;
            }
            .sec-6 .feature {
              flex-shrink: 0;
              flex-grow: 0;
              display: inline-block;
              width: 257px;
              height: 133px;
              border-radius: 16px;
              position: relative;
              background-color: black;
            }
            .sec-6 .feature::after{
              content: "";
              width: 261px;
              height: 137px;
              position: absolute;
              top: -2px;
              left: -2px;
              z-index: -10;
              border-radius: 15px;
              background-image: linear-gradient(180deg, #D7FF1E 0%, #FFB852 100%);
            }
            .sec-6 .text {
              width: 100%;
              position: absolute;
              top: 50%;
              text-align: center;
              font-size: 0.24rem;
              transform: translateY(-50%);
            }
            @media (max-width:769px) {
              .sec-6 .feature {
                width: 100%;
                height: 68px;
              }
              .sec-6 .feature::after{
                width: calc(100% + 4px);
                height: 74px;
              }
              .sec-6 .text {
                font-size: 0.16rem;
              }
            }
          `}</style>
        </div>
      </section>
    </ScrollAnimation>
  );

  const section7 = (
    <section className={`${styles["sec-7"]} ${styles["sec"]} sec-7`}>
      <div className="main-content">
        <h2 className={styles["colored-title"]}>
          <IconBeforeTitle className={styles["before-title"]} />
          Avalaunch Powered by Avalanche
        </h2>
        <div className="desc">
          The Avalanche blockchain represents a true step forward for the
          industry, offering highly decentralized applications, new financial
          primitives, and new
          <br />
          interoperable blockchains.
        </div>
        <div className="extra">
          Avalaunch is proud to bring only the best and brightest projects to
          the Avalanche ecosystem. Through their
          <br />
          groundbreaking consensus protocols and architecture, our protocol is
          able to offer:
        </div>
        <div className="features">
          {[
            [<>Cheap transactions</>, ""],
            [<>High throughput</>],
            [
              <>
                Near-instant
                <br />
                finality
              </>,
            ],
            [<>Unparalleled security</>],
            [
              <>
                Interoperable assets
                <br />
                and applications
              </>,
            ],
          ].map((val, index) => (
            <div className="feature" key={index}>
              <i
                className={
                  "icon absolute-horizontal-center " +
                  styles["icon-index-7-" + (index + 1)]
                }
              ></i>
              <div className="text absolute-horizontal-center">{val[0]}</div>
            </div>
          ))}
        </div>
        <style lang="scss">{`
          .sec-7 h2 {
            margin-top: 80px;
          }
          .sec-7 .desc {
            margin-top: 57px;
          }
          .sec-7 .extra {
            font-family: Arial;
            margin-top: 40px;
            font-size: 0.22rem;
            color: #FFB852;
          }
          .sec-7 .features {
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            width: 100%;
            margin-top: 24px;
          }
          .sec-7 .feature {
            display: inline-block;
            width: 20%;
            height: 250px;
            position: relative;
          }
          .sec-7 .text {
            width: 100%;
            position: absolute;
            top: 200px;
            text-align: center;
            font-size: 0.24rem;
          }
          .sec-7 .icon {
            display: inline-block;
            width: 202px;
            height: 171px;
            position: absolute;
            top: 0;
          }
        `}</style>
      </div>
    </section>
  );

  return (
    <main className={"container " + styles["container"]}>
      {section1}
      {section2}
      {/* {section3}
      {section4}
      {section5}
      {section6} */}
      <style lang="scss">{`
        .desc {
          display: block;
          font-size: 0.18rem;
          line-height: 36px;
          white-space: nowrap;
        }
        @media (max-width: 767px) {
          .desc {
            white-space: normal;
          }
          br {
            content: ' ';
          }
          br:after {
            content: ' ';
            display: inline-block;
            width: .25em;
          }
        }
        .feature {
          user-select: none;
          cursor: pointer;
        }
        .background {
          width: 100%;
          height: 100%;
          position: absolute;
          z-index: -999;
          background-position: center;
        }
      `}</style>
    </main>
  );
};


export default Index;
