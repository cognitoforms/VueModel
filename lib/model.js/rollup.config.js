import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript";
import { uglify } from "rollup-plugin-uglify";

import pkg from "./package.json";

const version = process.env.VERSION || pkg.version;

const banner =
  "/*!\n" +
  " * Model.js v" + version + "\n" +
  " * (c) " + new Date().getFullYear() + " Cognito LLC\n" +
  " * Released under the MIT License.\n" +
  " */";

const Format = {
	iife: "iife",
	umd: "umd",
	cjs: "cjs",
	es: "es"
};

function getMinFileName(fileName) {
	let fileNameMatch = /^(.*)\.js$/.exec(fileName);
	if (fileNameMatch) {
		return fileNameMatch[1] + ".min.js";
	}
	else {
		throw new Error("Invalid file name '" + fileName + "'.");
	}
}

function createConfig(fileName, format, minified) {
	if (minified) {
		fileName = getMinFileName(fileName);
	}

	let plugins = [
		resolve(), // so Rollup can find NPM dependencies
		commonjs(), // so Rollup can convert NPM dependencies to ES modules
		typescript() // so Rollup can compile TypeScript files to JavaScript
	];

	if (minified) {
		plugins.push(
			uglify() // so Rollup can minify the output
		);
	}

	return {
		input: "src/index.ts",
		output: {
			name: "Model",
			file: fileName,
			format: format,
			banner: banner
		},
		plugins: plugins
	};
}

export default [

	// UMD (for browsers) build (development)
	createConfig(pkg.browser, Format.umd, false),

	// UMD (for browsers) build (production)
	createConfig(pkg.browser, Format.umd, true)

];
