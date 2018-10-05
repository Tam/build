const WebpackDevServer = require("webpack-dev-server")
	, webpack = require("webpack")
	, jsLinting = require("../rules/js-linting")
	, jsRule = require("../rules/js")
	, VueLoaderPlugin = require('vue-loader/lib/plugin')
	, BuildWebpackPlugin = require("../plugins/BuildWebpackPlugin")
	, autoprefixer = require("autoprefixer");

class Vue {

	constructor (config, gui, reload, manifest) {
		const internalConfig = {
			devtool: isProd ? "source-map" : "cheap-module-source-map",

			mode: process.env.NODE_ENV || "development",

			entry: config.entry,
			output: config.output,

			module: {
				rules: [
					// Vue
					{
						test: /\.vue$/,
						loader: require.resolve('vue-loader'),
					},

					// Linting
					jsLinting(config, /\.(js|vue)$/),

					// JS
					jsRule(config),

					// Less
					{
						test: /\.(le|c)ss/,
						use: [
							require.resolve("vue-style-loader"),
							{
								loader: require.resolve("css-loader"),
								options: {
									importLoaders: 1,
									modules: true,
									localIdentName: "[local]_[hash:base64:5]",
								}
							},
							{
								loader: require.resolve("postcss-loader"),
								options: {
									ident: 'postcss',
									plugins: () => [
										require("postcss-flexbugs-fixes"),
									],
								},
							},
							require.resolve("less-loader"),
							{
								loader: require.resolve("postcss-loader"),
								options: {
									ident: 'postcss',
									plugins: () => [
										autoprefixer({
											browsers: [
												'>1%',
												'last 4 versions',
												'Firefox ESR',
												'not ie < 9',
											],
											flexbox: 'no-2009',
										}),
									],
								},
							},
						],
					},
				],
			},

			plugins: [
				new VueLoaderPlugin(),
				new BuildWebpackPlugin(gui),
				new webpack.NamedModulesPlugin(),
				new webpack.DefinePlugin({
					'process.env': {
						NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development")
					}
				}),
			],

			node: {
				dgram: 'empty',
				fs: 'empty',
				net: 'empty',
				tls: 'empty',
				child_process: 'empty',
			},

			performance: {
				hints: false,
			},
		};

		const options = {
			contentBase: '/',
			hot: true,
			host: 'localhost',
		};

		WebpackDevServer.addDevServerEntrypoints(internalConfig, options);

		const compiler = webpack(internalConfig);
		const server = new WebpackDevServer(compiler, options);
		server.listen(8000, options.host, () => {
			gui.message("Hot https://localhost:8000/");
		});
	}

}

module.exports = Vue;
