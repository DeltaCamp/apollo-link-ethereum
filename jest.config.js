module.exports = {
  "transform": {
    ".(ts|tsx)": "ts-jest"
  },
  "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
  "moduleFileExtensions": [
    "ts",
    "tsx",
    "js",
    "json"
  ],
  "testPathIgnorePatterns": [
    "/node_modules/"
  ],
  "testURL": "http://localhost"
}
