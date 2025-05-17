'use client';

import { useState, useEffect } from 'react';
import { ChoiceQuestion } from '@/lib/db/query/choiceQuestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from "next-auth/react"; // Assuming you use next-auth

type SubmissionResult = {
  success: boolean;
  score: number;
  max_score: number;
  total_questions: number;
  correct_count: number;
  incorrect_questions: { 
    id: number;
    question_number: number;
    correct_option: string;
    student_answer: string;
  }[];
  message: string;
}

export function AnswerCard() {
  const { data: session } = useSession();
  const student_id = session?.user?.id || "guest"; // You'd need to adapt this to your auth system
  
  const [taskNumber, setTaskNumber] = useState<number>(1);
  const [questions, setQuestions] = useState<ChoiceQuestion[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<ChoiceQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [availableTasks, setAvailableTasks] = useState<number[]>([1]);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);

  // Load questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, [student_id]);

  // Filter questions by task
  useEffect(() => {
    filterQuestionsByTask();
  }, [taskNumber, questions]);

  async function fetchQuestions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/choice-questions?student_id=${student_id}`);
      const json = await res.json();
      
      if (json.success) {
        setQuestions(json.data);
        
        // Set completed tasks from API response
        if (json.completed_tasks && Array.isArray(json.completed_tasks)) {
          setCompletedTasks(json.completed_tasks as number[]);
        }
        
        // Update available tasks
        const taskNumbers = Array.from(
          new Set((json.data as ChoiceQuestion[]).map(q => q.task_number))
        ).sort((a: number, b: number) => a - b) as number[];
        
        setAvailableTasks(taskNumbers.length > 0 ? taskNumbers : [1]);
        
        // Set initial task number
        if (taskNumbers.length > 0 && !taskNumbers.includes(taskNumber)) {
          setTaskNumber(taskNumbers[0]);
        }
      } else {
        toast.error("Failed to load questions", {
          description: json.error || "Unknown error"
        });
      }
    } catch (error) {
      toast.error("Error loading questions", {
        description: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  }

  function filterQuestionsByTask() {
    setFilteredQuestions(
      questions
        .filter(q => q.task_number === taskNumber)
        .sort((a, b) => a.question_number - b.question_number)
    );
    
    // Reset answers when changing tasks
    if (!completedTasks.includes(taskNumber)) {
      setAnswers({});
      setSubmissionResult(null);
    }
  }

  function handleAnswerChange(questionId: number, option: string) {
    // Prevent changing answers for completed tasks
    if (completedTasks.includes(taskNumber)) return;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  }

  async function handleSubmitAnswers() {
    if (filteredQuestions.length === 0) return;
    
    // Check if task is already completed
    if (completedTasks.includes(taskNumber)) {
      toast.error("Task already completed", {
        description: "You have already submitted answers for this task"
      });
      return;
    }

    // Check if all questions are answered
    const unanswered = filteredQuestions.filter(q => !answers[q.id!]);
    if (unanswered.length > 0) {
      toast.error("Please answer all questions", {
        description: `${unanswered.length} questions remain unanswered`
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/student/choice-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          student_id,
          task_number: taskNumber,
          answers
        }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        // Mark task as completed
        setCompletedTasks(prev => [...prev, taskNumber]);
        
        // Store submission result for display
        setSubmissionResult(result);
        
        toast.success("Submission successful", {
          description: result.message
        });
      } else {
        toast.error("Submission failed", {
          description: result.error || "Unknown error"
        });
      }
    } catch (error) {
      toast.error("Error submitting answers", {
        description: (error as Error).message
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isTaskCompleted = completedTasks.includes(taskNumber);

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>答题卡</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="font-medium">课程任务:</span>
              <Select
                value={taskNumber.toString()}
                onValueChange={(value) => setTaskNumber(Number(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks.map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      作业 {num} {completedTasks.includes(num) && '✓'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isTaskCompleted && (
              <div className="flex items-center text-green-600 dark:text-green-500">
                <Check className="w-4 h-4 mr-1" />
                <span>作业已完成</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No questions available for this task</p>
            </div>
          ) : submissionResult ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Result Summary</h3>
                <div className="space-y-2">
                  <p>分数: <span className="font-bold">{submissionResult.score}/{submissionResult.max_score}</span></p>
                  <p>正确答案: {submissionResult.correct_count} out of {submissionResult.total_questions}</p>
                </div>
              </div>
              
              {submissionResult.incorrect_questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Incorrect Answers</h3>
                  <div className="space-y-2">
                    {submissionResult.incorrect_questions.map(q => (
                      <div key={q.id} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                        <p className="font-medium">Question {q.question_number}</p>
                        <p>你的答案: {q.student_answer}</p>
                        <p>正确答案: {q.correct_option}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                onClick={() => setSubmissionResult(null)}
                className="mt-4"
              >
                Show Questions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className={`overflow-hidden ${isTaskCompleted ? 'opacity-80' : ''}`}>
                  <CardHeader className="bg-muted/50 py-3">
                    <CardTitle className="text-base">
                      问题 {question.question_number} ({question.score} 分数)
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="py-4">
                    <div className="mb-3 font-medium">{question.question_text}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(question.options).map(([key, value]) => (
                        <div 
                          key={key} 
                          className={`p-2 rounded-md ${!isTaskCompleted && 'cursor-pointer'} ${
                            answers[question.id!] === key 
                              ? 'bg-blue-100 dark:bg-blue-900/20' 
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                          onClick={() => handleAnswerChange(question.id!, key)}
                        >
                          <span className="font-medium mr-2">{key}.</span>
                          {value}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!isTaskCompleted && (
                <div className="pt-4">
                  <Button 
                    onClick={handleSubmitAnswers}
                    disabled={submitting || isTaskCompleted}
                    className="w-full"
                  >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    提交作业
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}