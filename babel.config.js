module.exports = {
	presets: [
		"@babel/typescript",
		[
			"@babel/preset-env",
			{
				targets: { node: "current" },
				useBuiltIns: false
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