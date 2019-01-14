module.exports = {
  "transform": {
    ".tsx?": "ts-jest"
  },
  "testRegex": "src/__tests__/.*.(test|spec)\\.(ts|tsx|js)$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "json"
  ],
  "testPathIgnorePatterns": [
    "node_modules/",
    "lib/.*"
  ],
  "unmockedModulePathPatterns": [
    "lib/.*",
    "dist/.*"
  ],
  "testURL": "http://localhost"
}
