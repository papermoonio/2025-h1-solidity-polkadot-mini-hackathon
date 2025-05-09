// src/components/teacher/GradeManagement.tsx
import { useState, useEffect } from 'react'
import { ScoreType } from '@/lib/db/query/taskScores'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
//import { toast } from 'sonner';

interface RawScore {
  id: number
  student_id: string
  student_name: string | null
  task_number: number
  score_type: ScoreType
  score: number
  completed: boolean
}

interface FormData {
  id?: number
  student_id: string
  task_number: number
  score_type: ScoreType
  score: number
  completed: boolean
}

interface StudentScore {
  student_id: string;
  student_name: string;
  wechat_id: string;
  wallet_address: string;
  total_score: number;
}

export function GradeManagement() {
  const [scores, setScores] = useState<RawScore[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    student_id: '',
    task_number: 1,
    score_type: 'practice',
    score: 0,
    completed: false,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [filteredScores, setFilteredScores] = useState<RawScore[]>([])
    const [activeTab, setActiveTab] = useState('management');
  const [rankings, setRankings] = useState<StudentScore[]>([]);
  // Fetch all scores
  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/student/taskscores')
        if (!res.ok) throw new Error('Failed to fetch scores')
        const data: RawScore[] = await res.json()
        setScores(data)
        setFilteredScores(data)
        const rankingsRes = await fetch('/api/teacher/task-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'summary' })
        });
        
        if (!rankingsRes.ok) throw new Error('获取排名失败');
        const rankingsData = await rankingsRes.json();
        setRankings(rankingsData);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchScores()
       
       
    
    
  }, [])

  // Filter when student selection changes
  useEffect(() => {
    setFilteredScores(
      selectedStudentId
        ? scores.filter(s => s.student_id === selectedStudentId)
        : scores
    )
  }, [selectedStudentId, scores])

  // Create / Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const action = isEditing ? 'update' : 'create'
      const payload = isEditing
        ? {
            action,
            id: formData.id!,
            score: formData.score,
            completed: formData.completed,
            score_type: formData.score_type,
          }
        : { action, ...formData }

      const res = await fetch('/api/teacher/task-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Failed to ${action} score`)

      // Refresh list
      const refresh = await fetch('/api/student/taskscores')
      const data: RawScore[] = await refresh.json()
      setScores(data)
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Delete
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条评分记录吗？')) return
    try {
      const res = await fetch('/api/teacher/task-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      if (!res.ok) throw new Error('Failed to delete score')

      // Refresh list
      const refresh = await fetch('/api/student/taskscores')
      const data: RawScore[] = await refresh.json()
      setScores(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // Populate form for editing
  const handleEdit = (score: RawScore) => {
    setFormData({
      id: score.id,
      student_id: score.student_id,
      task_number: score.task_number,
      score_type: score.score_type,
      score: score.score,
      completed: score.completed,
    })
    setIsEditing(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      student_id: '',
      task_number: 1,
      score_type: 'practice',
      score: 0,
      completed: false,
    })
    setIsEditing(false)
  }

  // Form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: target.checked }))
    } else if (name === 'score' || name === 'task_number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const uniqueStudentIds = Array.from(
    new Set(scores.map(s => s.student_id))
  )

  const studentSummaries = uniqueStudentIds.map(studentId => {
    const studentScores = scores.filter(s => s.student_id === studentId)
    const total = studentScores.reduce((sum, s) => sum + s.score, 0)
    const avg = (total / studentScores.length) || 0
    const name = studentScores[0]?.student_name || studentId
    return {
      student_id: studentId,
      student_name: name,
      total_score: total,
      avg_score: avg.toFixed(2),
      records_count: studentScores.length,
    }
  })

  if (loading) return <div className="p-4">加载中...</div>
  if (error) return <div className="p-4 text-red-500">错误: {error}</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">成绩管理系统</h1>
           <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="my-scores">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="management">成绩管理</TabsTrigger>
                <TabsTrigger value="rankings">成绩排名</TabsTrigger>
              </TabsList>
       <TabsContent value="management">
                <Card>
                  <CardHeader>
                    <CardTitle>成绩管理</CardTitle>
                  </CardHeader>
                  <CardContent>      
      {/* 学生筛选 */}
      <div className="mb-6">
        <label className="block mb-2 font-medium">选择学生：</label>
        <select
          className="w-full p-2 border rounded"
          value={selectedStudentId}
          onChange={e => setSelectedStudentId(e.target.value)}
        >
          <option value="">所有学生</option>
          {uniqueStudentIds.map(id => (
            <option key={id} value={id}>
              {scores.find(s => s.student_id === id)?.student_name ||
                id}
            </option>
          ))}
        </select>
      </div>

      {/* 学生统计 */}
      {selectedStudentId && (
        <div className="mb-6 p-4 bg-gray-100 rounded">
          {studentSummaries
            .filter(x => x.student_id === selectedStudentId)
            .map(summary => (
              <div key={summary.student_id}>
                <h3 className="font-bold">
                  {summary.student_name}
                </h3>
                <p>总分: {summary.total_score}</p>
                <p>平均分: {summary.avg_score}</p>
                <p>记录数: {summary.records_count}</p>
              </div>
            ))}
        </div>
      )}

      {/* 成绩列表 */}
      <div className="mb-8 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-3">成绩列表</h2>
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">学号</th>
              <th className="p-2 border">姓名</th>
              <th className="p-2 border">任务编号</th>
              <th className="p-2 border">评分类型</th>
              <th className="p-2 border">分数</th>
              <th className="p-2 border">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredScores.length > 0 ? (
              filteredScores.map(score => (
                <tr key={score.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{score.student_id}</td>
                  <td className="p-2 border">
                    {score.student_name || '未知'}
                  </td>
                  <td className="p-2 border">{score.task_number}</td>
                  <td className="p-2 border">
                    {score.score_type === 'practice'
                      ? '实践题'
                      : '选择题'}
                  </td>
                  <td className="p-2 border">{score.score}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => handleEdit(score)}
                      className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(score.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 添加 / 编辑 表单 */}
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-3">
          {isEditing ? '编辑评分记录' : '添加新评分'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">学生ID:</label>
              <input
                type="text"
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                disabled={isEditing}
              />
            </div>
            <div>
              <label className="block mb-1">任务编号:</label>
              <input
                type="number"
                name="task_number"
                value={formData.task_number}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                min={1}
                disabled={isEditing}
              />
            </div>
            <div>
              <label className="block mb-1">评分类型:</label>
              <select
                name="score_type"
                value={formData.score_type}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="practice">实践题</option>
                <option value="choice">选择题</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">分数:</label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                min={0}
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="completed"
                  checked={formData.completed}
                  onChange={handleChange}
                  className="mr-2"
                />
                已完成
              </label>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              {isEditing ? '更新' : '添加'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                取消
              </button>
            )}
          </div>
        </form>
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
                                      
                                      >
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{student.student_id}</TableCell>
                                        <TableCell>{student.student_name}</TableCell>
                                        <TableCell>{student.total_score}</TableCell>
                                     
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
  )
}