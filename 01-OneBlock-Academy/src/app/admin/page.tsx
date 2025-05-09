// ./src/app/admin/page.tsx
'use client';

import { AdminProvider, useAdmin } from "@/components/AdminContext";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { StudentManagement } from "@/components/admin/StudentManagement";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { AnnouncementManagement } from "@/components/teacher/AnnouncementManagement"
import { AnswerCardManagement } from "@/components/teacher/AnswerCardManagement";
import { GradeManagement } from "@/components/teacher/GradeManagement"
import { NotesManagement } from "@/components/teacher/NotesManagement"
import { StudentRewardsWorkflow } from "@/components/admin/project/StudentRewardsWorkflow";
/* import { AnnouncementManagement } from "@/components/admin/AnnouncementManagement";
import { ResourceManagement } from "@/components/admin/ResourceManagement";
import { AnswerCardManagement } from "@/components/admin/AnswerCardManagement";
import { GradeManagement } from "@/components/admin/GradeManagement";
import { CertificateGeneration } from "@/components/admin/CertificateGeneration"; */

// 主内容区域组件
function AdminContent() {
  const { activeView } = useAdmin();

  // 根据当前视图渲染相应的组件
  const renderContent = () => {
    switch (activeView) {
      case "students":
        return <StudentManagement />;
      case "staff":
        return <StaffManagement />;
      case "announcements":
        return <AnnouncementManagement />;
      case "answers":
        return <AnswerCardManagement />;
      case "grades":
        return <GradeManagement />;
      case "notes":
        return <NotesManagement />;
        case "certificates":
          return <StudentRewardsWorkflow />
      /*  case "announcements":
         return <AnnouncementManagement />;
       case "resources":
         return <ResourceManagement />;
       case "answers":
         return <AnswerCardManagement />;
       case "grades":
         return <GradeManagement />;
       case "certificates":
         return <CertificateGeneration />;  */
      default:
        return <div>请选择一个管理功能</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader title="Oneblock Academy 管理系统" />
      <main className="flex-1 container py-6">
        {renderContent()}
      </main>
    </div>
  );
}

// 页面组件，包含 Context Provider
export default function AdminPage() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}