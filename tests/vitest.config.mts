import { defineConfig } from 'vitest/config';

/** Security rules tests, run against the Database emulator with `npm run test:rules` */
export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        environment: 'node',
        fileParallelism: false,
    },
});
