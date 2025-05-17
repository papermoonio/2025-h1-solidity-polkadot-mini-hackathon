'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from "sonner";

// 定义项目数据接口
interface Project {
  id: number;
  project_id: string;
  project_name: string;
  factory_address: string;
  whitelist_address: string;
  nft_address: string;
  claim_address: string;
  erc20_address: string;
  created_at: string;
  updated_at: string | null;
}

// 定义学员项目申领数据接口
interface StudentProjectClaim {
  id: number;
  student_id: string;
  student_name: string;
  project_id: string;
  project_name: string;
  nft_address: string;
  claim_address: string;
  erc20_address: string;
  has_claimed: number; // SQLite存储为0或1
  created_at: string;
  updated_at: string | null;
}

export  function AdminProject() {
  // 状态管理
  const [projects, setProjects] = useState<Project[]>([]);
  const [claims, setClaims] = useState<StudentProjectClaim[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: 'project' | 'claim' } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('projects');

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/adminclaim?type=projects');
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data || []);
      } else {
        toast.error(data.message || '获取项目列表失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      toast.error(`获取项目列表时发生错误: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 获取申领记录列表
  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/adminclaim?type=claims');
      const data = await response.json();
      
      if (data.success) {
        setClaims(data.data || []);
      } else {
        toast.error(data.message || '获取申领记录失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      toast.error(`获取申领记录时发生错误: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // 删除项目或申领记录
  const deleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/adminclaim?type=${itemToDelete.type}&id=${itemToDelete.id}`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || '删除成功');
        
        // 刷新列表
        if (itemToDelete.type === 'project') {
          fetchProjects();
        } else {
          fetchClaims();
        }
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      toast.error(`删除时发生错误: ${errorMessage}`);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // 处理删除确认对话框
  const handleDeleteClick = (id: number, type: 'project' | 'claim') => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  // 处理Tab切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // 初始加载数据
  useEffect(() => {
    fetchProjects();
    fetchClaims();
  }, []);

  // 渲染项目表格
  const renderProjectsTable = () => (
    <Table>
      <TableCaption>项目列表</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
        {/*   <TableHead>项目ID</TableHead> */}
          <TableHead>项目名称</TableHead>
          <TableHead>NFT地址</TableHead>
          <TableHead>claim地址</TableHead>
          <TableHead>ERC20地址</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center">暂无数据</TableCell>
          </TableRow>
        ) : (
          projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.id}</TableCell>
             {/*  <TableCell>{project.project_id}</TableCell> */}
              <TableCell>{project.project_name}</TableCell>
              <TableCell className="max-w-xs truncate" title={project.nft_address}>
                {project.nft_address}
              </TableCell>
              <TableCell className="max-w-xs truncate" title={project.claim_address}>
                {project.claim_address}
              </TableCell>
              <TableCell className="max-w-xs truncate" title={project.erc20_address}>
                {project.erc20_address}
              </TableCell>
              <TableCell>{new Date(project.created_at).toLocaleString()}</TableCell>
              <TableCell>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteClick(project.id, 'project')}
                  disabled={loading}
                >
                  删除
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  // 渲染申领记录表格
  const renderClaimsTable = () => (
    <Table>
      <TableCaption>学员项目申领记录</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>学员ID</TableHead>
          <TableHead>学员姓名</TableHead>
          <TableHead>项目名称</TableHead>
          <TableHead>已申领</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {claims.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">暂无数据</TableCell>
          </TableRow>
        ) : (
          claims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell>{claim.id}</TableCell>
              <TableCell>{claim.student_id}</TableCell>
              <TableCell>{claim.student_name}</TableCell>
              <TableCell>{claim.project_name}</TableCell>
              <TableCell>{claim.has_claimed ? '是' : '否'}</TableCell>
              <TableCell>{new Date(claim.created_at).toLocaleString()}</TableCell>
              <TableCell>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteClick(claim.id, 'claim')}
                  disabled={loading}
                >
                  删除
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">管理项目和申领记录</h1>
      
      <div className="mb-4 flex justify-end gap-4">
        <Button 
          onClick={() => {
            fetchProjects();
            fetchClaims();
          }}
          disabled={loading}
        >
          刷新数据
        </Button>
      </div>
      
      <Tabs 
        defaultValue="projects" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects">项目列表</TabsTrigger>
          <TabsTrigger value="claims">申领记录</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="mt-4">
          {loading && activeTab === 'projects' ? (
            <div className="text-center py-4">加载中...</div>
          ) : (
            renderProjectsTable()
          )}
        </TabsContent>
        
        <TabsContent value="claims" className="mt-4">
          {loading && activeTab === 'claims' ? (
            <div className="text-center py-4">加载中...</div>
          ) : (
            renderClaimsTable()
          )}
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === 'project' 
                ? '您确定要删除此项目吗？此操作不可撤销。'
                : '您确定要删除此申领记录吗？此操作不可撤销。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteItem}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}