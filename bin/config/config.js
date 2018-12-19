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
		baseUrl: '',
		cssUrl: '',
		output: '',
		paths: {},
	},

	browserSync: {
		run: false,
		proxy: '',
		watch: [],
	},

	fileSync: {
		run: false,
		source: '',
		target: '',
		exclude: [],
	},

	vue: {
		run: false,
		entry: {},
		output: {},
	},
};
