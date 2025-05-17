'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {useTranslations} from 'next-intl';
import {
    HomeOutlined,
    CarOutlined,
    TeamOutlined,
    FileTextOutlined,
    PhoneOutlined,
    FacebookOutlined,
    TwitterOutlined,
    InstagramOutlined,
    LinkedinOutlined,
    YoutubeOutlined
} from '@ant-design/icons'

export default function Sidebar() {
    const pathname = usePathname()
    const t = useTranslations('nav');

    const menuItems = [
        { path: '/', icon: <HomeOutlined />, label: t('home') },
        { path: '/my-parking', icon: <CarOutlined />, label: t('myParking') },
        { path: '/about', icon: <TeamOutlined />, label: t('about') },
        { path: '/policy', icon: <FileTextOutlined />, label: t('policy') },
        { path: '/contact', icon: <PhoneOutlined />, label: t('contact') },
    ]

    const socialLinks = [
        { icon: <FacebookOutlined />, url: '#' },
        { icon: <TwitterOutlined />, url: '#' },
        { icon: <InstagramOutlined />, url: '#' },
        { icon: <LinkedinOutlined />, url: '#' },
        { icon: <YoutubeOutlined />, url: '#' },
    ]

    return (
        <div className="w-64 min-h-screen bg-white shadow-lg flex flex-col">
            {/* Logo */}
            <div className="p-4 border-b">
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={80}
                    height={80}
                    className="mx-auto"
                />
            </div>

            {/* 语言选择 */}
            <div className="px-4 py-2 flex justify-center items-center text-sm border-b">
                <span className="text-gray-600">{t('name')}</span>
                {/* <span className="text-gray-600">{t('language')}：</span>
                <span className="space-x-2">
                    <span className="text-green-500">{t('chinese')}</span>
                    <span>|</span>
                    <span>{t('english')}</span>
                </span> */}
            </div>

            {/* 导航菜单 */}
            <nav className="flex-none px-4 py-8">
                {menuItems.map(item => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center space-x-2 px-4 py-3 rounded-lg mb-2 ${
                            pathname === item.path
                                ? 'bg-green-500 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`
                    }>
                        {item.icon}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* 分享部分 */}
            <div className="p-4 border-t">
                <div className="text-gray-600 mb-2">{t('share')}</div>
                <div className="text-sm text-gray-500 mb-3">
                    {t('shareText')}
                </div>
                <div className="flex space-x-3">
                    {socialLinks.map((link, index) => (
                        <a
                            key={index}
                            href={link.url}
                            className="text-gray-400 hover:text-green-500 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer" >
                            {link.icon}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    )
} 