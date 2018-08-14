const STATUSES = {
	WORKING: "working",
	SUCCESS: "success",
	WARNING: "warning",
	FAILURE: "failure",
};

const consts = {
	config: {
		"manifest": "manifest.json",
		less: {
			ignore: false,
			input: "assets/less/style.less",
			output: "web/assets/css/style.[hash:5].css",
			watch: [
				"assets/less/**/*"
			]
		},
		js: {
			ignore: false,
			input: "assets/js/app.js",
			output: "web/assets/js/app.[hash:5].js",
			watch:  [
				"assets/js/**/*.js"
			],
		},
		critical: {
			ignore: true,
			base: "LOCAL_URL.dev",
			output: "templates/_critical",
			paths: {
				"index": "/",
			},
		},
		browserSync: {
			ignore: false,
			proxy: "LOCAL_URL.dev",
			watch: [
				"templates/**/*"
			],
		},
	},
	
	STATUSES,
	
	DEFAULT_STAT: {
		name: "",
		ignored: false,
		status: STATUSES.SUCCESS,
		errors: "",
		warnings: "",
		time: "",
		
		file: "",
		line: "",
		column: "",
		extract: "",
	},
};

module.exports = consts;
