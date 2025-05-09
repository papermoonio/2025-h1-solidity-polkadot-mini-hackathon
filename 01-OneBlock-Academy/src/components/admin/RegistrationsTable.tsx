// src/components/admin/RegistrationsTable.tsx
"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Check, X, Search, Trash } from "lucide-react";
import { Registration} from "@/lib/db/query/registrations"


interface RegistrationsTableProps {
  registrations: Registration[];
  loading: boolean;
  onApprove: (studentId: string, approved: boolean) => void;
  onDelete: (studentId: string) => void;
  onSelect: (registration: Registration) => void;
  selectedId?: string;
}

export function RegistrationsTable({ 
  registrations, 
  loading, 
  onApprove, 
  onDelete, 
  onSelect,
  selectedId 
}: RegistrationsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<string | null>(null);

  const filteredRegistrations = registrations.filter(reg => {
    const term = searchTerm.toLowerCase();
    return (
      (reg.student_name?.toLowerCase() || "").includes(term) ||
      (reg.student_id?.toString().toLowerCase() || "").includes(term) || // 确保转为字符串
      (reg.wechat_id?.toLowerCase() || "").includes(term)
    );
  });

  const handleDeleteClick = (studentId: string) => {
    setRegistrationToDelete(studentId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (registrationToDelete) {
      onDelete(registrationToDelete);
      setDeleteConfirmOpen(false);
      setRegistrationToDelete(null);
    }
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "N/A"; // 处理 undefined/null/空字符串
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A"; // 处理无效日期格式
    return date.toLocaleDateString("zh-CN"); // 按中文格式显示，例如 "2023/10/05"
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name, ID or school..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Student Name</TableHead>
              <TableHead>学号</TableHead>
              <TableHead>微信号</TableHead>
              <TableHead>email</TableHead>
             {/*  <TableHead>钱包地址</TableHead> */}
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  Loading registrations...
                </TableCell>
              </TableRow>
            ) : filteredRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No registrations found
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistrations.map((registration) => (
                <TableRow 
                  key={registration.student_id} 
                  className={selectedId === registration.student_id ? "bg-slate-100" : ""}
                  onClick={() => onSelect(registration)}
                >
                  <TableCell className="font-medium">{registration.student_name}</TableCell>
                  <TableCell>{registration.student_id}</TableCell>
                  <TableCell>{registration.wechat_id}</TableCell>
                  <TableCell>{registration.email}</TableCell>
                  {/* <TableCell>{registration.wallet_address}</TableCell> */}
                  <TableCell>{formatDate(registration.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant={registration.approved ? "default" : "secondary"}>
                      {registration.approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!registration.approved && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-green-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(registration.student_id, true);
                          }}
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {registration.approved && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-amber-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onApprove(registration.student_id, false);
                          }}
                          title="Revoke Approval"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(registration.student_id);
                        }}
                        title="Delete"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this registration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
