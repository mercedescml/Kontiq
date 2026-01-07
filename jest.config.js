module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server.js',
    'public/js/**/*.js',
    '!public/js/**/*.test.js',
    '!public/js/**/*.spec.js'
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  verbose: true,
  testTimeout: 10000
};
