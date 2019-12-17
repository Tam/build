const data = {
	messages: [],
};

function render () {
	// Clear console
	process.stdout.write(
		process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
	);

	// TODO: render the UI
	// TODO: Re-render on terminal resize
}

function UI_run (key) {
	// TODO: Start the run timer (clear warnings / errors)

	render();
}

function UI_complete (key) {
	// TODO: Finish the run timer

	render();
}

function UI_message (key, message) {
	// TODO: Show a message (add to a running log, shown at the bottom of the
	//  terminal, that isn't cleared but changes height depending on the
	//  warnings / errors shown)
	data.messages.push({ key, message });

	render();
}

function UI_warning (key, warning) {
	// TODO: Show a warning message

	render();
}

function UI_error (key, error) {
	// TODO: Show an error message

	render();
}

module.exports = {
	UI_run,
	UI_complete,
	UI_message,
	UI_warning,
	UI_error,
};
