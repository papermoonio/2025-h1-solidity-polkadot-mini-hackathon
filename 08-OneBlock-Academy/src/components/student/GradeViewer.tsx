'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface Score {
  id: number;
  student_id: string;
  task_number: number;
  score_type: 'choice' | 'practice';
  score: number;
  completed: boolean;
  created_at: string;
  updated_at: string | null;
}

interface StudentScore {
  student_id: string;
  student_name: string;
  wechat_id: string;
  wallet_address: string;
  total_score: number;
}

interface ScoreSummary {
  scores: Score[];
  summary: {
    perTask: {
      task_number: number;
      score_type: 'choice' | 'practice';
      total_score: number;
      times_completed: number;
    }[];
    overall: {
      total_score: number;
      avg_score: number;
      records_count: number;
    };
  }
}

interface UserSession {
  name: string;
  id: string;
  address: string;
  status: string;
  role: string;
}

export function GradeViewer() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [myScores, setMyScores] = useState<ScoreSummary | null>(null);
  const [rankings, setRankings] = useState<StudentScore[]>([]);
  const [activeTab, setActiveTab] = useState('my-scores');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user from session
  useEffect(() => {
    // Fetch session data
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        
        if (data.user) {
          setUser(data.user as UserSession);
        }
      } catch (err) {
        console.error('Failed to fetch session:', err);
      }
    };
    
    fetchSession();
  }, []);

  // Get current user ID
  const currentUserId = user?.id;
  
  // Fetch student's scores and rankings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch my scores
        if (currentUserId) {
          const myScoresRes = await fetch('/api/student/taskscores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getMyScores' })
          });
          
          if (!myScoresRes.ok) throw new Error('获取个人成绩失败');
          const myScoresData = await myScoresRes.json();
          setMyScores(myScoresData);
        }
        
        // Fetch rankings (all students)
        const rankingsRes = await fetch('/api/student/taskscores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getAllScores' })
        });
        
        if (!rankingsRes.ok) throw new Error('获取排名失败');
        const rankingsData = await rankingsRes.json();
        setRankings(rankingsData);
        
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : '未知错误');
        toast.error('获取成绩数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [currentUserId, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        {error}
      </div>
    );
  }

  if (!user || !currentUserId) {
    return (
      <div className="text-center p-4">
        请先登录查看成绩
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="my-scores">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-scores">我的成绩</TabsTrigger>
          <TabsTrigger value="rankings">成绩排名</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-scores">
          <Card>
            <CardHeader>
              <CardTitle>个人成绩详情</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              {myScores && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="border p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">总分数</h3>
                    <p className="text-2xl font-bold">{myScores.summary.overall.total_score}</p>
                  </div>
                  <div className="border p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">平均分</h3>
                    <p className="text-2xl font-bold">
                      {myScores.summary.overall.avg_score.toFixed(2)}
                    </p>
                  </div>
                  <div className="border p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-muted-foreground">完成任务</h3>
                    <p className="text-2xl font-bold">
                      {myScores.scores.filter(s => s.completed).length}/{myScores.scores.length}
                    </p>
                  </div>
                </div>
              )}

              {/* Scores Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>任务编号</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>分数</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>日期</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myScores && myScores.scores.length > 0 ? (
                      myScores.scores.map((score) => (
                        <TableRow key={score.id}>
                          <TableCell>任务 {score.task_number}</TableCell>
                          <TableCell>
                            {score.score_type === 'practice' ? (
                              <Badge variant="secondary">实践题</Badge>
                            ) : (
                              <Badge>选择题</Badge>
                            )}
                          </TableCell>
                          <TableCell>{score.score}</TableCell>
                          <TableCell>
                            {score.completed ? (
                              <span className="text-green-600">已完成</span>
                            ) : (
                              <span className="text-yellow-600">进行中</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(score.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          暂无成绩记录
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rankings">
          <Card>
            <CardHeader>
              <CardTitle>成绩排名</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>排名</TableHead>
                      <TableHead>学号</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>总分数</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.length > 0 ? (
                      rankings.map((student, index) => (
                        <TableRow 
                          key={student.student_id}
                          className={student.student_id === currentUserId ? "bg-muted/50" : ""}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{student.student_id}</TableCell>
                          <TableCell>{student.student_name}</TableCell>
                          <TableCell>{student.total_score}</TableCell>
                          <TableCell>
                            {student.student_id === currentUserId && (
                              <Badge variant="outline">我</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          暂无排名数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}