function jsRule (config) {
	return {
		test: /\.(js)$/,
		use: {
			loader: require.resolve('babel-loader'),
			options: {
				presets: [require.resolve('@babel/preset-env')],
				plugins: [
					require.resolve("@babel/plugin-external-helpers"),
					require.resolve("@babel/plugin-syntax-dynamic-import"),
					require.resolve("@babel/plugin-proposal-class-properties"),
				],
				cacheDirectory: true,
			},
		},
		include: config.entry.path,
		exclude: /(node_modules)/,
	};
}

module.exports = jsRule;
