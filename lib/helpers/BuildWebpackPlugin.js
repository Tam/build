const { UI_run, UI_message } = require('../gui');

class BuildWebpackPlugin {

	constructor (runner) {
		this.runner = runner;
	}

	apply (compiler) {
		compiler.hooks.beforeCompile.tapAsync('BuildWebpackPlugin', (compiler, callback) => {
			UI_run(this.runner);
			UI_message('js', 'Compiling JS');
			callback();
		});
	}

}

module.exports = BuildWebpackPlugin;
