const webpack = require('webpack')
	, config = require('../config')
	, { UI_register, UI_error, UI_complete, UI_warning } = require('../gui')
	, nodeEnv = require('../helpers/getNodeEnv')
	, merge = require('webpack-merge')
	, eslintFormatter = require('../helpers/eslintFormatter')
	, BuildWebpackPlugin = require('../helpers/BuildWebpackPlugin')
	, path = require('path')
	, fs = require('fs')
	, glob = require('glob')
	, manifest = require('../manifest');

UI_register('js', 'JS');

// Variables
// =========================================================================

let previousFiles = [];

// Methods
// =========================================================================

function getCompiler () {
	// Get user-defined config
	let userConfig = config.js.config || {};

	if (typeof userConfig === 'function')
		userConfig = userConfig(webpack);

	// Configure Webpack
	return webpack(merge.smart({
		// Configure sourcemap type
		devtool: nodeEnv() === 'production' ? 'source-map' : 'cheap-module-eval-source-map',

		// Specify optimization mode
		mode: nodeEnv('development'),

		// Entry & output
		entry: config.js.entry,
		output: config.js.output,

		// Loaders
		module: {
			rules: [
				getLintingLoader(),
				getBabelLoader(),
			],
		},

		// Plugins
		plugins: [
			new BuildWebpackPlugin('js'), // Triggers UI_run
			new webpack.NamedModulesPlugin(),
			new webpack.DefinePlugin({
				'process.env': {
					NODE_ENV: JSON.stringify(nodeEnv('development')),
				},
			}),
		],

		// Node.js stuff
		node: {
			dgram: 'empty',
			fs: 'empty',
			net: 'empty',
			tls: 'empty',
			child_process: 'empty',
		},

		// Disable performance hints
		// performance: {
		// 	hints: false,
		// },

		// Tell webpack what and where to resolve files
		resolve: {
			modules: [
				// Include builds node_modules to give babel access to core-js
				path.relative(
					process.cwd(),
					path.resolve(__dirname, '../../node_modules')
				),
				'node_modules',
			],
			extensions: ['.js', '.jsx'],
		},
	}, userConfig));
}

async function callback (err, stats) {
	if (err) {
		UI_error('js', err);
		UI_complete('js');
		return;
	}

	const meta = stats.toJson();

	// Get added / removed files
	const nextFiles = meta.assets.map(a => path.join(meta.outputPath, a.name));
	previousFiles = previousFiles.filter(p => !nextFiles.includes(p));

	// Remove previously compiled files
	removePrevious();
	previousFiles = nextFiles;

	// Update the manifest
	Object.keys(meta.entrypoints).forEach(key => {
		manifest(
			key + '.js',
			meta.entrypoints[key].assets[0]
		);
	});

	// Get build information
	const info = stats.toJson('errors-only');

	// Log errors
	if (stats.hasErrors()) {
		info.errors.map(tidyWebpackMessage).forEach(e => UI_error('js', e));
		UI_complete('js');
		return;
	}

	if (stats.hasWarnings())
		info.warnings.map(tidyWebpackMessage).forEach(e => UI_warning('js', e));

	// Finish the runner
	UI_complete('js');
	// TODO: BrowserSync?
}

// Export
// =========================================================================

module.exports = async () => {
	try {
		// Remove previous files
		await removeOld(config.js.output.filename);
		await removeOld(config.js.output.chunkFilename);

		// Get webpack
		const wpk = getCompiler();

		// Run the compiler
		if (nodeEnv() === 'production')
			await wpk.run(callback);
		else
			await wpk.watch({ ignored: /node_modules/ }, callback);
	} catch (e) {
		UI_error('js', e);
	}
};

// Helpers
// =========================================================================

/**
 * Remove the given file
 *
 * @param {string} filename
 */
function removeOld (filename) {
	if (!filename || typeof filename !== 'string')
		return;

	filename = filename.replace(/\[[^\[]+]/g, '*') + '?(.map)';

	glob(filename, {
		cwd: config.js.output.path,
		absolute: true,
	}, (er, files) => {
		if (er) UI_error('js', er);
		else {
			try {
				files.forEach(fs.unlinkSync);
			} catch (e) {
				UI_error('js', e);
			}
		}
	});
}

/**
 * Remove all previous files
 */
function removePrevious () {
	try {
		for (let i = 0, l = previousFiles.length; i < l; ++i)
			if (fs.existsSync(previousFiles[i]))
				fs.unlinkSync(previousFiles[i]);
	} catch (e) {
		UI_error('js', e);
	}
}

/**
 * Make the webpack messages more readable
 *
 * @param {string} m
 * @return {string}
 */
function tidyWebpackMessage (m) {
	return m.split('\n').filter(l => (
		l.indexOf('Module Warning') === -1 &&
		l.indexOf('Module Error') === -1 &&
		l.indexOf('Module build failed') === -1 &&
		l.indexOf('at _class') === -1
	)).map(
		l => l.replace(/\t|\s{8}/g, "    ").replace(process.cwd() + "/", "")
	).filter(s => !!s).join('\n');
}

/**
 * Get the linting loader for js/jsx
 *
 * @return {{include: *, test: RegExp, use: {loader: string, options:
 *     {formatter: formatter, eslintPath: string, baseConfig: {parserOptions:
 *     {ecmaVersion: number, sourceType: string, jsx: boolean}, extends:
 *     [string], parser: string, rules: {'no-loop-func': [number],
 *     'no-unused-vars': [number], eqeqeq: [number, string],
 *     'no-mixed-spaces-and-tabs': [number], semi: [number, string],
 *     'no-console': [number]}, env: {browser: boolean, es6: boolean}}}},
 *     enforce: string, exclude: RegExp}}
 */
function getLintingLoader () {
	const use = {
		loader: require.resolve('eslint-loader'),
		options: {
			formatter: eslintFormatter,
			eslintPath: require.resolve('eslint'),
			baseConfig: {
				parserOptions: {
					ecmaVersion: 7,
					sourceType: 'module',
					jsx: true,
				},
				extends: [
					'eslint:recommended',
				],
				parser: require.resolve('babel-eslint'),
				rules: {
					eqeqeq: [1, 'smart'],
					semi: [1, 'always'],
					'no-loop-func': [2],
					'no-unused-vars': [1],
					'no-console': [1],
					'no-mixed-spaces-and-tabs': [0],
				},
				env: {
					browser: true,
					es6: true,
				},
			},
		},
	};

	if (config.js.jsx) {
		use.options.baseConfig.extends.push('plugin:react/recommended');
		use.options.baseConfig.settings = {
			react: {
				version: 'detect',
			},
		};
	}

	return {
		test: /\.jsx?$/,
		enforce: 'pre',
		use,
		include: config.js.entry.path,
		exclude: /(node_modules)/,
	};
}

/**
 * Get the babel loader
 *
 * @return {{include: *, test: RegExp, use: {loader: string, options: {presets:
 *     [[string, {useBuiltIns: boolean, targets: string}]], plugins: [[string,
 *     {helpers: boolean, corejs: boolean, useESModules: boolean, regenerator:
 *     boolean}], string, string], cacheDirectory: boolean}}, exclude: RegExp}}
 */
function getBabelLoader () {
	const use = {
		loader: require.resolve('babel-loader'),
		options: {
			presets: [
				[
					require.resolve('@babel/preset-env'),
					{
						useBuiltIns: 'usage',
						// useBuiltIns: false,
						targets: '> 1%, last 2 versions, Firefox ESR, not dead, not ie <= 11',
						corejs: 3,
					},
				],
			],
			plugins: [
				[
					require.resolve('@babel/plugin-transform-runtime'),
					{
						corejs: false,
						helpers: true,
						regenerator: true,
						useESModules: false,
					},
				],
				require.resolve('@babel/plugin-syntax-dynamic-import'),
				require.resolve('@babel/plugin-proposal-class-properties'),
			],
			cacheDirectory: true,
		},
	};

	if (config.js.jsx) {
		use.options.plugins.push(
			require.resolve('@babel/plugin-transform-react-jsx')
		);
	}

	return {
		test: /\.jsx?$/,
		use,
		include: config.js.entry.path,
		exclude: /(node_modules)\/(?!(ether-[\w\d-_]+)\/).*/,
	};
}
