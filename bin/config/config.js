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
		jsx: false,
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

	copy: {
		run: false,
		basePath: '',
		paths: {},
	}
};
