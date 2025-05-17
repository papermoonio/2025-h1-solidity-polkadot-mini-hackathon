// src/components/admin/StudentManagement.tsx
'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { RegistrationsTable } from "@/components/admin/RegistrationsTable";
import { RegistrationDetails } from "@/components/admin/RegistrationDetails";
import { Registration } from "@/lib/db/query/registrations";

/* interface Registration {
  id: string;
  student_id: string;
  student_name: string;
  email: string;
  phone: string;
  grade: string;
  school: string;
  parent_name: string;
  parent_phone: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
} */

export function StudentManagement() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/registrationsadmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "getAll" }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch registrations");
      }

      const data = await response.json();
      setRegistrations(data.data);
    } catch (error) {
      toast.error("错误", {
        description: "无法加载注册数据"
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (studentId: string, approved: boolean) => {
    try {
      const response = await fetch("/api/admin/registrationsadmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "approve",
          payload: {
            student_id: studentId,
            approved,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update approval status");
      }

      // Update local state
      setRegistrations(
        registrations.map((reg) =>
          reg.student_id === studentId ? { ...reg, approved } : reg
        )
      );

      if (selectedRegistration?.student_id === studentId) {
        setSelectedRegistration({ ...selectedRegistration, approved });
      }

      toast.success("成功", {
        description: `注册${approved ? "已批准" : "已拒绝"}`
      });
    } catch (error) {
      toast.error("错误", {
        description: "更新审批状态失败"
      });
      console.error(error);
    }
  };

  const handleDelete = async (studentId: string) => {
    try {
      const response = await fetch("/api/admin/registrationsadmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          payload: {
            student_id: studentId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete registration");
      }

      // Update local state
      setRegistrations(registrations.filter((reg) => reg.student_id !== studentId));
      
      if (selectedRegistration?.student_id === studentId) {
        setSelectedRegistration(null);
      }

      toast.success("成功", {
        description: "注册记录已删除"
      });
    } catch (error) {
      toast.error("错误", {
        description: "删除注册记录失败"
      });
      console.error(error);
    }
  };

  const handleUpdate = async (studentId: string, updates: Partial<Registration>) => {
    try {
      const response = await fetch("/api/admin/registrationsadmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update",
          payload: {
            student_id: studentId,
            updates,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update registration");
      }

      // Update local state
      const updatedRegistrations = registrations.map((reg) =>
        reg.student_id === studentId ? { ...reg, ...updates } : reg
      );
      
      setRegistrations(updatedRegistrations);
      
      if (selectedRegistration?.student_id === studentId) {
        setSelectedRegistration({ ...selectedRegistration, ...updates });
      }

      toast.success("成功", {
        description: "注册信息已更新"
      });
    } catch (error) {
      toast.error("错误", {
        description: "更新注册信息失败"
      });
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">学员注册管理</h2>
      <p className="text-gray-500 mb-6">审核、批准和管理学员注册</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <RegistrationsTable 
            registrations={registrations}
            loading={loading}
            onApprove={handleApproval}
            onDelete={handleDelete}
            onSelect={setSelectedRegistration}
            selectedId={selectedRegistration?.student_id}
          />
        </div>
        
        <div className="md:col-span-1">
          <RegistrationDetails
            registration={selectedRegistration}
            onUpdate={handleUpdate}
            onApprove={handleApproval}
          />
        </div>
      </div>
    </div>
  );
}