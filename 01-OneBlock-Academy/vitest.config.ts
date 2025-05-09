import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true, // ✅ 允许使用 expect、beforeAll 等全局函数
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
}
});
