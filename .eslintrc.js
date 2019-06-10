module.exports = {
	root: true,
	env: {
		browser: true
	},
	extends: [
		"standard",
		"prettier",
		"prettier/standard",
	],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 7,
		sourceType: "module",
		allowImportExportEverywhere: true,
		project: "./tsconfig.json"
	},
	plugins: ["@typescript-eslint"],
	rules: {
		// Only allow debugger in development
		"no-debugger": process.env.PRE_COMMIT ? "error" : "off",
		// Only allow `console.log` in development
		//"no-console": process.env.PRE_COMMIT ? ["error", { allow: ["warn", "error"] }] : "off",
		"no-console": "off",
		"brace-style": "stroustrup",
		"indent": ["error", "tab", { "SwitchCase": 1 }],
		"object-curly-spacing": ["error", "always"],
		"linebreak-style": ["error", "windows"],
		"quotes": ["error", "double", { "allowTemplateLiterals": true }],
		"semi": ["error", "always"],
		"standard/no-callback-literal": "off",
		"key-spacing": ["error", { "afterColon": true }],
		"comma-spacing": ["error", { "after": true, "before": false }],
		"comma-dangle": ["error", "never"],
		"keyword-spacing": ["error", { "before": true, "after": true }],
		"no-multiple-empty-lines": "error",
		"padded-blocks": "error",
		"space-before-blocks": "error",
		"brace-style": ["error", "stroustrup", { "allowSingleLine": true }],
		"no-multi-spaces": "error",
		"no-unused-vars": "off",
		"no-dupe-class-members": "off",
		"no-useless-constructor": "off",
		"no-new-func": "off",
		"no-control-regex": "off",
		"@typescript-eslint/no-namespace": "error",
		"@typescript-eslint/no-useless-constructor": "warn",
		"@typescript-eslint/no-use-before-define": ["warn", { "classes": false, "functions": false }],
		"@typescript-eslint/no-unused-vars": "error",
		"new-cap": "off"
	},
	overrides: [
		{
			files: ['**/*.unit.[jt]s'],
			env: { jest: true },
			globals: {
				mount: false,
				shallowMount: false,
				shallowMountView: false,
				createComponentMocks: false,
				createModuleStore: false,
			}
		}
	]
};
