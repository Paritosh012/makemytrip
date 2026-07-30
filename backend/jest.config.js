module.exports = {
  testEnvironment: "node",
  // Look for any *.test.js file under __tests__ or beside the code
  testMatch: ["**/__tests__/**/*.test.js", "**/?(*.)+(test).js"],
  // Don't let a hung DB connection keep the process alive forever
  testTimeout: 10000,
};