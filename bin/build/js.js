const jsConfig = require("../helpers/loadConfig").js
	, STATUSES = require("../const").STATUSES
	, getPath = require("../helpers/getPath")
	, trackTime = require("../helpers/trackTime")()
	, createCompiler = require("../helpers/createCompiler")
	, eslintFormatter = require("../helpers/eslintFormatter")
	, path = require("path")
	, output = require("../output")
	, webpack = require("webpack")
	, UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// Force production
process.env.NODE_ENV = "production";

// I/O
let i, o, op;

const prefixRel = s => (s[0] + s[1] !== "./" ? "./" : "") + s;

if (Array.isArray(jsConfig.input)) {
	i = jsConfig.input.reduce((a, b) => {
		a[path.basename(b, ".js")] = prefixRel(b);
		return a;
	}, {});
	o = ~jsConfig.output.indexOf("[name]") ? jsConfig.output : "[name].bundle.js";
	op = path.dirname(getPath(jsConfig.input[0]));
} else {
	i = prefixRel(jsConfig.input);
	o = jsConfig.output;
	op = path.dirname(getPath(jsConfig.input));
}

// Babel Path
function babelPath (name, type = "plugin") {
	return __dirname + "/../../node_modules/babel-" + type + "-" + name;
}

const compiler = createCompiler("js", webpack, {
	context: getPath(),
	entry: i,
	output: {
		filename: o,
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
			// Process JS with Babel.
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: [
					// This loader parallelizes code compilation, it is optional
					// but improves compile time on larger projects
					require.resolve('thread-loader'),
					{
						loader: require.resolve('babel-loader'),
						options: {
							babelrc: false,
							compact: false,
							presets: [
								[babelPath("env", "preset"), {
									"targets": {
										"browsers": [
											"last 2 versions",
											"safari >= 7",
											"ie >= 10"
										]
									},
									"modules": false
								}]
							],
							plugins: [
								babelPath("external-helpers"),
								babelPath("transform-class-properties"),
								babelPath("transform-object-rest-spread"),
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

			reload && reload();
		});
	},
};