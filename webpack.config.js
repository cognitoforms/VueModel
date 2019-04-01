const path = require('path');
const ForkTsCheckerPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
	mode: "development",
	entry: path.resolve(__dirname, 'src'),
	output: {
		filename: 'vuemodel.js',
		path: path.resolve(__dirname, 'out'),
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.json']
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