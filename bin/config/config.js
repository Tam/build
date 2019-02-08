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
		config: {},
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

	vue: {
		run: false,
		entry: {},
		output: {},
	},
};
