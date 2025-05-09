/* File: app/api/admin/projects/route.ts
Description: API route to save new project to SQLite, now includes project_name
*/
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { projectId, projectName, factoryAddress, whitelistAddr, nftAddr, claimAddr,erc20Addr } = await request.json();

    // 验证必要字段
    if (!projectId || !projectName || !factoryAddress || !whitelistAddr || !nftAddr || !claimAddr) {
      return NextResponse.json(
        { success: false, error: '缺少必要的项目信息' },
        { status: 400 }
      );
    }

    // 使用事务确保数据一致性
    db.exec('BEGIN TRANSACTION');
    
    try {
      // 检查项目是否已存在
      const checkStmt = db.prepare('SELECT id FROM projects WHERE project_id = ?');
      const existingProject = checkStmt.get(projectId) as { id?: number } | undefined;

      if (existingProject?.id) {
        // 更新现有项目
        const updateStmt = db.prepare(`
          UPDATE projects 
          SET 
            project_name = ?,
            factory_address = ?,
            whitelist_address = ?,
            nft_address = ?,
            claim_address = ?,
            erc20_address=?,
            updated_at = datetime('now')
          WHERE project_id = ?
        `);
        updateStmt.run(
          projectName,
          factoryAddress,
          whitelistAddr,
          nftAddr,
          claimAddr,
          erc20Addr,
          projectId
        );
      } else {
        // 插入新项目
        const insertStmt = db.prepare(`
          INSERT INTO projects (
            project_id,
            project_name,
            factory_address,
            whitelist_address,
            nft_address,
            claim_address,
            erc20_address,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?,datetime('now'), datetime('now'))
        `);
        insertStmt.run(
          projectId,
          projectName,
          factoryAddress,
          whitelistAddr,
          nftAddr,
          claimAddr,
          erc20Addr
        );
      }

      db.exec('COMMIT');
      return NextResponse.json({ success: true });
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('保存项目失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
