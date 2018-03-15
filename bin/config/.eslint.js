module.exports = {
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
		"no-console": [1],
		"no-mixed-spaces-and-tabs": [0],
	},
	env: {
		browser: true,
		es6: true,
	},
};