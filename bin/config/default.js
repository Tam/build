module.exports = {
	// The filename of the manifest file. If set to null, not manifest will
	// generate.
	manifest: 'manifest.json',

	less: {
		// If set to false, Less compilation will not run
		run: true,

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

	js: {
		// If set to false, JS compilation will not run
		run: true,

		// An array of entry JS file paths
		// See https://webpack.js.org/configuration/entry-context/#entry for
		// supported entries
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
	},

	critical: {
		// If set to false, critical css will not be generated
		// (will not run in development)
		run: true,

		// The base URL of the site to generate critical css from
		baseUrl: 'https://dev.site.com',

		// The URL of your css (can be array of URLs)
		// Use `[file.name]` to get a value from the manifest
		cssUrl: 'https://dev.site.com/assets/css/[style.less]',

		// The output directory path for generated critical CSS files
		output: 'templates/_critical',

		// The critical css files and their associated URIs.
		// "_blog-post": "/blog/my-average-post"
		paths: {
			'index': '/',
		},
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
};
