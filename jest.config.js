module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // FIX uuid (ESM)
  transformIgnorePatterns: [
    '/node_modules/(?!(uuid|nanoid)/)',
  ],

  // FIX bcrypt native
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  // Test reports
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './test-report',
        filename: 'report.html',
        expand: true,
      },
    ],
  ],

  // Ignore global mocks
  clearMocks: true,
};
