// ./src/components/teacher/AnswerCardManagement.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChoiceQuestion } from '@/lib/db/query/choiceQuestions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type FormErrors = {
  [key: string]: string;
};

export function AnswerCardManagement() {
  // State definitions
  const [taskNumber, setTaskNumber] = useState<number>(1);
  const [questions, setQuestions] = useState<ChoiceQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<ChoiceQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('edit');
  const [availableTasks, setAvailableTasks] = useState<number[]>([1]);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState<boolean>(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [newTaskNumber, setNewTaskNumber] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<ChoiceQuestion>>({
    task_number: 1,
    question_text: '',
    options: { "A": "", "B": "", "C": "", "D": "" },
    correct_option: 'A',
    score: 1,
  });
  
  // Error state
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Initial load to fetch questions
  useEffect(() => {
    fetchQuestions();
  }, []);
  
  // Filter questions when task number changes
  useEffect(() => {
    filterQuestionsByTask();
  }, [taskNumber, questions]);

  // Update available tasks when questions change
  useEffect(() => {
    updateAvailableTasks();
  }, [questions]);

  // Get all questions
  async function fetchQuestions() {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/choice-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get' }),
      });
      const json = await res.json();
      
      if (json.success) {
        setQuestions(json.data);
        filterQuestionsByTask();
        updateAvailableTasks();
      } else {
        toast.error("获取题目失败", {
          description: json.error || "未知错误"
        });
      }
    } catch (error) {
      toast.error("获取题目异常", {
        description: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  }

  // Update the list of available task numbers
  function updateAvailableTasks() {
    if (questions.length === 0) {
      setAvailableTasks([1]);
      return;
    }
    
    const taskNumbers = Array.from(new Set(questions.map(q => q.task_number))).sort((a, b) => a - b);
    
    // If no tasks yet, start with task 1
    if (taskNumbers.length === 0) {
      setAvailableTasks([1]);
      return;
    }
    
    setAvailableTasks(taskNumbers);
    
    // If current task number is not in the list, set to the first available
    if (!taskNumbers.includes(taskNumber) && taskNumbers.length > 0) {
      setTaskNumber(taskNumbers[0]);
    }
  }

  // Filter questions by current task number
  function filterQuestionsByTask() {
    setFilteredQuestions(
      questions
        .filter(q => q.task_number === taskNumber)
        .sort((a, b) => a.question_number - b.question_number)
    );
  }

  // Get next question number
  function getNextQuestionNumber(): number {
    return filteredQuestions.length + 1;
  }

  // Get next task number (for adding new task)
  function getNextTaskNumber(): number {
    if (availableTasks.length === 0) return 1;
    return Math.max(...availableTasks) + 1;
  }

  // Open dialog to add new task
  function openAddTaskDialog() {
    setNewTaskNumber(getNextTaskNumber());
    setAddTaskDialogOpen(true);
  }

  // Handle adding a new task
  function handleAddTask() {
    if (!newTaskNumber) return;
    
    if (availableTasks.includes(newTaskNumber)) {
      toast.error("任务已存在", {
        description: `任务 ${newTaskNumber} 已存在`
      });
      return;
    }
    
    setAvailableTasks(prev => [...prev, newTaskNumber].sort((a, b) => a - b));
    setTaskNumber(newTaskNumber);
    setAddTaskDialogOpen(false);
    toast.success("添加成功", {
      description: `已添加任务 ${newTaskNumber}`
    });
  }

  // Handle deleting a task
  async function handleDeleteTask(taskNum: number) {
    if (!window.confirm(`确定要删除任务 ${taskNum} 及其所有题目？此操作不可恢复。`)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/choice-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'deleteByTask', 
          taskNumber: taskNum 
        }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("删除成功", {
          description: `已删除任务 ${taskNum} 及其所有题目`
        });
        
        // Remove task from available tasks
        setAvailableTasks(prev => prev.filter(t => t !== taskNum));
        
        // Set to another available task if current was deleted
        if (taskNum === taskNumber && availableTasks.length > 1) {
          const newTaskIndex = availableTasks.indexOf(taskNum);
          const newTask = availableTasks[newTaskIndex === 0 ? 1 : newTaskIndex - 1];
          setTaskNumber(newTask);
        } else if (availableTasks.length <= 1) {
          // If it was the only task, create task 1
          setAvailableTasks([1]);
          setTaskNumber(1);
        }
        
        fetchQuestions();
      } else {
        toast.error("删除失败", {
          description: json.error || "未知错误"
        });
      }
    } catch (error) {
      toast.error("删除异常", {
        description: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  }

  // Open add question dialog
  function openAddDialog() {
    setFormData({
      task_number: taskNumber,
      question_number: getNextQuestionNumber(),
      question_text: '',
      options: { "A": "", "B": "", "C": "", "D": "" },
      correct_option: 'A',
      score: 1,
    });
    setFormErrors({});
    setAddDialogOpen(true);
  }

  // Open edit dialog
  function openEditDialog(question: ChoiceQuestion) {
    setCurrentQuestionId(question.id!);
    setFormData({
      task_number: question.task_number,
      question_number: question.question_number,
      question_text: question.question_text,
      options: {...question.options},
      correct_option: question.correct_option,
      score: question.score,
    });
    setFormErrors({});
    setEditDialogOpen(true);
  }

  // Handle form field change
  function handleFormChange(field: string, value: string | number) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear the error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  }

  // Handle option change
  function handleOptionChange(key: string, value: string) {
    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [key]: value
      }
    }));
  }

  // Validate form
  function validateForm(): boolean {
    const errors: FormErrors = {};
    
    if (!formData.question_text?.trim()) {
      errors.question_text = '题目内容不能为空';
    }
    
    let hasEmptyOption = false;
    Object.entries(formData.options || {}).forEach(([ value]) => {
      if (!value.trim()) {
        hasEmptyOption = true;
      }
    });
    
    if (hasEmptyOption) {
      errors.options = '所有选项不能为空';
    }
    
    if (!formData.correct_option) {
      errors.correct_option = '请选择正确答案';
    }
    
    if (!formData.score || formData.score <= 0) {
      errors.score = '分值必须大于0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Add question
  async function handleAddQuestion() {
    if (!validateForm()) return;

    const payloadQuestion: ChoiceQuestion = {
      task_number: taskNumber,
      question_number: getNextQuestionNumber(),
      question_text: formData.question_text!,
      options: formData.options!,
      correct_option: formData.correct_option!,
      score: formData.score || 1,
    };

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/choice-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', questions: [payloadQuestion] }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("添加成功", {
          description: `成功添加题目到任务${taskNumber}`
        });
        setAddDialogOpen(false);
        fetchQuestions();
      } else {
        toast.error("添加失败", {
          description: json.error || "未知错误"
        });
      }
    } catch (error) {
      toast.error("添加异常", {
        description: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  }

  // Update question
  async function handleUpdateQuestion() {
    if (!validateForm() || !currentQuestionId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/teacher/choice-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update', 
          id: currentQuestionId, 
          updates: formData 
        }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("更新成功", {
          description: "题目已成功更新"
        });
        setEditDialogOpen(false);
        fetchQuestions();
      } else {
        toast.error("更新失败", {
          description: json.error || "未知错误"
        });
      }
    } catch (error) {
      toast.error("更新异常", {
        description: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  }

  // Delete question
  async function handleDeleteQuestion(id: number) {
    if (!window.confirm('确定要删除这道题？此操作不可恢复。')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/choice-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const json = await res.json();
      
      if (json.success) {
        toast.success("删除成功", {
          description: "题目已成功删除"
        });
        fetchQuestions();
      } else {
        toast.error("删除失败", {
          description: json.error || "未知错误"
        });
      }
    } catch (error) {
      toast.error("删除异常", {
        description: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>答题卡管理</span>
            <div className="flex gap-2">
              <Button onClick={openAddTaskDialog} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> 添加任务
              </Button>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" /> 添加题目
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">当前任务:</span>
              <Select
                value={taskNumber.toString()}
                onValueChange={(value) => setTaskNumber(Number(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="选择任务" />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      任务 {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {activeTab === 'edit' && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteTask(taskNumber)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除当前任务
              </Button>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="ml-auto">
              <TabsList>
                <TabsTrigger value="edit">编辑模式</TabsTrigger>
                <TabsTrigger value="preview">预览模式</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>当前任务没有题目，请添加新题目</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 py-3">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">
                        第 {question.question_number} 题 ({question.score} 分)
                      </CardTitle>
                      
                      {activeTab === 'edit' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(question)}
                          >
                            <Edit className="h-4 w-4 mr-1" /> 编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteQuestion(question.id!)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> 删除
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="py-4">
                    <div className="mb-3 font-medium">{question.question_text}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(question.options).map(([key, value]) => (
                        <div 
                          key={key} 
                          className={`p-2 rounded-md ${
                            activeTab === 'preview' && question.correct_option === key 
                              ? 'bg-green-100 dark:bg-green-900/20' 
                              : 'bg-muted/50'
                          }`}
                        >
                          <span className="font-medium mr-2">{key}.</span>
                          {value}
                          {activeTab === 'preview' && question.correct_option === key && (
                            <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加新任务</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">任务编号</label>
              <Input
                type="number"
                value={newTaskNumber?.toString() || ''}
                onChange={(e) => setNewTaskNumber(Number(e.target.value))}
                placeholder="请输入任务编号"
                min="1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddTask}>
              添加任务
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add question dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>添加新题目</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">题目内容</label>
              <Textarea
                value={formData.question_text || ''}
                onChange={(e) => handleFormChange('question_text', e.target.value)}
                placeholder="请输入题目内容"
                className={formErrors.question_text ? "border-red-500" : ""}
              />
              {formErrors.question_text && (
                <p className="text-sm text-red-500 mt-1">{formErrors.question_text}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">选项</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(formData.options || {}).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-sm">{key}:</label>
                    <Input
                      value={value}
                      onChange={(e) => handleOptionChange(key, e.target.value)}
                      placeholder={`选项${key}内容`}
                      className={formErrors.options ? "border-red-500" : ""}
                    />
                  </div>
                ))}
              </div>
              {formErrors.options && (
                <p className="text-sm text-red-500 mt-1">{formErrors.options}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">正确答案</label>
                <Select
                  value={formData.correct_option || 'A'}
                  onValueChange={(value) => handleFormChange('correct_option', value)}
                >
                  <SelectTrigger className={formErrors.correct_option ? "border-red-500" : ""}>
                    <SelectValue placeholder="选择正确答案" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <SelectItem key={option} value={option}>
                        选项 {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.correct_option && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.correct_option}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">分值</label>
                <Input
                  type="number"
                  value={formData.score || 1}
                  onChange={(e) => handleFormChange('score', Number(e.target.value))}
                  placeholder="题目分值"
                  min="1"
                  className={formErrors.score ? "border-red-500" : ""}
                />
                {formErrors.score && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.score}</p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleAddQuestion}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              添加题目
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit question dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑题目</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">题目内容</label>
              <Textarea
                value={formData.question_text || ''}
                onChange={(e) => handleFormChange('question_text', e.target.value)}
                placeholder="请输入题目内容"
                className={formErrors.question_text ? "border-red-500" : ""}
              />
              {formErrors.question_text && (
                <p className="text-sm text-red-500 mt-1">{formErrors.question_text}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">选项</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(formData.options || {}).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <label className="text-sm">{key}:</label>
                    <Input
                      value={value}
                      onChange={(e) => handleOptionChange(key, e.target.value)}
                      placeholder={`选项${key}内容`}
                      className={formErrors.options ? "border-red-500" : ""}
                    />
                  </div>
                ))}
              </div>
              {formErrors.options && (
                <p className="text-sm text-red-500 mt-1">{formErrors.options}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">正确答案</label>
                <Select
                  value={formData.correct_option || 'A'}
                  onValueChange={(value) => handleFormChange('correct_option', value)}
                >
                  <SelectTrigger className={formErrors.correct_option ? "border-red-500" : ""}>
                    <SelectValue placeholder="选择正确答案" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <SelectItem key={option} value={option}>
                        选项 {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.correct_option && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.correct_option}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">分值</label>
                <Input
                  type="number"
                  value={formData.score || 1}
                  onChange={(e) => handleFormChange('score', Number(e.target.value))}
                  placeholder="题目分值"
                  min="1"
                  className={formErrors.score ? "border-red-500" : ""}
                />
                {formErrors.score && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.score}</p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleUpdateQuestion}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}