import * as fs from 'fs';

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import { uglify } from 'rollup-plugin-uglify';

import pkg from './package.json';

const version = process.env.VERSION || pkg.version

const banner =
  '/*!\n' +
  ' * VueModel.js v' + version + '\n' +
  ' * (c) ' + new Date().getFullYear() + ' Cognito LLC\n' +
  ' * Released under the MIT License.\n' +
  ' */'

const Format = {
	iife: "iife",
	umd: "umd",
	cjs: "cjs",
	es: "es",
};

function getMinFileName(fileName) {
	let fileNameMatch = /^(.*)\.js$/.exec(fileName);
	if (fileNameMatch) {
		return fileNameMatch[1] + ".min.js";
	} else {
		throw new Error("Invalid file name '" + fileName + "'.");
	}
}
const modelJsContent = fs.readFileSync(__dirname + "/lib/model.js/dist/model.js", { encoding: "utf8" });
const modelJsMinContent = fs.readFileSync(__dirname + "/lib/model.js/dist/model.min.js", { encoding: "utf8" });

export default [
	// UMD (for browsers) build (development)
	{
		input: 'src/main.ts',
		output: {
			name: 'VueModel',
			file: pkg.browser,
			format: Format.umd,
			banner: banner,
			intro: modelJsContent
		},
		plugins: [
			resolve(), // so Rollup can find NPM dependencies
			commonjs(), // so Rollup can convert NPM dependencies to ES modules
			typescript(), // so Rollup can compile TypeScript files to JavaScript
		],
	},

	// UMD (for browsers) build (production)
	{
		input: 'src/main.ts',
		output: {
			name: 'VueModel',
			file: getMinFileName(pkg.browser),
			format: Format.umd,
			banner: banner,
			intro: modelJsMinContent,
		},
		plugins: [
			resolve(), // so Rollup can find NPM dependencies
			commonjs(), // so Rollup can convert NPM dependencies to ES modules
			typescript(), // so Rollup can compile TypeScript files to JavaScript
			uglify(), // so Rollup can minify the output
		],
	},
];
