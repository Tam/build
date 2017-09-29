#! /usr/bin/env node

// Variables
// =========================================================================

const fs = require("fs")
	, path = require("path")
	, program = require("commander");

const targetDir = process.cwd()
	, version = require("../package.json").version;

const getPath = file => path.join(targetDir, file);

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
	.option("--no-watch", "Don't watch, will compile then exit")
	.parse(process.argv);

if (!program.watch) {
	// TODO: Don't watch
}

if (program.less) {
	// TODO: Build less only
}

if (program.js) {
	// TODO: Build JS only
}

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
	let customConfig = JSON.parse(fs.readFileSync(getPath(targetDir)));
	
	// Merge shallow for each config group (i.e. less, js, etc.)
	const keys = Object.keys(config);
	for (let i = 0; i < keys.length; i++)
		if (customConfig.hasOwnProperty(keys[i]))
			config[keys[i]] = Object.assign(config[keys[i]], customConfig[keys[i]]);
} catch (_) {
	// Eh
}

// Build
// =========================================================================

const reload = () => {
	if (!config.browserSync.ignore)
		browserSync.reload();
};

if (!config.less.ignore) {
	
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
	
}

if (!config.js.ignore) {
	
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
		}).catch(function(err) { console.error(err); });
	});
	
}


gulp.task('watch', function () {
	// TODO: Wrap in getPath, accounting for !
	gulp.watch(["public/assets/js/**/*.js", "!public/assets/js/**/*.min.js"], ["js"]);
	gulp.watch(["public/assets/less/**/*"], ["less"]);
	gulp.watch("craft/templates/**/*").on("change", reload);
});

const w = [];
if (program.watch) w.push("watch");

gulp.task("default", w, function () {
	if (!config.browserSync.ignore) {
		browserSync.init({
			open: false,
			proxy: config.browserSync.proxy
		});
	}
});

// TODO: Run gulp with the above config...