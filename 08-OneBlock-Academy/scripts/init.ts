import fs from 'fs';
import path from 'path';
import type { Database as DatabaseType } from 'better-sqlite3';
import  Database from 'better-sqlite3';



import dotenv from 'dotenv';




dotenv.config();


function initTables(db:DatabaseType ) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      wechat_id TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      gender TEXT NOT NULL,
      age_group TEXT NOT NULL,
      education TEXT NOT NULL,
      university TEXT NOT NULL,
      major TEXT NOT NULL,
      city TEXT NOT NULL,
      role TEXT NOT NULL,
      languages TEXT NOT NULL,
      experience TEXT NOT NULL,
      source TEXT NOT NULL,
      has_web3_experience BOOLEAN NOT NULL,
      study_time TEXT NOT NULL,
      interests TEXT NOT NULL,
      platforms TEXT NOT NULL,
      willing_to_hackathon BOOLEAN NOT NULL,
      willing_to_lead BOOLEAN NOT NULL,
      wants_private_service BOOLEAN NOT NULL,
      referrer TEXT NOT NULL,
      wallet_address TEXT NOT NULL,
      student_id TEXT NOT NULL UNIQUE,  
      approved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME         
    );

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,

  task1_choice_score INTEGER DEFAULT 0,
  task1_practice_score INTEGER DEFAULT 0,
  task2_choice_score INTEGER DEFAULT 0,
  task2_practice_score INTEGER DEFAULT 0,
  task3_choice_score INTEGER DEFAULT 0,
  task3_practice_score INTEGER DEFAULT 0,
  task4_choice_score INTEGER DEFAULT 0,
  task4_practice_score INTEGER DEFAULT 0,
  task5_choice_score INTEGER DEFAULT 0,
  task5_practice_score INTEGER DEFAULT 0,
  task6_choice_score INTEGER DEFAULT 0,
  task6_practice_score INTEGER DEFAULT 0,

  -- 新增：每个任务的选择题完成标志，BOOLEAN本质是INTEGER
  task1_choice_completed BOOLEAN DEFAULT 0,
  task2_choice_completed BOOLEAN DEFAULT 0,
  task3_choice_completed BOOLEAN DEFAULT 0,
  task4_choice_completed BOOLEAN DEFAULT 0,
  task5_choice_completed BOOLEAN DEFAULT 0,
  task6_choice_completed BOOLEAN DEFAULT 0,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,

  FOREIGN KEY (student_id) REFERENCES registrations(student_id)
);


CREATE TABLE IF NOT EXISTS task_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  task_number INTEGER NOT NULL,   -- 任务编号 
  score_type TEXT NOT NULL CHECK (score_type IN ('choice', 'practice')),      -- 'choice' 或 'practice'
  score INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES registrations(student_id)
);


    CREATE TABLE IF NOT EXISTS choice_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_number INTEGER NOT NULL,           -- 属于哪一节任务（Task1 ~ Task6）
      question_number INTEGER NOT NULL,       -- 第几题（每个 Task 内唯一）
      question_text TEXT NOT NULL,            -- 题目内容
      options TEXT NOT NULL,                  -- JSON 字符串，包含 A/B/C/D 选项，前端解析
      correct_option TEXT NOT NULL,           -- 正确选项（如 'B'）
      score INTEGER NOT NULL, 
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME      
    );

    CREATE TABLE IF NOT EXISTS course_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,                   -- 内容标题
      type TEXT NOT NULL,                    -- 类型: 'announcement' | 'resource'
      task_number INTEGER,                   -- 可选，关联任务编号（Task1 ~ Task6）
      content_markdown TEXT NOT NULL,        -- Markdown 内容
      is_pinned BOOLEAN DEFAULT 0,           -- 是否置顶（可选）
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME  
    );

    CREATE TABLE IF NOT EXISTS student_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT,
      student_name TEXT,
      title TEXT NOT NULL,                  
      content_markdown TEXT NOT NULL,                       
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,  
      FOREIGN KEY (student_id) REFERENCES registrations(student_id)
    );
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,                 -- 姓名
      wechat_id TEXT NOT NULL UNIQUE,         -- 微信id（用于联系或展示）
      phone TEXT,                         -- 联系方式（可选）
      role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'assistant')), -- 角色限定
      wallet_address TEXT NOT NULL UNIQUE, -- 钱包地址
      approved BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME  
    );

    CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT UNIQUE,
    project_name TEXT,
    factory_address TEXT,
    whitelist_address TEXT,
    nft_address TEXT,
    claim_address TEXT,
    erc20_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME  
  ) ;

  CREATE TABLE IF NOT EXISTS student_project_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  nft_address TEXT NOT NULL,
  claim_address TEXT NOT NULL,
  erc20_address TEXT NOT NULL,
  has_claimed BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  UNIQUE(student_id, project_id),
  FOREIGN KEY(student_id) REFERENCES registrations(student_id),
  FOREIGN KEY(project_id) REFERENCES projects(project_id)
);


  `);
}


async function main() {
  // 1️⃣ 保证 data 目录存在
  const dataDir = path.resolve(process.cwd(), 'data');
  console.log("test")
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
    console.log('✅ 已创建 data/ 目录');
  }
  const db = new Database(path.resolve(process.cwd(), 'data', 'Academy.db'));
  // 1. 建表
  initTables(db);

  // 2. 从环境变量中读取 ADMIN_ADDRESS
  const adminAddr = process.env.ADMIN_ADDRESS;
  if (!adminAddr) {
    console.error('请在 .env.local 中设置 ADMIN_ADDRESS');
    process.exit(1);
  }

  // 3. 向 staff 表中插入一条 admin 记录
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO staff
      (name, wechat_id, phone, role, wallet_address)
    VALUES
      (@name, @wechat_id, @phone, @role, @wallet_address)
  `);
  const info = stmt.run({
    name: 'oneblock',
    wechat_id: 'oneblack',
    phone: '1356895689',
    role: 'admin',
    wallet_address: adminAddr,
  });
  console.log(`插入 staff 记录，changes=${info.changes}`);
  console.log(`项目初始化完成，管理员为：${adminAddr}`);
}



main().catch((err) => {
  console.error(err);
  process.exit(1);
});
