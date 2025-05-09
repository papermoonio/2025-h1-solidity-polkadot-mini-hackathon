// ./src/app/api/tasks/route.ts
import { NextResponse } from 'next/server';
import { getAllTasks } from '@/lib/db/query/tasks';

export async function GET() {
  try {
    const tasks = getAllTasks();
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ message: 'Failed to fetch tasks' }, { status: 500 });
  }
}
