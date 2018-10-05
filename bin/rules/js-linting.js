const eslintFormatter = require("../helpers/eslintFormatter");

function jsLintingRule (config, test = /\.(js)$/) {
	return {
		test,
		enforce: 'pre',
		use: {
			loader: require.resolve('eslint-loader'),
			options: {
				formatter: eslintFormatter,
				eslintPath: require.resolve("eslint"),
				baseConfig: {
					parserOptions: {
						ecmaVersion: 7,
						sourceType: "module"
					},
					extends: "eslint:recommended",
					parser: "babel-eslint",
					rules: {
						eqeqeq: [1, "smart"],
						semi: [1, "always"],
						"no-loop-func": [2],
						"no-unused-vars": [1],
						"no-console": [1],
						"no-mixed-spaces-and-tabs": [0],
					},
					env: {
						browser: true,
						es6: true,
					},
				},
			},
		},
		include: config.entry.path,
		exclude: /(node_modules)/,
	};
}

module.exports = jsLintingRule;
