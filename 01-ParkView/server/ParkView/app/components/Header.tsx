"use client";

import { ConnectWallet } from "./ConnectButton";
import { useTranslations } from 'next-intl';

export default function Header() {
  const t = useTranslations('header');

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl text-green-500 p-4">{t('slogan')}</h1>
      <div className="flex items-center p-4">
            <ConnectWallet />
      </div>
    </div>
  )
}