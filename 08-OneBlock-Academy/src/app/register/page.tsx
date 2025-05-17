'use client';

import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Utility to get current city via Geolocation API
async function getCurrentCity(): Promise<string> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve('');
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        // Use a reverse geocoding API or browser API here
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`
        );
        const data = await res.json();
        resolve(data.city || data.locality || '');
      } catch {
        resolve('');
      }
    });
  });
}

export default function Register() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    wechatId: '',
    phone: '',
    email: '',
    gender: '',
    ageGroup: '',
    education: '',
    university: '',
    major: '',
    city: '',
    status: [] as string[],           // Field 11: 多选
    languages: [] as string[],        // Field 12: 多选
    experience: '',
    source: '',
    participated: '',
    dailyTime: '',
    interests: '',
    platforms: '',
    hackathon: '',
    leadership: '',
    privateMsg: '',
    inviter: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
  
    if (type === 'checkbox') {
      setFormData((prev) => {
        const list = new Set(prev[name as keyof typeof prev] as string[]);
        const checked = target.checked;
        if (checked) list.add(value);
        else list.delete(value);
        return {
          ...prev,
          [name]: Array.from(list),
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  

  const handleGetCity = async () => {
    const city = await getCurrentCity();
    setFormData((prev) => ({ ...prev, city }));
  };

  const handleRegister = async () => {
    if (!address) return;
    // Validate required fields
    for (const key in formData) {
      if (!formData[key as keyof typeof formData] ||
          (Array.isArray(formData[key as keyof typeof formData]) && !(formData[key as keyof typeof formData] as string[]).length)
      ) {
        setError('请完整填写所有必填项');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, address })
      });
      if (response.ok) router.push('/register/pending');
      else {
        const errorData = await response.json();
        setError(errorData.message || '注册失败');
      }
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    disconnect();
    router.push('/');
  };

  if (!isConnected) return <p>请连接钱包</p>;

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h2 className="text-xl font-bold">报名信息</h2>
      {error && <p className="text-red-500">{error}</p>}

      {/* 01 */}
      <div>
        <label className="block mb-1">*姓名：</label>
        <input name="name" value={formData.name} onChange={handleInputChange}
               className="w-full border p-2 rounded" placeholder="请输入姓名" />
      </div>
      {/* 02 */}
      <div>
        <label className="block mb-1">*微信ID：</label>
        <input name="wechatId" value={formData.wechatId} onChange={handleInputChange}
               className="w-full border p-2 rounded" placeholder="请输入微信ID" />
      </div>
      {/* 03 */}
      <div>
        <label className="block mb-1">*手机号：</label>
        <input name="phone" value={formData.phone} onChange={handleInputChange}
               className="w-full border p-2 rounded" placeholder="请输入手机号" />
      </div>
      {/* 04 */}
      <div>
        <label className="block mb-1">*邮箱：</label>
        <input name="email" type="email" value={formData.email} onChange={handleInputChange}
               className="w-full border p-2 rounded" placeholder="请输入邮箱" />
      </div>
      {/* 05 */}
      <div>
        <label className="block mb-1">*性别：</label>
        <label><input type="radio" name="gender" value="男" checked={formData.gender==='男'} onChange={handleInputChange}/> 男</label>
        <label className="ml-4"><input type="radio" name="gender" value="女" checked={formData.gender==='女'} onChange={handleInputChange}/> 女</label>
      </div>
      {/* 06 */}
      <div>
        <label className="block mb-1">*年龄段：</label>
        {['70后','80后','90后','00后'].map((age)=> (
          <label key={age} className="mr-4">
            <input type="radio" name="ageGroup" value={age} checked={formData.ageGroup===age} onChange={handleInputChange}/> {age}
          </label>
        ))}
      </div>
      {/* 07 */}
      <div>
        <label className="block mb-1">*学历：</label>
        {['专科','本科','硕士','博士'].map((edu)=> (
          <label key={edu} className="mr-4">
            <input type="radio" name="education" value={edu} checked={formData.education===edu} onChange={handleInputChange}/> {edu}
          </label>
        ))}
      </div>
      {/* 08 */}
      <div>
        <label className="block mb-1">*院校：</label>
        <input name="university" value={formData.university} onChange={handleInputChange}
               className="w-full border p-2 rounded" placeholder="请输入院校名称" />
      </div>
      {/* 09 */}
      <div>
        <label className="block mb-1">*专业：</label>
        <input name="major" value={formData.major} onChange={handleInputChange}
               className="w-full border p-2 rounded" placeholder="请输入专业" />
      </div>
      {/* 10 */}
      <div>
        <label className="block mb-1">*常驻城市：</label>
        <div className="flex">
          <input name="city" value={formData.city} readOnly
                 className="flex-1 border p-2 rounded-l" placeholder="点击获取当前位置" />
          <Button onClick={handleGetCity} className="rounded-r">获取</Button>
        </div>
      </div>
      {/* 11 */}
      <div>
        <label className="block mb-1">*目前是（可多选）：</label>
        {['Web3 在职开发者','Web3 独立开发者','Web2 在职开发者','Web2 独立开发者','学员，未就业','其他'].map((opt)=> (
          <label key={opt} className="mr-4 block">
            <input type="checkbox" name="status" value={opt} checked={formData.status.includes(opt)} onChange={handleInputChange}/> {opt}
          </label>
        ))}
      </div>
      {/* 12 */}
      <div>
        <label className="block mb-1">*掌握开发语言：</label>
        {['C/C++','Java','JavaScript','Python','Go','微软系编程语言','汇编语言','Rust','Solidity','无','其他'].map((lang)=> (
          <label key={lang} className="mr-4 block">
            <input type="checkbox" name="languages" value={lang} checked={formData.languages.includes(lang)} onChange={handleInputChange}/> {lang}
          </label>
        ))}
      </div>
      {/* 13 */}
      <div>
        <label className="block mb-1">*实际开发经验：</label>
        {['无','1年以下','1-3年','3-5年','5年以上'].map((exp)=> (
          <label key={exp} className="mr-4">
            <input type="radio" name="experience" value={exp} checked={formData.experience===exp} onChange={handleInputChange}/> {exp}
          </label>
        ))}
      </div>
      {/* 14 */}
      <div>
        <label className="block mb-1">*了解渠道：</label>
        <select name="source" value={formData.source} onChange={handleInputChange} className="w-full border p-2 rounded">
          <option value="">请选择</option>
          {['OneBlock+(一块+)官方社区','Polkadot微信中文平台','Polkaworld','知乎','Bilibili','Youtube','Twitter','Discord','小红书','视频号','其他'].map(src=> (
            <option key={src} value={src}>{src}</option>
          ))}
        </select>
      </div>
      {/* 15 */}
      <div>
        <label className="block mb-1">*参加过Web3项目？</label>
        {['是','否'].map(val=> (
          <label key={val} className="mr-4">
            <input type="radio" name="participated" value={val} checked={formData.participated===val} onChange={handleInputChange}/> {val}
          </label>
        ))}
      </div>
      {/* 16 */}
      <div>
        <label className="block mb-1">*每天学习时长：</label>
        {['1小时以内','1-2小时','2-3小时','3小时以上'].map(val=> (
          <label key={val} className="mr-4">
            <input type="radio" name="dailyTime" value={val} checked={formData.dailyTime===val} onChange={handleInputChange}/> {val}
          </label>
        ))}
      </div>
      {/* 17 */}
      <div>
        <label className="block mb-1">*关注赛道/项目：</label>
        <textarea name="interests" value={formData.interests} onChange={handleInputChange}
                  className="w-full border p-2 rounded" placeholder="请输入您关注的赛道/项目" />
      </div>
      {/* 18 */}
      <div>
        <label className="block mb-1">*常用学习平台：</label>
        <textarea name="platforms" value={formData.platforms} onChange={handleInputChange}
                  className="w-full border p-2 rounded" placeholder="请输入常用平台" />
      </div>
      {/* 19 */}
      <div>
        <label className="block mb-1">*愿意参加黑客松？</label>
        {['愿意','不愿意'].map(val=> (
          <label key={val} className="mr-4">
            <input type="radio" name="hackathon" value={val} checked={formData.hackathon===val} onChange={handleInputChange}/> {val}
          </label>
        ))}
      </div>
      {/* 20 */}
      <div>
        <label className="block mb-1">*愿意担任班干部？</label>
        {['是','否'].map(val=> (
          <label key={val} className="mr-4">
            <input type="radio" name="leadership" value={val} checked={formData.leadership===val} onChange={handleInputChange}/> {val}
          </label>
        ))}
      </div>
      {/* 21 */}
      <div>
        <label className="block mb-1">*需要班长私信服务？</label>
        {['是','否'].map(val=> (
          <label key={val} className="mr-4">
            <input type="radio" name="privateMsg" value={val} checked={formData.privateMsg===val} onChange={handleInputChange}/> {val}
          </label>
        ))}
      </div>
      {/* 22 */}
      <div>
        <label className="block mb-1">*邀请人：</label>
        <input name="inviter" value={formData.inviter} onChange={handleInputChange}
               className="w-full border p-2 rounded" placeholder="如无则填写无" />
      </div>

      <Button onClick={handleRegister} className="w-full mt-4" disabled={loading}>
        {loading ? '提交中...' : '提交报名'}
      </Button>
      <Button onClick={handleLogout} className="w-full mt-2 bg-red-500 hover:bg-red-600">
        退出钱包并返回首页
      </Button>
    </div>
  );
}
