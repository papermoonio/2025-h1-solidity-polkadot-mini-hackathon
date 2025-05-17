// ./src/app/api/admin/adminclaim/route.ts

import { NextResponse } from 'next/server';
import { 
  getAllProjects, 
  getAllStudentProjectClaims, 
  deleteProjectById, 
  deleteStudentProjectClaimById 
} from '@/lib/db/query/StudentProjectClaim';

/**
 * API响应数据接口
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * GET 处理程序 - 获取所有项目或申领记录
 */
export async function GET(request: Request) {
  try {
    // 从URL中获取查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // 根据type参数返回不同的数据
    if (type === 'projects') {
      const projects = getAllProjects();
      return NextResponse.json<ApiResponse>({
        success: true,
        data: projects
      });
    } else if (type === 'claims') {
      const claims = getAllStudentProjectClaims();
      return NextResponse.json<ApiResponse>({
        success: true,
        data: claims
      });
    } else {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: '无效的查询类型',
          error: 'Invalid query type'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('获取数据错误:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: '服务器内部错误',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE 处理程序 - 删除指定ID的项目或申领记录
 */
export async function DELETE(request: Request) {
  try {
    // 从URL中获取查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const idStr = searchParams.get('id');

    // 检查ID参数是否有效
    if (!idStr || isNaN(Number(idStr))) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: 'ID参数无效',
          error: 'Invalid ID parameter'
        },
        { status: 400 }
      );
    }

    const id = Number(idStr);

    // 根据类型删除不同的数据
    if (type === 'project') {
      const result = deleteProjectById(id);
      if (result.success) {
        return NextResponse.json<ApiResponse>({
          success: true,
          message: result.message
        });
      } else {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: result.message,
            error: 'Delete failed'
          },
          { status: 404 }
        );
      }
    } else if (type === 'claim') {
      const result = deleteStudentProjectClaimById(id);
      if (result.success) {
        return NextResponse.json<ApiResponse>({
          success: true,
          message: result.message
        });
      } else {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            message: result.message,
            error: 'Delete failed'
          },
          { status: 404 }
        );
      }
    } else {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: '无效的操作类型',
          error: 'Invalid operation type'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('删除数据错误:', error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        message: '服务器内部错误',
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}