"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { useTranslations } from 'next-intl';

export function ConnectWallet() {
    const t = useTranslations('wallet');
    
    return (
        <ConnectButton.Custom>
            {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
            }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                    <div
                        {...(!ready && {
                            "aria-hidden": true,
                            style: {
                                opacity: 0,
                                pointerEvents: "none",
                                userSelect: "none",
                            },
                        })}
                    >
                        {(() => {
                            if (!connected) {
                                return (
                                    <button
                                        onClick={openConnectModal}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
                                    >
                                        {t('connect')}
                                    </button>
                                );
                            }

                            return (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={openChainModal}
                                        className="flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        {chain.hasIcon && (
                                            <div className="w-5 h-5 mr-2">
                                                {chain.iconUrl && (
                                                    <Image
                                                        alt={
                                                            chain.name ??
                                                            "Chain icon"
                                                        }
                                                        src={chain.iconUrl}
                                                        width={20}
                                                        height={20}
                                                        className="w-5 h-5"
                                                    />
                                                )}
                                            </div>
                                        )}
                                        {chain.name}
                                    </button>

                                    <button
                                        onClick={openAccountModal}
                                        className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        {account.displayName}
                                        {account.displayBalance
                                            ? ` (${account.displayBalance})`
                                            : ""}
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                );
            }}
        </ConnectButton.Custom>
    );
}
