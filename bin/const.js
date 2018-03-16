const STATUSES = {
	WORKING: "working",
	SUCCESS: "success",
	WARNING: "warning",
	FAILURE: "failure",
};

const consts = {
	config: {
		".env": null,
		less: {
			ignore: false,
			input:  "public/assets/less/style.less",
			output: "public/assets/css/style.css",
			watch:  ["public/assets/less/**/*"],
		},
		js: {
			ignore: false,
			input: "public/assets/js/app.js",
			output: "bundle.js",
			watch:  [
				"public/assets/js/**/*.js",
				"!public/assets/js/**/bundle.js",
			],
		},
		critical: {
			ignore: false,
			base: "LOCAL_URL.dev",
			output: "craft/templates/_critical",
			paths: {
				"_templateName": "url/to/template",
			},
		},
		browserSync: {
			ignore: false,
			proxy: "LOCAL_URL.dev",
			watch: ["craft/templates/**/*"],
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