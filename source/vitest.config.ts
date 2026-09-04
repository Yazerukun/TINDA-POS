import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
    passWithNoTests: false,
    // Full disk-backed workflows include scrypt setup and SQLite checkpoints.
    testTimeout: 20_000,
    // Database services intentionally use one process-global SQLite handle.
    // Running test files concurrently races their isolated TINDA_DATA_DIRs.
    fileParallelism: false,
    maxWorkers: 1
  },
  resolve: {
    alias: {
      '@shared': new URL('./src/shared', import.meta.url).pathname
    }
  }
})
