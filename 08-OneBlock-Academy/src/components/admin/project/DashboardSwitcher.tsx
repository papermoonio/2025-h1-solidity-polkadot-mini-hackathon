"use client"

import {StudentRewardsWorkflow} from '@/components/admin/project/StudentRewardsWorkflow'
import {AdminProject} from '@/components/admin/project/AdminProject'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export  function DashboardSwitcher() {
  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-2xl shadow-lg">
      <Tabs defaultValue="student" className="space-y-6">
        <TabsList className="grid grid-cols-2 rounded-full bg-gray-100 p-1">
          <TabsTrigger
            value="student"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            生成claim任务流程
          </TabsTrigger>
          <TabsTrigger
            value="admin"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
           管理claim项目
          </TabsTrigger>
        </TabsList>

        <TabsContent value="student">
          <StudentRewardsWorkflow />
        </TabsContent>

        <TabsContent value="admin">
          <AdminProject />
        </TabsContent>
      </Tabs>
    </div>
  )
}
