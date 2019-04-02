module.exports = {
	presets: [
		"@babel/typescript",
		[
			"@babel/preset-env",
			{
				corejs: 3,
				targets: "> 0.25%, not dead",
				useBuiltIns: "usage"
			}
		]
	],
	plugins: [
		["@babel/plugin-proposal-decorators", { legacy: true }],
		["@babel/plugin-proposal-class-properties"],
		"@babel/plugin-proposal-object-rest-spread"
	]
};