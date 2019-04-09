module.exports = {
	presets: [
		"@babel/typescript",
		[
			"@babel/preset-env",
			{
				corejs: 3,
				targets: { node: "current" },
				useBuiltIns: "usage"
			}
		]
	],
	plugins: [
		["@babel/plugin-proposal-decorators", { legacy: true }],
		["@babel/plugin-proposal-class-properties", { loose: true }],
		// Always transform classes because the Entity extension implementation requires it
		["@babel/plugin-transform-classes"],
		["@babel/plugin-proposal-object-rest-spread"]
	]
};