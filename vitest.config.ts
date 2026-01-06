import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        testTimeout: 30000, // 30 seconds default
        hookTimeout: 60000,
        alias: {
            '@': path.resolve(__dirname, './apps/manager/src'),
        },
    },
});
