#! /usr/bin/env node

// Variables
// =========================================================================

const fs = require("fs")
	, path = require("path")
	, program = require("commander")
	, chalk = require("chalk")
	, prettyTime = require("pretty-hrtime");

const targetDir = process.cwd()
	, version = require("../package.json").version;

const getPath = file => {
	let bang = file[0] === "!";
	
	if (bang) file = file.slice(1, file.length);
	
	return (bang ? "!" : "") + path.join(targetDir, file);
};

// Variables: Gulp
// -------------------------------------------------------------------------

const gulp = require("gulp")
	, sourcemaps = require("gulp-sourcemaps");

const less = require("gulp-less")
	, LessPluginAutoPrefix = require("less-plugin-autoprefix")
	, cleanCss = require("gulp-clean-css")
	, autoprefixer = new LessPluginAutoPrefix({ browsers: ["last 3 versions"] });

const rollup = require("rollup").rollup
	, eslint = require("rollup-plugin-eslint")
	, babel  = require("rollup-plugin-babel")
	, uglify = require("rollup-plugin-uglify")
	, nodeResolve = require("rollup-plugin-node-resolve")
	, commonjs = require("rollup-plugin-commonjs")
	, minify = require("uglify-js").minify;

const browserSync = require("browser-sync").create();

// Commands
// =========================================================================

program
	.version(version)
	.option("--less", "Compile less only")
	.option("--js", "Compile JS only")
	.parse(process.argv);

// Config
// =========================================================================

let config = {
	"less": {
		"ignore": false,
		"input":  "public/assets/less/style.less",
		"output": "public/assets/css",
		"watch":  ["public/assets/less/**/*"]
	},
	"js": {
		"ignore": false,
		"input":  "public/assets/js/app.js",
		"output": "public/assets/js/app.min.js",
		"watch":  [
			"public/assets/js/**/*.js",
			"!public/assets/js/**/*.min.js"
		]
	},
	"browserSync": {
		"ignore": false,
		"proxy": "LOCAL_URL.dev",
		"watch": ["craft/templates/**/*"]
	}
};

try {
	let customConfig = JSON.parse(fs.readFileSync(getPath(".buildrc")));
	
	// Merge shallow for each config group (i.e. less, js, etc.)
	const keys = Object.keys(config);
	for (let i = 0; i < keys.length; i++)
		if (customConfig.hasOwnProperty(keys[i]))
			config[keys[i]] = Object.assign(config[keys[i]], customConfig[keys[i]]);
} catch (_) {
	// Eh
}

// Log
// =========================================================================

// Format orchestrator errors
function formatError(e) {
	if (!e.err) {
		return e.message;
	}
	
	// PluginError
	if (typeof e.err.showStack === 'boolean') {
		return e.err.toString();
	}
	
	// Normal error
	if (e.err.stack) {
		return e.err.stack;
	}
	
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

gulp.on('task_not_found', function(err) {
	console.log(
		chalk.red('Task \'' + err.task + '\' is not in your gulpfile')
	);
	console.log('Please check the documentation for proper gulpfile formatting');
	process.exit(1);
});

// Build
// =========================================================================

const reload = () => {
	if (!config.browserSync.ignore)
		browserSync.reload();
};

gulp.task("less", function () {
	gulp.src(getPath(config.less.input))
	    .pipe(sourcemaps.init())
	    .pipe(less({
		    plugins: [autoprefixer]
	    }).on("error", function(err){ console.log(err.message); }))
	    .pipe(cleanCss())
	    .pipe(sourcemaps.write("."))
	    .pipe(gulp.dest(getPath(config.less.output)))
	    .on("end", reload);
});

gulp.task("js", function () {
	rollup({
		input: getPath(config.js.input),
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
			commonjs(),
			babel({
				"presets": [
					["env", {
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
					"external-helpers",
					"transform-class-properties",
					"transform-object-rest-spread"
				]
			}),
			uglify({}, minify)
		],
		sourcemap: true
	}).then(function (bundle) {
		bundle.write({
			format: "es",
			sourcemap: true,
			file: getPath(config.js.output)
		});
		reload();
	}).catch(function(err) { /*console.error(err);*/ });
});


gulp.task("watch", function () {
	if (!config.js.ignore)
		gulp.watch(config.js.watch.map(getPath), ["js"]);
	
	if (!config.less.ignore)
		gulp.watch(config.less.watch.map(getPath), ["less"]);
	
	if (!config.browserSync.ignore)
		gulp.watch(config.browserSync.watch.map(getPath)).on("change", reload);
});

if (program.less) {
	gulp.start("less");
	return;
}

if (program.js) {
	gulp.start("js");
	return;
}

if (!config.browserSync.ignore) {
	browserSync.init({
		open: false,
		proxy: config.browserSync.proxy
	});
}

// TODO: `start` will be replaced in favour of `series` and `parallel` in Gulp 4
gulp.start("watch");