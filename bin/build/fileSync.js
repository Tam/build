class FileSync {

	constructor (config, gui) {
		this.gui = gui;

		gui.message(JSON.stringify(config));
	}

}

module.exports = FileSync;
