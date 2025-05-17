// ./src/app/api/student/coure/router.ts
import { NextResponse } from 'next/server';
import { getAllCourseContents } from '@/lib/db/query/courseContents';

export async function GET() {
  try {
    const contents = getAllCourseContents();
    return NextResponse.json({ success: true, data: contents });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
