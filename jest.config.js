module.exports = {
    preset: 'ts-jest',  // Use ts-jest for TypeScript files
    testEnvironment: 'node',
    transform: {
      '^.+\\.ts$': 'ts-jest',  // Transform TypeScript files with ts-jest
    },
    moduleFileExtensions: ['ts', 'js'],  // Include both .ts and .js file extensions
  };