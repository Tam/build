#! /usr/bin/env node

const config = require("./helpers/loadConfig")
	, chalk = require("chalk")
	, clearConsole = require("./helpers/clearConsole")
	, getPath = require("./helpers/getPath")
	, prettyTime = require("pretty-hrtime");

const gulp = require("gulp")
	, sourceMaps = require("gulp-sourcemaps");

// Output
// =========================================================================

clearConsole();

/**
 * Format the orchestrator errors
 *
 * @param e
 * @returns {*}
 */
function formatError (e) {
	if (!e.err)
		return e.message;
	
	// PluginError
	if (typeof e.err.showStack === 'boolean')
		return e.err.toString();
	
	// Normal error
	if (e.err.stack)
		return e.err.stack;
	
	// Unknown (string, number, etc.)
	return new Error(String(e.err)).stack;
}

gulp.on('task_start', function(e) {
	console.log('Starting', '\'' + chalk.cyan(e.task) + '\'...');
});

gulp.on('task_stop', function(e) {
	const time = prettyTime(e.hrDuration);
	console.log(
		'Finished', '\'' + chalk.cyan(e.task) + '\'',
		'after', chalk.magenta(time)
	);
});

gulp.on('task_err', function(e) {
	const msg = formatError(e);
	const time = prettyTime(e.hrDuration);
	console.log(
		'\'' + chalk.cyan(e.task) + '\'',
		chalk.red('errored after'),
		chalk.magenta(time)
	);
	console.log(msg);
});

// Tasks
// =========================================================================

// Browser Sync
// -------------------------------------------------------------------------

const browserSync = require("browser-sync").create();

const reload = () => {
	if (!config.browserSync.ignore)
		browserSync.reload();
};

const startBrowserSync = () => {
	browserSync.init({
		open: "external",
		proxy: config.browserSync.proxy,
		host: config.browserSync.proxy,
		watchEvents: ["add", "change", "unlink", "addDir", "unlinkDir"],
		notify: false,
	});
};

// LESS
// -------------------------------------------------------------------------

const less = require("gulp-less")
	, LessPluginAutoPrefix = require("less-plugin-autoprefix")
	, cleanCss = require("gulp-clean-css")
	, autoPrefixer = new LessPluginAutoPrefix({ browsers: ["last 3 versions"] });

gulp.task("less", () => {
	gulp.src(getPath(config.less.input))
	    .pipe(sourceMaps.init())
	    .pipe(less({
		    plugins: [autoPrefixer]
	    }).on("error", function(err){ console.log(err.message); }))
	    .pipe(cleanCss())
	    .pipe(sourceMaps.write("."))
	    .pipe(gulp.dest(getPath(config.less.output)))
	    .on("end", reload);
});

// JS
// -------------------------------------------------------------------------

const rollup = require("rollup").rollup
	, eslint = require("rollup-plugin-eslint")
	, babel  = require("rollup-plugin-babel")
	, uglify = require("rollup-plugin-uglify")
	, nodeResolve = require("rollup-plugin-node-resolve")
	, commonjs = require("rollup-plugin-commonjs")
	, minify = require("uglify-js").minify;

/**
 * Tell Babel to look in builds node_modules, not the node_modules folder of the
 * directory build is running in
 *
 * @param name
 * @param type
 * @returns {string}
 */
function babelPath (name, type = "plugin") {
	return __dirname + "/../node_modules/babel-" + type + "-" + name;
}

function rl (i, o) {
	rollup({
		input: getPath(i),
		plugins: [
			eslint({
				useEslintrc: false,
				baseConfig: {
					parserOptions: {
						ecmaVersion: 7,
						sourceType: "module"
					},
					extends: "eslint:recommended",
				},
				parser: "babel-eslint",
				rules: {
					eqeqeq: [1, "smart"],
					semi: [1, "always"],
					"no-loop-func": [2],
					"no-console": [1],
					"no-mixed-spaces-and-tabs": [0],
				},
				envs: ["browser", "es6"]
			}),
			nodeResolve({
				module: true,
				jsnext: true,
				main: true,
				browser: true
			}),
			commonjs({
				include: 'node_modules/**',
			}),
			babel({
				"presets": [
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
				"plugins": [
					babelPath("external-helpers"),
					babelPath("transform-class-properties"),
					babelPath("transform-object-rest-spread"),
				]
			}),
			uglify({}, minify)
		],
		output: {
			sourcemap: true,
		},
	}).then(function (bundle) {
		bundle.write({
			format: "es",
			sourcemap: true,
			file: getPath(o)
		});
		reload();
	}).catch(function(err) {
		// Ignore syntax errors, babel/rollup will output a nice error
		if (err.constructor.name !== "SyntaxError")
			console.error(err);
	});
}

const iA = typeof config.js.input === typeof []
	, oA = typeof config.js.output === typeof [];

if (!config.js.ignore) {
	if (iA && !oA || !iA && oA)
		throw "Your JS inputs and outputs must be of the same type";
	
	if (iA && oA && config.js.input.length !== config.js.output.length)
		throw "Your JS input & output arrays must match in length";
}

function buildJS () {
	if (iA) {
		config.js.input.map((input, i) => {
			rl(input, config.js.output[i]);
		});
	} else {
		rl(config.js.input, config.js.output);
	}
}

gulp.task("js", function () {
	buildJS();
});

// Watchers
// -------------------------------------------------------------------------

gulp.task(
	"watch:js",
	() => gulp.watch(config.js.watch.map(getPath), ["js"])
);

gulp.task(
	"watch:less",
	() => gulp.watch(config.js.watch.map(getPath), ["less"])
);

gulp.task(
	"watch:browserSync",
	() => gulp.watch(config.js.watch.map(getPath)).on("change", reload)
);

// Run
// -------------------------------------------------------------------------

const tasks = [];

if (process.argv.slice(2)[0] === "once") {
	if (!config.js.ignore) tasks.push("js");
	if (!config.less.ignore) tasks.push("less");
} else {
	if (!config.js.ignore) tasks.push("watch:js");
	if (!config.less.ignore) tasks.push("watch:less");
	if (!config.browserSync.ignore) {
		startBrowserSync();
		tasks.push("watch:browserSync");
	}
}

gulp.task("run", tasks);

gulp.task("start", () => {
	clearConsole();
	gulp.start("run");
});

gulp.start("start");