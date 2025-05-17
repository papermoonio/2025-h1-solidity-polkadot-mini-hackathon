'use client';

//import { useState } from 'react';
import { StudentHeader } from '@/components/student/StudentHeader';
//import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnnouncementViewer } from '@/components/student/AnnouncementViewer';
import { PersonalNotes } from '@/components/student/PersonalNotes';
import { AnswerCard } from '@/components/student/AnswerCard';
import { GradeViewer } from '@/components/student/GradeViewer';
import { StudentClaimComponent } from '@/components/student/Claim';
import { AdminProvider, useAdmin } from "@/components/AdminContext";

// 主内容区域组件
function AdminContent() {
  const { activeView } = useAdmin();

  // 根据当前视图渲染相应的组件
  const renderContent = () => {
    switch (activeView) {
     
      case "announcements":
        return <AnnouncementViewer />;
      case "answers":
        return <AnswerCard />;
      case "grades":
        return <GradeViewer />;
      case "notes":
        return <PersonalNotes />;
      case "claim":
         return <StudentClaimComponent/>
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
        return <AnnouncementViewer />;;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <StudentHeader title="Oneblock Academy 学习系统"  />
      <main className="flex-1 container py-6">
        {renderContent()}
      </main>
    </div>
  );
}

// 页面组件，包含 Context Provider
export default function StudentPage() {
  return (
    <AdminProvider>
      <AdminContent  />
    </AdminProvider>
  );
}