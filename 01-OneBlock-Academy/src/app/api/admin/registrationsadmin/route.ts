//./src/app/api/admin/registrationsadmin/router.ts
import { NextResponse } from 'next/server';
import {
  getAllRegistrations,
  updateApprovalStatus,
  updateRegistration,
  deleteRegistration,
  getRegistrationByStudentId,
} from '@/lib/db/query/registrations';

import { getTaskByStudentId/* , addTask  */} from '@/lib/db/query/tasks'; 

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case 'getAll': {
        const all = getAllRegistrations();
        return NextResponse.json({ data: all });
      }

      case 'approve': {
        if (!payload?.student_id || typeof payload.approved !== 'boolean') {
          return NextResponse.json({ message: 'Missing student_id or approved' }, { status: 400 });
        }

        const reg = getRegistrationByStudentId(payload.student_id);
        if (!reg) {
          return NextResponse.json({ message: 'Registration not found' }, { status: 404 });
        }

        const approveResult = updateApprovalStatus(reg.id, payload.approved);

        // ✅ 审核通过后添加初始化任务数据
        if (payload.approved) {
          const existingTask = getTaskByStudentId(payload.student_id);
          if (!existingTask) {}
      /*     if (!existingTask) {
            addTask({
              student_id: payload.student_id,
              student_name: reg.student_name,
              task1_choice_score: 0,
              task1_practice_score: 0,
              task2_choice_score: 0,
              task2_practice_score: 0,
              task3_choice_score: 0,
              task3_practice_score: 0,
              task4_choice_score: 0,
              task4_practice_score: 0,
              task5_choice_score: 0,
              task5_practice_score: 0,
              task6_choice_score: 0,
              task6_practice_score: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          } */
        }

        return NextResponse.json(approveResult);
      }

      case 'update': {
        if (!payload?.student_id || !payload?.updates) {
          return NextResponse.json({ message: 'Missing student_id or updates' }, { status: 400 });
        }

        const toUpdate = getRegistrationByStudentId(payload.student_id);
        if (!toUpdate) return NextResponse.json({ message: 'Registration not found' }, { status: 404 });

        const updateResult = updateRegistration(toUpdate.id, payload.updates);
        return NextResponse.json(updateResult);
      }

      case 'delete': {
        if (!payload?.student_id) {
          return NextResponse.json({ message: 'Missing student_id' }, { status: 400 });
        }

        const toDelete = getRegistrationByStudentId(payload.student_id);
        if (!toDelete) return NextResponse.json({ message: 'Registration not found' }, { status: 404 });

        const deleteResult = deleteRegistration(toDelete.id);
        return NextResponse.json(deleteResult);
      }

      default:
        return NextResponse.json({ message: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
