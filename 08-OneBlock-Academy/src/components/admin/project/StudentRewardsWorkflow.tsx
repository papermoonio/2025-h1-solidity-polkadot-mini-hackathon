'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreateProjectForm } from '@/components/admin/project/CreateProjectForm';
import { WhitelistBatchAddForm } from './WhitelistBatchAddForm';
import { TokenApprovalForm } from '@/components/admin/project/TokenApprovalForm';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

// 定义学员分数数据类型
interface StudentScore {
  student_id: string;
  student_name: string;
  wechat_id: string;
  wallet_address: string;
  total_score: number;
}

// 步骤枚举
enum WorkflowStep {
  FILTER_STUDENTS,
  CREATE_PROJECT,
  ADD_TO_WHITELIST,
  APPROVE_TOKENS
}

export function StudentRewardsWorkflow() {
  const [students, setStudents] = useState<StudentScore[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentScore[]>([]);
  const [minScore, setMinScore] = useState<number>(0);
  const [totalTokens, setTotalTokens] = useState<string>('');
  const [tokenPerStudent, setTokenPerStudent] = useState<string>('0');
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(WorkflowStep.FILTER_STUDENTS);
  const [projectData, setProjectData] = useState<{
    whitelistAddr?: `0x${string}`;
    nftAddr?: `0x${string}`;
    claimAddr?: `0x${string}`;
    erc20Addr?: `0x${string}`;
  }>({});

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/teacher/task-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'summary' }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from API');
        }

        setStudents(data);
        setFilteredStudents(data);
      } catch (error) {
        console.error('获取学员数据错误:', error);
        toast.error(`获取学员数据错误: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    if (filteredStudents.length > 0 && totalTokens) {
      const perStudent = (Number(totalTokens) / filteredStudents.length).toFixed(4);
      setTokenPerStudent(perStudent);
    } else {
      setTokenPerStudent('0');
    }
  }, [totalTokens, filteredStudents.length]);

  const handleFilterStudents = () => {
    const filtered = students.filter(student => student.total_score >= minScore);
    setFilteredStudents(filtered);
    if (filtered.length === 0) {
      toast.error('未找到符合条件的学员，请调整最低分数后重试');
    } else {
      toast.success(`筛选成功，找到 ${filtered.length} 名符合条件的学员`);
    }
  };

  const handleConfirmAddresses = () => {
    if (filteredStudents.length === 0) {
      toast.error('无学员地址可确认，请先筛选学员');
      return;
    }
    setCurrentStep(WorkflowStep.CREATE_PROJECT);
  };

  const handleProjectCreated = (data: {
    whitelistAddr: `0x${string}`;
    nftAddr: `0x${string}`;
    claimAddr: `0x${string}`;
    erc20Addr: `0x${string}`;
  }) => {
    setProjectData(data);
    setCurrentStep(WorkflowStep.ADD_TO_WHITELIST);
    toast.success('项目创建成功，请继续将学员添加到白名单');
  };

  const handleWhitelistAdded = () => {
    setCurrentStep(WorkflowStep.APPROVE_TOKENS);
    toast.success('白名单添加成功，请继续授权和转账操作');
  };

  const getWhitelistAddresses = (): `0x${string}`[] => {
    return filteredStudents
      .filter(student => {
        try {
          return student.wallet_address && 
                 student.wallet_address.startsWith('0x') &&
                 student.wallet_address.length === 42;
        } catch {
          return false;
        }
      })
      .map(student => {
        if (!student.wallet_address) return '0x';
        return student.wallet_address.toLowerCase() as `0x${string}`;
      });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case WorkflowStep.FILTER_STUDENTS:
        return (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>筛选学员</CardTitle>
                <CardDescription>根据分数筛选符合条件的学员</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <Input
                    type="number"
                    placeholder="最低分数要求"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-32"
                  />
                  <Button onClick={handleFilterStudents}>筛选学员</Button>
                </div>

                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">符合条件的学员: {filteredStudents.length} 人</h3>
                </div>

                <div className="flex items-center space-x-4 mb-4">
                  <Input
                    type="number"
                    placeholder="总Token数量"
                    value={totalTokens}
                    onChange={(e) => setTotalTokens(e.target.value)}
                    className="w-48"
                  />
                  <div className="text-sm">推荐每人 {tokenPerStudent} 个Token</div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleConfirmAddresses}
                  disabled={filteredStudents.length === 0 || !totalTokens || Number(totalTokens) <= 0}
                >
                  确认并继续
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>学员列表</CardTitle>
                <CardDescription>符合条件的学员名单</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>共 {filteredStudents.length} 名学员</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学员姓名</TableHead>
                      <TableHead>学员ID</TableHead>
                      <TableHead>钱包地址</TableHead>
                      <TableHead className="text-right">总分</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">{student.student_name}</TableCell>
                        <TableCell>{student.student_id}</TableCell>
                        <TableCell className="font-mono text-xs">{student.wallet_address}</TableCell>
                        <TableCell className="text-right">{student.total_score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        );

      case WorkflowStep.CREATE_PROJECT:
        return (
          <Card>
            <CardHeader>
              <CardTitle>创建项目</CardTitle>
              <CardDescription>为{filteredStudents.length}名学员创建奖励项目</CardDescription>
            </CardHeader>
            <CardContent>
              <CreateProjectForm onProjectCreated={handleProjectCreated} />
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">创建项目后将自动进入下一步</CardFooter>
          </Card>
        );

      case WorkflowStep.ADD_TO_WHITELIST:
        return (
          <Card>
            <CardHeader>
              <CardTitle>添加白名单</CardTitle>
              <CardDescription>将{filteredStudents.length}名学员添加到白名单</CardDescription>
            </CardHeader>
            <CardContent>
              <WhitelistBatchAddForm
                addresses={getWhitelistAddresses()}
                whitelistContractAddress={projectData.whitelistAddr as `0x${string}`}
                onWhitelistAdded={handleWhitelistAdded}
              />
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">添加白名单后将自动进入下一步</CardFooter>
          </Card>
        );

      case WorkflowStep.APPROVE_TOKENS:
        return (
          <Card>
            <CardHeader>
              <CardTitle>授权并转入Token</CardTitle>
              <CardDescription>向Claim合约授权并转入Token</CardDescription>
            </CardHeader>
            <CardContent>
              <TokenApprovalForm
                erc20Address={projectData.erc20Addr as `0x${string}`}
                claimAddress={projectData.claimAddr as `0x${string}`}
                tokenAmount={totalTokens}
                studentCount={filteredStudents.length}
              />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">学员奖励流程</h1>
        <div className="flex space-x-2 text-sm">
          <div className={`px-3 py-1 rounded-full ${currentStep === WorkflowStep.FILTER_STUDENTS ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>筛选学员</div>
          <div className={`px-3 py-1 rounded-full ${currentStep === WorkflowStep.CREATE_PROJECT ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>创建项目</div>
          <div className={`px-3 py-1 rounded-full ${currentStep === WorkflowStep.ADD_TO_WHITELIST ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>添加白名单</div>
          <div className={`px-3 py-1 rounded-full ${currentStep === WorkflowStep.APPROVE_TOKENS ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>授权转账</div>
        </div>
      </div>
      {renderCurrentStep()}
    </div>
  );
}
