/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.*\\.spec\\.ts$', // chạy các file kết thúc bằng .spec.ts
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    // 👇 Cấu hình alias để Jest hiểu `src/...`
    moduleNameMapper: {
      '^src/(.*)$': '<rootDir>/src/$1',
    },
    // 👇 Thư mục coverage (tùy chọn)
    coverageDirectory: './coverage',
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/main.ts',
      '!src/**/*.module.ts',
    ],
  };