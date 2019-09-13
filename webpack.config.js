const path = require('path');
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
	mode: "development",
	entry: path.resolve(__dirname, 'src'),
	output: {
		filename: 'vuemodel.js',
		library: "VueModel",
		libraryExport: 'default',
		libraryTarget: "umd",
		path: path.resolve(__dirname, 'out'),
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.json']
	},
	externals:{
		"model.js": "model",
		"vue": "Vue"
	},
	module: {
		rules: [
			{
				test: /\.(ts|js)$/,
				loader: 'babel-loader',
				exclude: /node_modules/
			}
		],
	},
	plugins: [
		new ForkTsCheckerPlugin()
	],
	optimization: {
		minimize: false
	}
};