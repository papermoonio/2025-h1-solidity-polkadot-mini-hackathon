// src/components/admin/StaffManagement.tsx
'use client';

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
 // DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";

interface Staff {
  id?: number;
  name: string;
  wechat_id: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'assistant';
  wallet_address: string;
  approved?: boolean;
  created_at?: string;
  updated_at?: string;
}

export function StaffManagement() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<Omit<Staff, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    wechat_id: '',
    phone: '',
    role: 'assistant',
    wallet_address: '',
    approved: true
  });
  const [staffToDelete, setStaffToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const fetchStaffList = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "get" }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch staff list");
      }

      const data = await response.json();
      setStaffList(data.data);
    } catch (error) {
      toast.error("错误", {
        description: "无法加载工作人员数据"
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      role: value as 'admin' | 'teacher' | 'assistant' 
    }));
  };

  const handleApprovedChange = (value: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      approved: value === 'true' 
    }));
  };

  const openAddDialog = () => {
    setCurrentStaff(null);
    setFormData({
      name: '',
      wechat_id: '',
      phone: '',
      role: 'assistant',
      wallet_address: '',
      approved: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (staff: Staff) => {
    setCurrentStaff(staff);
    setFormData({
      name: staff.name,
      wechat_id: staff.wechat_id,
      phone: staff.phone || '',
      role: staff.role,
      wallet_address: staff.wallet_address,
      approved: staff.approved !== false
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = (id: number) => {
    setStaffToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const action = currentStaff ? "update" : "add";
      const payload = currentStaff 
        ? { id: currentStaff.id, ...formData }
        : formData;
      
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, payload }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} staff member`);
      }

      toast.success("成功", {
        description: currentStaff 
          ? "工作人员信息已更新" 
          : "工作人员已添加"
      });
      
      setIsDialogOpen(false);
      fetchStaffList();
    } catch (error) {
      toast.error("错误", {
        description: currentStaff 
          ? "更新工作人员信息失败" 
          : "添加工作人员失败"
      });
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!staffToDelete) return;
    
    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          action: "delete", 
          payload: { id: staffToDelete } 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete staff member");
      }

      toast.success("成功", {
        description: "工作人员已删除"
      });
      
      setIsDeleteDialogOpen(false);
      fetchStaffList();
    } catch (error) {
      toast.error("错误", {
        description: "删除工作人员失败"
      });
      console.error(error);
    } finally {
      setStaffToDelete(null);
    }
  };

  const getRoleLabel = (role: string) => {
    const roles = {
      admin: '管理员',
      teacher: '教师',
      assistant: '助教'
    };
    return roles[role as keyof typeof roles] || role;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold">工作人员管理</h2>
          <p className="text-gray-500">添加、编辑和管理系统工作人员</p>
        </div>
        <Button onClick={openAddDialog} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          添加工作人员
        </Button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">加载数据中...</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>微信ID</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>钱包地址</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    暂无工作人员数据
                  </TableCell>
                </TableRow>
              ) : (
                staffList.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">{staff.name}</TableCell>
                    <TableCell>{staff.wechat_id}</TableCell>
                    <TableCell>{staff.phone || '-'}</TableCell>
                    <TableCell>{getRoleLabel(staff.role)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {staff.wallet_address.substring(0, 8)}...{staff.wallet_address.substring(staff.wallet_address.length - 6)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        staff.approved !== false 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {staff.approved !== false ? '已激活' : '未激活'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => openEditDialog(staff)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => confirmDelete(staff.id as number)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{currentStaff ? '编辑工作人员' : '添加新工作人员'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wechat_id">微信ID</Label>
                <Input
                  id="wechat_id"
                  name="wechat_id"
                  value={formData.wechat_id}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">联系电话</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">角色</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="teacher">教师</SelectItem>
                    <SelectItem value="assistant">助教</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wallet_address">钱包地址</Label>
                <Input
                  id="wallet_address"
                  name="wallet_address"
                  value={formData.wallet_address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="approved">状态</Label>
                <Select
                  value={formData.approved ? 'true' : 'false'}
                  onValueChange={handleApprovedChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">已激活</SelectItem>
                    <SelectItem value="false">未激活</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p>您确定要删除此工作人员吗？此操作无法撤销。</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDelete}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}