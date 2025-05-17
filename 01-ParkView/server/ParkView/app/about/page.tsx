'use client';
import React from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';

// 定义团队成员类型
interface TeamMember {
  name: string;
  role: string;
  image: string;
}

// 定义公司数据类型
interface CompanyStats {
  label: string;
  value: string;
}

export default function About() {
  const t = useTranslations('about');
  
  // 团队成员数据
  const teamMembers: TeamMember[] = [
    {
      name: "Tom",
      role: t('team.roles.ceo'),
      image: "/member.webp"
    },
    {
      name: "CX",
      role: t('team.roles.cto'),
      image: "/member.webp"
    },
    {
      name: "aladam",
      role: t('team.roles.cmo'),
      image: "/member.webp"
    }
  ];

  // 公司统计数据
  const stats: CompanyStats[] = [
    { label: t('stats.clients'), value: "50,000+" },
    { label: t('stats.vehicles'), value: "1,000+" },
    { label: t('stats.cities'), value: "10+" },
    { label: t('stats.years'), value: "1" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* 主标题部分 */}
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">{t('hero.title')}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {t('hero.description')}
        </p>
      </div>

      {/* 统计数据展示 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
            <div className="text-gray-600 mt-2">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 使命愿景部分 */}
      <div className="mb-20">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center p-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-bold mb-4 text-blue-600">{t('mission.title')}</h3>
            <p className="text-gray-700">{t('mission.description')}</p>
          </div>
          <div className="text-center p-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-bold mb-4 text-green-600">{t('vision.title')}</h3>
            <p className="text-gray-700">{t('vision.description')}</p>
          </div>
          <div className="text-center p-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-2xl font-bold mb-4 text-purple-600">{t('values.title')}</h3>
            <p className="text-gray-700">{t('values.description')}</p>
          </div>
        </div>
      </div>

      {/* 泊车链技术 */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t('technology.title')}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            {t('technology.subtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-3 text-blue-600">{t('technology.blockchain.title')}</h3>
              <p className="text-gray-700">{t('technology.blockchain.description')}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-3 text-blue-600">{t('technology.smartContract.title')}</h3>
              <p className="text-gray-700">{t('technology.smartContract.description')}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-xl font-bold mb-3 text-blue-600">{t('technology.digitalIdentity.title')}</h3>
              <p className="text-gray-700">{t('technology.digitalIdentity.description')}</p>
            </div>
          </div>
          <div className="relative h-[400px]">
            <Image 
              src="/web3jishu.webp" 
              alt={t('technology.title')}
              fill
              priority
              className="object-cover rounded-lg shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* 公司介绍部分 */}
      <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
        <div className="relative h-[500px]">
          <Image 
            src="/zongbu.jpeg" 
            alt={t('story.title')}
            fill
            className="object-cover rounded-lg shadow-xl"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold mb-6">{t('story.title')}</h2>
          <p className="text-gray-700 leading-relaxed">{t('story.description1')}</p>
          <p className="text-gray-700 leading-relaxed">{t('story.description2')}</p>
        </div>
      </div>

      {/* 团队介绍 */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">{t('team.title')}</h2>
        <div className="grid md:grid-cols-3 gap-12">
          {teamMembers.map((member, index) => (
            <div key={index} className="text-center bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-40 h-40 mx-auto mb-6">
                <Image 
                  src={member.image}
                  alt={member.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-gray-800">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}