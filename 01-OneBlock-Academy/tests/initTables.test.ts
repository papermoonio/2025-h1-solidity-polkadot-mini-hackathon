// tests/db/initTables.test.ts
import db from '@/lib/db'; // 使用实际数据库文件 ./data/Academy.db
import { initTables } from '@/lib/db/schema';
import { beforeAll, afterAll, describe, it, expect } from 'vitest';

describe('initTables (with real DB)', () => {
  beforeAll(() => {
    initTables();
  });

  afterAll(() => {
    db.prepare(`DELETE FROM registrations`).run();
    db.prepare(`DELETE FROM tasks`).run();
    db.prepare(`DELETE FROM choice_questions`).run();
    db.prepare(`DELETE FROM course_contents`).run();
    db.prepare(`DELETE FROM student_notes`).run();
    db.prepare(`DELETE FROM staff`).run();
  });

  it('should create the registrations table', () => {
    const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='registrations'`).get();
    expect(result).toBeDefined();
  });

  it('should create the tasks table', () => {
    const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'`).get();
    expect(result).toBeDefined();
  });

  it('should create the choice_questions table', () => {
    const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='choice_questions'`).get();
    expect(result).toBeDefined();
  });

  it('should create the course_contents table', () => {
    const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='course_contents'`).get();
    expect(result).toBeDefined();
  });

  it('should create the student_notes table', () => {
    const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='student_notes'`).get();
    expect(result).toBeDefined();
  });
  it('should create the staff table', () => {
    const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='staff'`).get();
    expect(result).toBeDefined();
  });
});
