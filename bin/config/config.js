module.exports = {
	manifest: null,

	// Less
	less: {
		run: false,
		entry: [],
		output: [],
	},

	// JS
	js: {
		run: false,
		entry: {},
		output: {},
	},

	critical: {
		run: false,
		baseUrl: "",
		output: "",
		paths: {},
	},

	browserSync: {
		run: false,
		proxy: "",
		watch: [],
	},
};