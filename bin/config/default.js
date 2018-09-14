module.exports = {
	// The filename of the manifest file. If set to null, not manifest will
	// generate.
	manifest: "manifest.json",

	// Less
	less: {
		// If set to false, Less compilation will not run
		run: true,

		// An array of entry Less file paths. Must be strings.
		entry: [
			"assets/less/style.less",
		],

		// An array of output CSS file paths. Must match the entry paths.
		// Output names can contain:
		// "[name]": the entry files name
		// "[hash:5]": a random hash (with a given length)
		output: [
			"web/assets/css/style.[hash:5].css",
		],
	},

	// JS
	js: {
		// If set to false, JS compilation will not run
		run: true,

		// An array of entry JS file paths
		// See https://webpack.js.org/configuration/entry-context/#entry for
		// supported entries
		entry: {
			app: "assets/js/app.js",
		},

		// An array of output JS file paths. Must match input paths.
		// See https://webpack.js.org/configuration/output/
		// for supported output configs
		output: {
			path: process.cwd() + "/web/assets/js",
			filename: "[name].[hash:5].js",
		},
	},

	critical: {
		// If set to false, critical css will not be generated
		run: process.env.NODE_ENV === "production",

		// The base URL of the site to generate critical css from
		baseUrl: "https://dev.site.com",

		// The output directory path for generated critical CSS files
		output: "templates/_critical",

		// The critical css files and their associated URIs.
		// "_blog-post": "/blog/my-average-post"
		paths: {
			"index": "/",
		},
	},

	browserSync: {
		// If set to false, browser sync will not run
		run: process.env.NODE_ENV !== "production",

		// The URL browser sync should proxy
		proxy: "https://dev.site.com",

		// An array of additional paths to watch
		watch: [
			"templates/**/*",
		],
	},
};