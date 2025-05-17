'use client';

import React from 'react';
import Image from 'next/image';
import {useTranslations} from 'next-intl';

export default function About() {
  const t = useTranslations('contact');
  
  return (
    <div className="container mx-none px-4 py-4">
      <h1 className="text-3xl font-bold text-center mb-12">{t('title')}</h1>
      
      <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
        {/* 左侧图片 */}
        <div className="relative">
          <Image 
            src="/about.jpg" 
            alt={t('image.alt')}
            width={800}
            height={800}
            className="w-full h-[400px] object-cover rounded-lg shadow-lg"
          />
        </div>

        {/* 右侧文字内容 */}
        <div className="space-y-6">
          <p className="text-gray-700 leading-relaxed">
            {t('intro')}
          </p>
          <p className="text-gray-700 leading-relaxed bold-text">
            {t('thanks')}
          </p>
          <p className="text-gray-700 leading-relaxed">
            {t('service.hotline')}
            <br />
            {t('service.hours')}
          </p>

          <p className="text-gray-700 leading-relaxed">
            {t('commitment')}
          </p>
        </div>
      </div>
    </div>
  );
}