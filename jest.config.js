module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {},

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest/presets/js-with-ts',

  // Automatically reset mock state between every test
  resetMocks: true,

  // Automatically restore mock state between every test
  restoreMocks: true,

  // The test environment that will be used for testing
  testEnvironment: 'node',
  // FIXME: improve test coverage and uncomment below lines
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: -10
  //   }
  // },
  collectCoverageFrom: ['src/**/{!(index),}.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/build/']
}
