const jsConfig = require("../helpers/loadConfig").js
	, STATUSES = require("../const").STATUSES
	, getPath = require("../helpers/getPath")
	, trackTime = require("../helpers/trackTime")()
	, env = require("../helpers/env")
	, createCompiler = require("../helpers/createCompiler")
	, eslintFormatter = require("../helpers/eslintFormatter")
	, hashFilename = require("../helpers/hashFilename")
	, path = require("path")
	, fs = require("fs")
	, output = require("../output")
	, webpack = require("webpack")
	, UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// Force production
process.env.NODE_ENV = "production";

// I/O
let i, o;

const prefixRel = s => (s[0] + s[1] !== "./" ? "./" : "") + s;

if (Array.isArray(jsConfig.input)) {
	i = jsConfig.input.reduce((a, b) => {
		a[path.basename(b, ".js")] = prefixRel(b);
		return a;
	}, {});
	o = ~jsConfig.output.indexOf("[name]")
		? jsConfig.output
		: path.dirname(getPath(jsConfig.input)) + "[name].bundle.js";
} else {
	i = prefixRel(jsConfig.input);
	o = jsConfig.output;
}

let op = path.dirname(getPath(jsConfig.output));

const compiler = createCompiler("js", webpack, {
	context: getPath(),
	entry: i,
	output: {
		// We'll manage filename hashing so we an keep track of it
		filename: path.basename(o),
		path: op,
	},
	mode: "production",
	devtool: "source-map",
	module: {
		rules: [
			// Disable require.ensure as it's not a standard language feature.
			{ parser: { requireEnsure: false } },
			
			// Lint
			{
				test: /\.js$/,
				enforce: 'pre',
				use: [
					{
						options: {
							formatter: eslintFormatter,
							eslintPath: require.resolve("eslint"),
							configFile: path.resolve(__dirname, "../config/.eslint.js"),
							cache: true,
						},
						loader: require.resolve("eslint-loader"),
					},
				],
				exclude: /node_modules/,
			},
			// Process JS
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					// This loader parallelizes code compilation, it is optional
					// but improves compile time on larger projects
					require.resolve('thread-loader'),
					// Babel
					{
						loader: require.resolve('babel-loader'),
						options: {
							babelrc: false,
							compact: false,
							presets: [
								[
									require.resolve("babel-preset-env"),
									{
										"targets": {
											"browsers": [
												"last 2 versions",
												"safari >= 7",
												"ie >= 10"
											]
										},
										"modules": false
									}
								]
							],
							plugins: [
								require.resolve("babel-plugin-transform-class-properties"),
								require.resolve("babel-plugin-transform-object-rest-spread"),
							],
							cacheDirectory: true,
							highlightCode: true,
						},
					},
				],
			},
		],
	},
	plugins: [
		// Minify the code.
		new UglifyJsPlugin({
			uglifyOptions: {
				ecma: 8,
				compress: {
					warnings: false,
					// Disabled because of an issue with Uglify breaking seemingly valid code:
					// https://github.com/facebook/create-react-app/issues/2376
					// Pending further investigation:
					// https://github.com/mishoo/UglifyJS2/issues/2011
					comparisons: false,
				},
				mangle: {
					safari10: true,
				},
				output: {
					comments: false,
					// Turned on because emoji and regex is not minified properly using default
					// https://github.com/facebook/create-react-app/issues/2488
					ascii_only: true,
				},
			},
			// Use multi-process parallel running to improve the build speed
			// Default number of concurrent runs: os.cpus().length - 1
			parallel: true,
			// Enable file caching
			cache: true,
			sourceMap: true,
		}),
	],
});

module.exports = {
	run: function (reload) {
		if (output.stats.js.status === STATUSES.WORKING)
			return;
		
		trackTime.start();
		
		output.updateStats("js", {
			status: STATUSES.WORKING,
		});
		
		// Run the compiler
		compiler.run((err, stats) => {
			output.updateStats("js", {
				time: trackTime.stop(),
			});
			
			if (err || stats.hasErrors())
				return;
			
			const hashedFilename = hashFilename(o, stats.hash);
			const map = getPath(hashedFilename) + ".map";
			
			// Fix the sourcemap
			fs.exists(map, () => {
				const m = fs.readFileSync(map, { format: "utf8" }).toString();
				fs.writeFileSync(map, m.replace(',"sourceRoot":""', ""));
			});
			
			env(hashedFilename, "js");
			reload && reload();
		});
	},
};