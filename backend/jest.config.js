module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/services/detectionEngine.js',
    'src/services/correlationEngine.js',
    'src/services/authService.js',
    'src/utils/validators.js'
  ],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50
    }
  },
  testTimeout: 30000,
  setupFilesAfterEnv: [],
  moduleNameMapper: {
    // Add path aliases here if needed in the future
  }
};
