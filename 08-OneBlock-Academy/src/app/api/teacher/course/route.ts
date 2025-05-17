// ./src/app/api/teacher/course/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  addCourseContent,
  updateCourseContent,
  deleteCourseContent,
} from '@/lib/db/query/courseContents';

export async function POST(req: NextRequest) {
  const { action, data } = await req.json();

  try {
    if (action === 'add') {
      addCourseContent(data);
      return NextResponse.json({ success: true, message: '内容新增成功' });
    }

    if (action === 'update') {
      if (!data.id) {
        return NextResponse.json({ success: false, message: '更新内容必须提供 id' }, { status: 400 });
      }
      const result = updateCourseContent(data.id, data);
      return NextResponse.json(result);
    }

    if (action === 'delete') {
      if (!data.id) {
        return NextResponse.json({ success: false, message: '删除内容必须提供 id' }, { status: 400 });
      }
      const result = deleteCourseContent(data.id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, message: '未知操作类型' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
