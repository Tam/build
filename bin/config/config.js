module.exports = {
	// The filename of the manifest file. If set to null, not manifest will
	// generate.
	manifest: null,

	// Less
	less: {
		// If set to false, Less compilation will not run
		run: false,

		// An array of entry Less file paths. Must be strings.
		entry: [],

		// An array of output CSS file paths. Must match the entry paths.
		// Output names can contain:
		// "[name]": the entry files name
		// "[hash:5]": a random hash (with a given length)
		output: [],
	},

	// JS
	js: {
		// If set to false, JS compilation will not run
		run: false,

		// An array of entry JS file paths
		// See https://webpack.js.org/configuration/entry-context/#entry for
		// supported entries
		entry: {},

		// An array of output JS file paths. Must match input paths.
		// See https://webpack.js.org/configuration/output/
		// for supported output configs
		output: {},
	},

	critical: {
		// If set to false, critical css will not be generated
		run: false,

		// The base URL of the site to generate critical css from
		baseUrl: "",

		// The output directory path for generated critical CSS files
		output: "",

		// The critical css files and their associated URIs.
		// "_blog-post": "/blog/my-average-post"
		paths: {},
	},

	browserSync: {
		// If set to false, browser sync will not run
		run: false,

		// The URL browser sync should proxy
		proxy: "",

		// An array of additional paths to watch
		watch: [],
	},
};