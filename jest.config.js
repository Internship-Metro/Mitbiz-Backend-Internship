/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',

  // Path alias (sama seperti di tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },

  // File setup yang dijalankan SEKALI sebelum semua test
  globalSetup: '<rootDir>/src/tests/global-setup.ts',

  // File setup yang dijalankan SEKALI setelah semua test
  globalTeardown: '<rootDir>/src/tests/global-teardown.ts',

  // Lokasi file test
  testMatch: ['**/__tests__/**/*.test.ts'],

  // Timeout per test (ms)
  testTimeout: 15000,

  // Tampilkan nama setiap test
  verbose: true,

  // Jalankan test BERURUTAN — penting agar DB tidak konflik
  maxWorkers: 1,

  // Gunakan @swc/jest (support TypeScript 7, jauh lebih cepat dari ts-jest)
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: false,
          decorators: false,
        },
        target: 'es2020',
        paths: {
          '@/*': ['./src/*'],
          '@common/*': ['./src/common/*'],
          '@modules/*': ['./src/modules/*'],
          '@config/*': ['./src/config/*'],
        },
        baseUrl: '.',
      },
    }],
  },
};

module.exports = config;
