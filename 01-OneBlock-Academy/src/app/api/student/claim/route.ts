// ./src/app/api/student/claim/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectsByStudentId,
  getLatestProject,
  insertStudentProjectClaim,
} from '@/lib/db/query/StudentProjectClaim';

// POST: 通过 action 字段区分查询和插入
export async function POST(request: NextRequest) {
  try {
    const data: {
      action?: string;
      student_id?: string;
      project_id?: string;
      project_name?: string;
      nft_address?: string;
      claim_address?: string;
      erc20_address?: string;
    } = await request.json();
    const { action, student_id } = data;

    if (!student_id) {
      return NextResponse.json(
        { error: 'Missing student_id in request body' },
        { status: 400 }
      );
    }

    // 查询操作，只需 student_id
    if (action === 'query') {
      // 将返回值断言为包含 has_claimed 字段的数组
      const history = getProjectsByStudentId(student_id) as Array<{ has_claimed: boolean }>;
      const claimed = history.some((record) => record.has_claimed);
      if (claimed) {
        return NextResponse.json({ projects: history });
      }
      const latest = getLatestProject();
      if (!latest) {
        return NextResponse.json(
          { error: 'No projects available' },
          { status: 404 }
        );
      }
      return NextResponse.json({ project: latest });
    }

    // 插入操作，需提供完整项目字段
    if (action === 'add') {
      const {
        project_id,
        project_name,
        nft_address,
        claim_address,
        erc20_address,
      } = data;

      if (
        !project_id ||
        !project_name ||
        !nft_address ||
        !claim_address ||
        !erc20_address
      ) {
        return NextResponse.json(
          { error: 'Missing project data for insert' },
          { status: 400 }
        );
      }

      const result = insertStudentProjectClaim({
        student_id,
        project_id,
        project_name,
        nft_address,
        claim_address,
        erc20_address,
        has_claimed: true,
      });

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'query' or 'add'." },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error(
      'Error in POST /student/claim:',
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
