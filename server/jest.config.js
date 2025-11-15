// jest.config.js
export default {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/testSetup.js'],
  globalTeardown: '<rootDir>/src/test-utils/test-teardown.js',
  moduleNameMapper: {
    '^multer-storage-cloudinary$': '<rootDir>/src/__mocks__/multer-storage-cloudinary.js',
  },
};
