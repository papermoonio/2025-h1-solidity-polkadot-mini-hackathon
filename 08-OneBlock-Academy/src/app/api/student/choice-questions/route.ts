import { NextRequest, NextResponse } from 'next/server';
import { 
  getQuestionsWithoutAnswers,
  calculateChoiceScore,
  getAllChoiceQuestions,
  ChoiceQuestion
} from '@/lib/db/query/choiceQuestions';

import { 
  createTaskScore,
  getTaskScoresByStudent
} from '@/lib/db/query/taskScores';

export async function GET(request: NextRequest) {
  try {
    // Get the student_id from the query string if available
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');

    // Get all questions without answers
    const questions = getQuestionsWithoutAnswers();
    
    // If a student_id is provided, get their completed tasks
    let completedTasks: number[] = [];
    if (student_id) {
      const taskScores = getTaskScoresByStudent(student_id);
      completedTasks = taskScores
        .filter(score => score.score_type === 'choice' && score.completed)
        .map(score => score.task_number);
    }

    return NextResponse.json({ 
      success: true, 
      data: questions,
      completed_tasks: completedTasks
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, task_number, answers } = body;

    // Validate required fields
    if (!student_id || !task_number || !answers || typeof answers !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get all questions for this task
    const allQuestions: ChoiceQuestion[] = getAllChoiceQuestions();
    const taskQuestions = allQuestions.filter(q => q.task_number === task_number);
    
    if (taskQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No questions found for this task' },
        { status: 404 }
      );
    }

    // Check if student has already completed this task
    const studentScores = getTaskScoresByStudent(student_id);
    const existingScore = studentScores.find(
      score => score.task_number === task_number && score.score_type === 'choice'
    );
    
    if (existingScore && existingScore.completed) {
      return NextResponse.json(
        { success: false, error: 'You have already completed this task' },
        { status: 400 }
      );
    }

    // Calculate the score
    const totalScore = calculateChoiceScore(answers);
    
    // Create answer feedback data
    const incorrectQuestions = taskQuestions
      .filter(question => {
        const questionId = question.id;
        return (
          questionId !== undefined &&
          answers[questionId] !== undefined &&
          question.correct_option !== answers[questionId]
        );
      })
      .map(q => {
        const questionId = q.id ?? 0;
        return {
          id: questionId,
          question_number: q.question_number,
          correct_option: q.correct_option,
          student_answer: answers[questionId]
        };
      });

    // Calculate maximum possible score
    const maxScore = taskQuestions.reduce((sum, q) => sum + q.score, 0);
    
    // Create or update task score record
    if (existingScore) {
      // We could update the existing score record here if needed
      // For now, we'll return an error as the student has already attempted this
      return NextResponse.json(
        { success: false, error: 'A score record already exists for this task' },
        { status: 400 }
      );
    } else {
      // Create new task score record
      createTaskScore({
        student_id,
        task_number,
        score_type: 'choice',
        score: totalScore,
        completed: true
      });
    }

    return NextResponse.json({
      success: true,
      score: totalScore,
      max_score: maxScore,
      total_questions: taskQuestions.length,
      correct_count: taskQuestions.length - incorrectQuestions.length,
      incorrect_questions: incorrectQuestions,
      message: `Your score for Task ${task_number} is ${totalScore}/${maxScore}`
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}