// src/components/admin/RegistrationDetails.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, Save, Edit, User, Link as WalletIcon } from "lucide-react";
import { Registration } from "@/lib/db/query/registrations";

const fieldLabels: Record<keyof Registration, string> = {
  id: "编号",
  student_name: "学生姓名",
  wechat_id: "微信 ID",
  phone: "电话号码",
  email: "电子邮箱",
  gender: "性别",
  age_group: "年龄段",
  education: "教育程度",
  university: "大学",
  major: "专业",
  city: "城市",
  role: "角色",
  languages: "掌握语言",
  experience: "经验",
  source: "来源渠道",
  has_web3_experience: "是否有 Web3 经验",
  study_time: "学习时长",
  interests: "兴趣方向",
  platforms: "使用平台",
  willing_to_hackathon: "愿意参加黑客松",
  willing_to_lead: "愿意担任组长",
  wants_private_service: "是否需要一对一辅导",
  referrer: "推荐人",
  wallet_address: "钱包地址",
  student_id: "学生 ID",
  approved: "审核状态",
  created_at: "创建时间",
  updated_at: "更新时间",
};

interface RegistrationDetailsProps {
  registration: Registration | null;
  onUpdate: (studentId: string, updates: Partial<Registration>) => void;
  onApprove: (studentId: string, approved: boolean) => void;
}

export function RegistrationDetails({ registration, onUpdate, onApprove }: RegistrationDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Registration>>({});

  const handleEditToggle = () => {
    if (isEditing && registration && Object.keys(editedData).length > 0) {
      onUpdate(registration.student_id, editedData);
      setEditedData({});
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field: keyof Registration, value: string) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const getValue = (field: keyof Registration) => (
    field in editedData ? editedData[field] : registration?.[field] ?? ""
  );

  const formatDate = (date?: string) => date ? new Date(date).toLocaleString() : "";

  if (!registration) {
    return (
      <Card className="h-full">
        <CardHeader className="text-center">
          <CardTitle>注册详情</CardTitle>
          <CardDescription>请选择一条注册记录查看</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-gray-500 p-8">
          <User size={64} className="mb-4 opacity-30" />
          <p>未选择任何注册</p>
        </CardContent>
      </Card>
    );
  }

  const contactFields: (keyof Registration)[] = [
    "wechat_id", "email", "phone", "city", "referrer"
  ];
  const personalFields: (keyof Registration)[] = [
    "gender", "age_group", "education", "university", "major"
  ];
  const experienceFields: (keyof Registration)[] = [
    "languages", "experience", "source", "has_web3_experience",
    "study_time", "interests", "platforms"
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{registration.student_name}</CardTitle>
            <CardDescription>ID: {registration.student_id}</CardDescription>
          </div>
          <Badge variant={registration.approved ? "default" : "secondary"}>
            {registration.approved ? "已通过" : "待审核"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 联系信息 */}
        <div>
          <h3 className="text-sm font-medium">联系方式</h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {contactFields.map(field => (
              <div key={field} className="space-y-1">
                <Label htmlFor={field}>{fieldLabels[field]}</Label>
                {isEditing ? (
                  <Input
                    id={field}
                    value={getValue(field) as string}
                    onChange={e => handleInputChange(field, e.target.value)}
                    className="break-words"
                  />
                ) : (
                  <div className="py-2 break-words whitespace-pre-wrap">{String(registration[field])}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* 个人 & 学术 */}
        <div>
          <h3 className="text-sm font-medium">个人 & 学术</h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {personalFields.map(field => (
              <div key={field} className="space-y-1">
                <Label htmlFor={field}>{fieldLabels[field]}</Label>
                {isEditing ? (
                  <Input
                    id={field}
                    value={getValue(field) as string}
                    onChange={e => handleInputChange(field, e.target.value)}
                    className="break-words"
                  />
                ) : (
                  <div className="py-2 break-words whitespace-pre-wrap">{String(registration[field])}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* 经验 & 兴趣 */}
        <div>
          <h3 className="text-sm font-medium">经验 & 兴趣</h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {experienceFields.map(field => (
              <div key={field} className="space-y-1">
                <Label htmlFor={field}>{fieldLabels[field]}</Label>
                {isEditing ? (
                  <Input
                    id={field}
                    value={getValue(field) as string}
                    onChange={e => handleInputChange(field, e.target.value)}
                    className="break-words"
                  />
                ) : (
                  <div className="py-2 break-words whitespace-pre-wrap">
                    {typeof registration[field] === 'boolean'
                      ? (registration[field] ? '是' : '否')
                      : String(registration[field])
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* 区块链信息 */}
        <div className="space-y-2">
          <Label htmlFor="wallet_address">{fieldLabels.wallet_address}</Label>
          {isEditing ? (
            <Input
              id="wallet_address"
              value={getValue("wallet_address") as string}
              onChange={e => handleInputChange("wallet_address", e.target.value)}
              className="break-words"
            />
          ) : (
            <div className="flex items-center py-2 gap-1 break-words whitespace-pre-wrap">
              <WalletIcon size={16} /> {registration.wallet_address}
            </div>
          )}
        </div>

        <Separator />

        <div className="text-xs text-gray-500">
          <div>{fieldLabels.created_at}: {formatDate(registration.created_at)}</div>
          <div>{fieldLabels.updated_at}: {formatDate(registration.updated_at)}</div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleEditToggle} className="flex items-center gap-1">
          {isEditing ? <><Save size={16} /> 保存</> : <><Edit size={16} /> 编辑</>}
        </Button>
        <div className="flex gap-2">
          {!registration.approved ? (
            <Button onClick={() => onApprove(registration.student_id, true)} className="bg-green-600 hover:bg-green-700 flex items-center gap-1">
              <Check size={16} /> 通过
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => onApprove(registration.student_id, false)} className="flex items-center gap-1">
              <X size={16} /> 撤销
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
