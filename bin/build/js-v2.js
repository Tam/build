const fs = require("fs")
	, path = require("path");

const rollup = require("rollup").rollup
	, eslint = require("rollup-plugin-eslint")
	, nodeResolve = require("rollup-plugin-node-resolve")
	, commonJs = require("rollup-plugin-commonjs")
	, babel = require("rollup-plugin-babel");

const { working, success, warning, failure, stats } = require("../output")
	, { STATUSES } = require("../const");

const jsConfig = require("../helpers/loadConfig").js
	, trackTime = require("../helpers/trackTime")()
	, env = require("../helpers/env")
	, getPath = require("../helpers/getPath")
	, hashFilename = require("../helpers/hashFilename")
	, ensureDirectoryExistence = require("../helpers/ensureDirectoryExistence");

// File I/O
const hasMultipleInputs = Array.isArray(jsConfig.input);
const inputs = (
	hasMultipleInputs ? jsConfig.input : [jsConfig.input]
).map(p => getPath(p));
const outputs = (
	hasMultipleInputs
		? Array.isArray(jsConfig.output)
			? jsConfig.output
			: [
				~jsConfig.output.indexOf("[name]")
			        ? jsConfig.output
			        : path.basename(jsConfig.output) + "[name].min.js"
			]
		: [jsConfig.output]
).map(p => getPath(p));

const oddOutput = inputs.length !== outputs.length;

// Caches
const caches = {};

// TODO:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::TODO
// TODO:     Write own eslint Rollup plugin to control err/warn output     :TODO
// TODO:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::TODO

// Options
const inputOptions = {
	experimentalDynamicImport: true,
	experimentalCodeSplitting: true,
	
	plugins: [
		eslint({
			parserOptions: {
				ecmaVersion: 7,
				sourceType: "module"
			},
			extends: "eslint:recommended",
			parser: "babel-eslint",
			rules: {
				eqeqeq: [1, "smart"],
				semi: [1, "always"],
				"no-loop-func": [2],
				"no-unused-vars": [1],
				"no-console": [1],
				"no-mixed-spaces-and-tabs": [0],
			},
			env: {
				browser: true,
				es6: true,
			},
		}),
		
		nodeResolve({
			module:  true,
			jsnext:  true,
			main:    true,
			browser: true,
		}),
		
		commonJs({
			include: "node_modules/**",
		}),
		
		babel({
			babelrc: false,
			presets: [
				[
					require.resolve("babel-preset-env"),
					{
						targets: {
							browsers: [
								"last 2 versions",
								"safari >= 7",
								"ie >= 10"
							]
						},
						modules: false,
					}
				]
			],
			plugins: [
				require.resolve("babel-plugin-external-helpers"),
				require.resolve("babel-plugin-transform-class-properties"),
				require.resolve("babel-plugin-transform-object-rest-spread"),
			],
		}),
	],
	
	onwarn: ({ message, loc, frame }) => {
		failure("js", {
			errors: [{
				message,
				file:    loc.file,
				line:    loc.line,
				column:  loc.column,
				extract: frame ? frame.replace(/\t/g, "    ") : "",
			}],
			time: trackTime.stop(),
		});
		
		throw new Error("__ignore__");
	},
};

const outputOptions = {
	format: "es",
	sourcemap: true,
};

/**
 * Build
 *
 * @param {string} i
 * @param {string} o
 * @returns {Promise<void>}
 */
async function build (i, o) {
	// Replace [name]
	if (~o.indexOf("[name]"))
		o = o.replace("[name]", path.basename(i, ".js"));
	
	// Hash the output filename
	o = hashFilename(o);
	
	// Create a bundle
	const bundle = await rollup({
		...inputOptions,
		input: i,
		cache: caches.hasOwnProperty(i) ? caches[i] : null,
	});
	
	// Cache the bundle for future builds
	caches[i] = bundle;
	
	// Generate the code
	const { code, map } = await bundle.generate({
		...outputOptions,
		file: o,
	});
	
	// Ensure the output directory exists
	ensureDirectoryExistence(o);
	
	// Write compiled JS & Source Map to disk
	fs.writeFileSync(o, code);
	fs.writeFileSync(o + ".map", map);
	
	// Update .env
	env(o, "js");
}

async function buildJs (reload) {
	trackTime.start();
	
	try {
		for (let i = 0, l = inputs.length; i < l; ++i) {
			const input = inputs[i]
				, output = oddOutput ? outputs[0] : outputs[i];
			
			await build(input, output);
		}
		
		// Reload the browser
		reload && reload();
		
		// Tell the user JS compiled successfully
		success("js", {
			time: trackTime.stop(),
		});
	} catch (err) {
		if (err.message === "__ignore__")
			return;
		
		// Tell the user JS failed
		failure("js", {
			errors: [{ message: err.message }],
			time:   trackTime.stop(),
		});
	}
}

module.exports = buildJs;