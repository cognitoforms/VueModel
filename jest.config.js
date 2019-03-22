// Use a random port number for the mock API by default,
// to support multiple instances of Jest running
// simultaneously, like during pre-commit lint.
process.env.MOCK_API_PORT = process.env.MOCK_API_PORT || Math.floor(Math.random() * 9999 + 9000);

module.exports = {
	// setupFiles: ["<rootDir>/testing/unit/setup"],
	// globalSetup: "<rootDir>/testing/unit/global-setup",
	// globalTeardown: "<rootDir>/testing/unit/global-teardown",
	setupFilesAfterEnv: ["<rootDir>/testing/unit/setup"],
	testMatch: ["**/(*.)unit.[jt]s"],
	moduleFileExtensions: ["js", "ts", "json", "vue"],
	transform: {
		"^.+\\.js$": "babel-jest",
		"^.+\\.ts$": "ts-jest"
	},
	transformIgnorePatterns: ["<rootDir>/node_modules/"],
	moduleNameMapper: {
		// Transform any static assets to empty strings
		"\\.(jpe?g|png|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf)$": "<rootDir>/testing/unit/fixtures/empty-string.js",
		"^@/(.*)$": "<rootDir>/src/$1",
		"^vue$": "vue/dist/vue.common.js"
	},
	// snapshotSerializers: ["jest-serializer-vue"],
	coverageDirectory: "<rootDir>/testing/unit/coverage",
	collectCoverageFrom: [
		"src/**/*.{js,ts,vue}",
		"!**/node_modules/**"
	],
	// https://facebook.github.io/jest/docs/en/configuration.html#testurl-string
	// Set the `testURL` to a provided base URL if one exists, or the mock API base URL
	// Solves: https://stackoverflow.com/questions/42677387/jest-returns-network-error-when-doing-an-authenticated-request-with-axios
	testURL: process.env.API_BASE_URL || `http://localhost:${process.env.MOCK_API_PORT}`
};
