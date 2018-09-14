function render () {
	// TODO: re-render the screen
}

class OutputProcess {

	name = "";

	_running = false; // Is currently running?
	_ignored = false; // Is ignored?
	_messages = []; // Any non-error messages (i.e. critical progress)
	_errors = []; // Any errors

	constructor (name) {
		this.name = name;
	}

	get running () { return this._running }
	set running (value) { this._running = value; render() }

	get ignored () { return this._ignored }
	set ignored (value) { this._ignored = value; render() }

	get messages () { return this._messages }
	set messages (value) { this._messages = value; render() }

	get errors () { return this._errors }
	set errors (value) { this._errors = value; render() }

}

const output = {
	less: new OutputProcess("Less"),
	js: new OutputProcess("JS"),
	critical: new OutputProcess("Critical"),
};