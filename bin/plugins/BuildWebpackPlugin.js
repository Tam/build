class BuildWebpackPlugin {

	constructor (gui) {
		this.gui = gui;
	}

	apply (compiler) {
		compiler.hooks.beforeCompile.tapAsync('BuildWebpackPlugin', (compiler, callback) => {
			this.gui.run();
			callback();
		});
	}

}

module.exports = BuildWebpackPlugin;