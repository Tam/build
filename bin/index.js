#! /usr/bin/env node

// Variables
// =========================================================================

const fs = require("fs")
	, path = require("path")
	, https = require("https")
	, program = require("commander")
	, chalk = require("chalk")
	, prettyTime = require("pretty-hrtime")
	, compareVersions = require('compare-versions');

const targetDir = process.cwd()
	, version = require("../package.json").version;

const getPath = file => {
	let bang = file[0] === "!";
	
	if (bang) file = file.slice(1, file.length);
	
	return (bang ? "!" : "") + path.join(targetDir, file);
};

// Variables: Build
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

// Updates
// =========================================================================

https.get("https://raw.githubusercontent.com/Tam/build/master/package.json?c=" + (new Date()), resp => {
	let data = '';
	
	// A chunk of data has been recieved.
	resp.on('data', (chunk) => {
		data += chunk;
	});
	
	// The whole response has been received. Print out the result.
	resp.on('end', () => {
		const newVersion = JSON.parse(data).version;
		
		if (compareVersions(newVersion, version) === 1) {
			setTimeout(() => {
				const g = chalk.green
					, c = chalk.bold.cyan;
				
				console.log(g("╔══════════════════════════╗"));
				console.log(g("║") + "  An update is available  " + g("║"));
				console.log(g("║") + c("    npm i -g tam/build    ") + g("║"));
				console.log(g("╚══════════════════════════╝"));
			}, 1000);
		}
	});
});

// Commands
// =========================================================================

program
	.version(version)
	.option("--less", "Compile LESS once only")
	.option("--js", "Compile JS once only")
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
} catch (err) {
	if (err.message.indexOf("no such file") > -1) {
		console.log(
			chalk.bold.keyword("orange")("No config file found, using default")
		);
	} else {
		console.error(chalk.bold.red("Config Error: ") + err.message);
	}
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

// Build
// =========================================================================

const reload = () => {
	if (!config.browserSync.ignore)
		browserSync.reload();
};

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
		sourcemap: true
	}).then(function (bundle) {
		bundle.write({
			format: "es",
			sourcemap: true,
			file: getPath(config.js.output)
		});
		reload();
	}).catch(function(err) {
		// Ignore syntax errors, babel/rollup will output a nice error
		if (err.constructor.name !== "SyntaxError")
			console.error(err);
	});
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