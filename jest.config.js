module.exports = {
  collectCoverageFrom: [
    '**/*.js',
    '!jest/**/*.js',
    '!**/.*.js',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!.*.js',
    '!*.config.js',
    '!config/**',
  ],
  coverageDirectory: './coverage/',
  setupFiles: ['<rootDir>/jest/setup'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
};
