import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript';
import { uglify } from 'rollup-plugin-uglify';
import pkg from './package.json';

const version = process.env.VERSION || pkg.version

const banner =
  '/*!\n' +
  ' * VueExoModel.js v' + version + '\n' +
  ' * (c) ' + new Date().getFullYear() + ' Cognito LLC\n' +
  ' * Released under the MIT License.\n' +
  ' */'

export default [
	// UMD (for browsers) build (development)
	{
		input: 'src/main.ts',
		output: {
			name: 'VueExoModel',
			file: pkg.browser.development,
			format: 'umd',
			banner: banner,
			external: ['exomodel'],
			globals: {
				'exomodel': 'exomodel',
			},
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
			name: 'VueExoModel',
			file: pkg.browser.production,
			format: 'umd',
			banner: banner,
			external: [
				'exomodel',
			],
			globals: {
				'exomodel': 'exomodel',
			},
		},
		plugins: [
			resolve(), // so Rollup can find NPM dependencies
			commonjs(), // so Rollup can convert NPM dependencies to ES modules
			typescript(), // so Rollup can compile TypeScript files to JavaScript
			uglify(), // so Rollup can minify the output
		],
	},

	// CommonJS (for Node) and ES module (for bundlers) build
	{
		input: 'src/main.ts',
		external: [],
		output: [
			{ file: pkg.main, format: 'cjs', banner: banner },
			{ file: pkg.module, format: 'es', banner: banner },
		],
		plugins: [
			resolve(), // so Rollup can find NPM dependencies
			commonjs(), // so Rollup can convert NPM dependencies to ES modules
			typescript(), // so Rollup can compile TypeScript files to JavaScript
		],
	},
];
