'use client';

import React from 'react';
import {useTranslations} from 'next-intl';
//import LegalSection from '../components/LegalSection';

// // 用户协议内容
// const USER_AGREEMENT = [
//   { 
//     id: 1, 
//     content: '1. 服务范围：本平台提供车位租赁信息发布、在线预订及支付等服务。用户在使用本平台服务时应当遵守相关法律法规。' 
//   },
//   { 
//     id: 2, 
//     content: '2. 用户责任：用户应保证注册信息的真实性，并对账号安全负责。因账号被盗造成的损失由用户自行承担。' 
//   },
//   { 
//     id: 3, 
//     content: '3. 支付规则：用户应按照平台规定的方式和时间支付租金。如有逾期，平台有权收取滞纳金。' 
//   },
//   { 
//     id: 4, 
//     content: '4. 租赁管理：用户应遵守车位使用规范，不得将车位用于非法用途或转租。如有违规，平台有权终止服务。' 
//   }
// ];

// // 隐私政策内容
// const PRIVACY_POLICY = [
//   { 
//     id: 1, 
//     content: '1. 信息收集：我们收集用户的基本信息（姓名、联系方式）、车辆信息、支付信息等必要数据。' 
//   },
//   { 
//     id: 2, 
//     content: '2. 数据使用：收集的信息将用于提供服务、用户验证、支付处理、客户服务及系统优化。' 
//   },
//   { 
//     id: 3, 
//     content: '3. 信息安全：我们采用业界标准的加密技术和安全防护措施保护用户数据，防止未经授权的访问。' 
//   },
//   { 
//     id: 4, 
//     content: '4. 数据共享：除法律要求或获得用户授权外，我们不会向第三方分享用户个人信息。' 
//   }
// ];

// // 免责声明内容
// const DISCLAIMER = [
//   { 
//     id: 1, 
//     content: '1. 服务限制：本平台仅提供信息对接服务，不对车位的实际状况及使用承担责任。' 
//   },
//   { 
//     id: 2, 
//     content: '2. 系统维护：平台定期进行系统维护和升级，可能导致服务暂时中断，敬请谅解。' 
//   },
//   { 
//     id: 3, 
//     content: '3. 不可抗力：因自然灾害、网络故障等不可抗力导致的服务中断或损失，平台不承担责任。' 
//   },
//   { 
//     id: 4, 
//     content: '4. 争议处理：如发生租赁纠纷，平台将协助双方友好协商解决，但不承担法律责任。' 
//   }
// ];

export default function Policy() {
  const t = useTranslations('policy');
  
  return (
    <main className="w-full px-4">
      <h1 className="text-3xl font-bold text-center mb-12">{t('title')}</h1>
      
      {/* 基本政策说明 */}
      <section className="w-full mb-16">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">{t('basicPolicy.title')}</h2>
          
          {/* 政策介绍部分使用两列布局 */}
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="text-gray-700 leading-relaxed">
                {t('basicPolicy.intro1')}
              </p>

              <p className="text-gray-700 leading-relaxed mt-4">
                {t('basicPolicy.intro2')}
              </p>
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              {t('basicPolicy.welcome')}
            </p>
          </div>
          
          {/* 租赁政策和费用标准使用两列布局 */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">{t('basicPolicy.rental.title')}</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {t('basicPolicy.rental.content')}
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">{t('basicPolicy.fees.title')}</h3>
              <p className="text-gray-700">
                {t('basicPolicy.fees.content')}
              </p>
            </div>
          </div>
          
          {/* <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold mb-3">{t('basicPolicy.rules.title')}</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {t('basicPolicy.rules.items', {}, {returnObjects: true}).slice(0, 2).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {t('basicPolicy.rules.items', {}, {returnObjects: true}).slice(2).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div> */}
        </div>
      </section>

      {/* 法律声明部分 */}
      {/* <section className="w-full bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-8 text-center">{t('legal.title')}</h2>
        <LegalSection title={t('legal.userAgreement')} items={USER_AGREEMENT} />
        <LegalSection title={t('legal.privacyPolicy')} items={PRIVACY_POLICY} />
        <LegalSection title={t('legal.disclaimer')} items={DISCLAIMER} />
      </section> */}
    </main>
  );
}