module.exports = {
	// The filename of the manifest file. If set to null, not manifest will
	// generate.
	manifest: 'manifest.json',

	less: {
		// If set to false, Less compilation will not run
		run: false,

		// An array of entry Less file paths. Must be strings.
		entry: [
			'assets/less/style.less',
		],

		// An array of output CSS file paths. Must match the entry paths.
		// Output names can contain: "[hash:20]": a random hash (with a given
		// length)
		output: [
			'web/assets/css/style.[hash:20].css',
		],
	},

	sass: {
		// If set to false, Less compilation will not run
		run: true,

		// An array of entry SASS file paths. Must be strings.
		entry: [
			'assets/scss/style.scss',
		],

		// An array of output CSS file paths. Must match the entry paths.
		// Output names can contain: "[hash:20]": a random hash (with a given
		// length)
		output: [
			'web/assets/css/style.[hash:20].css',
		],
	},

	js: {
		// If set to false, JS compilation will not run
		run: true,

		// An array of entry JS file paths
		// See https://webpack.js.org/configuration/entry-context/#entry for
		// supported entries.
		entry: {
			app: './assets/js/app.js',
		},

		// An array of output JS file paths. Must match input paths.
		// See https://webpack.js.org/configuration/output/
		// for supported output configs
		output: {
			path: process.cwd() + '/web/assets/js',
			publicPath: '/assets/js/',
			filename: '[name].[hash:20].js',
			chunkFilename: 'chunks/[name].[chunkhash].js',
		},

		// If set to true, JSX will be supported
		jsx: false,

		// Will be merged with the webpack config, allowing you to add, remove,
		// or override any webpack config options.
		config: webpack => ({}),
	},

	ts: {
		// If set to false, TS compilation will not run
		run: false,

		// An array of entry TS file paths
		// See https://webpack.js.org/configuration/entry-context/#entry for
		// supported entries.
		entry: {
			app: './assets/ts/app.ts',
		},

		// An array of output JS file paths. Must match input paths.
		// See https://webpack.js.org/configuration/output/
		// for supported output configs
		output: {
			path: process.cwd() + '/web/assets/js',
			publicPath: '/assets/js/',
			filename: '[name].[hash:20].js',
			chunkFilename: 'chunks/[name].[chunkhash].js',
		},

		// If set to true, TSX will be supported
		tsx: false,

		// Will be merged with the webpack config, allowing you to add, remove,
		// or override any webpack config options.
		config: webpack => ({}),
	},

	critical: {
		// If set to false, critical css will not be generated
		// (will not run in development)
		run: true,

		// The base URL of the site to generate critical css from
		baseUrl: 'https://dev.site.com',

		// The URL of your css (can be array of URLs)
		// Use `[file.name]` to get a value from the manifest
		// This can be relative to the base URL or an absolute URL
		cssUrl: '/assets/css/[style.less]',

		// The output directory path for generated critical CSS files
		output: 'templates/_critical',

		// The critical css files and their associated URIs.
		// "_blog-post": "/blog/my-average-post"
		paths: {
			'index': '/',
		},

		// An array of CSS selectors (can be regexes) to include in critical, even if not in the viewport
		forceInclude: [],

		// An array of CSS selectors (can be regexes) to exclude in critical, even if in the viewport
		forceExclude: [],
	},

	browserSync: {
		// If set to false, browser sync will not run
		// (will not run in production)
		run: true,

		// The URL browser sync should proxy
		proxy: 'https://dev.site.com',

		// An array of additional paths to watch
		// Starting a path with `!` will make it ignored
		watch: [
			'templates/**/*',
		],
	},

	copy: {
		// If false, copy will not run
		run: false,

		// The base path that the paths will be copied to
		basePath: 'web',

		// The paths to copy { [from]: [to] }
		// [from] is relative to your current working directory
		// [to] is relative to `basePath` above
		paths: {
			'assets/fonts': 'assets/fonts',
		},
	},

	themeKit: {
		// If true, will run `theme watch` on your current directory
		run: false,
	},
};
