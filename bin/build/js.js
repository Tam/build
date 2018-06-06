const fs = require("fs")
	, path = require("path");

const rollup = require("rollup").rollup
	, eslint = require("../rollup/eslint")
	, nodeResolve = require("rollup-plugin-node-resolve")
	, commonJs = require("rollup-plugin-commonjs")
	, babel = require("rollup-plugin-babel")
	, uglify = require("rollup-plugin-uglify")
	, minify = require("uglify-es").minify;

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

// Options
const inputOptions = {
	experimentalDynamicImport: true,
	experimentalCodeSplitting: true,
	
	plugins: [
		eslint(trackTime, {
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
				require.resolve("babel-plugin-syntax-dynamic-import"),
			],
		}),
		
		uglify({
			ecma: 8,
		}, minify)
	],
	
	onwarn: ({ message, loc, frame }) => {
		warning("js", {
			warnings: [{
				message,
				file:    loc ? loc.file : null,
				line:    loc ? loc.line : null,
				column:  loc ? loc.column : null,
				extract: frame ? frame.replace(/\t/g, "    ") : "",
			}],
		});
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
	const jsFile = path.basename(i, ".js");
	if (~o.indexOf("[name]"))
		o = o.replace("[name]", path.basename(i, ".js"));
	
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
		// dir: path.dirname(o),
	});
	
	// Hash the output filename
	o = hashFilename(o, null, code);
	
	// Ensure the output directory exists
	ensureDirectoryExistence(o);
	
	// Write compiled JS & Source Map to disk
	fs.writeFileSync(
		o,
		code + `//# sourceMappingURL=${path.basename(o)}.map`
	);
	fs.writeFileSync(o + ".map", map);
	
	// Update .env
	env(o, hasMultipleInputs ? `js_${jsFile.replace(".js", "")}` : "js");
}

async function buildJs (reload) {
	if (stats.js.status === STATUSES.WORKING)
		return;
	
	trackTime.start();
	
	// Tell the user JS is compiling
	working("js");
	
	try {
		// Build each input
		for (let i = 0, l = inputs.length; i < l; ++i) {
			const input = inputs[i]
				, output = oddOutput ? outputs[0] : outputs[i];
			
			await build(input, output);
		}
		
		// Reload the browser
		reload && reload();
		
		if (stats.js.status === STATUSES.WARNING) {
			// Tell the user JS compiled with warnings
			// (which would have been defined by this point (see ../rollup/eslint)
			warning("js", {
				time: trackTime.stop(),
			});
		} else {
			// Tell the user JS compiled successfully
			success("js", {
				time: trackTime.stop(),
			});
		}
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
