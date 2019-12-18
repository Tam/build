const chalk = require('chalk')
	, textTable = require('text-table')
	, prettyTime = require('pretty-hrtime')
	, stripAnsi = require('strip-ansi');

// Constants
// =========================================================================

const NL_RX = /\r\n|\r|\n/;

// Variables
// =========================================================================

const runnerNames = {};

const data = {
	runners: {},
	messages: [],
};

// Render
// =========================================================================

/*****************************************************************/
/* ○  Less      253ms                                            */
/* ►  JS        500ms                                            */
/* ✓  Sass      153ms                                            */
/* !  Copy      15ms                                             */
/* ✘  Critical  1.5m                                             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */
/* 10:38:02 - ○ Less :: Message goes here                        */
/* 10:37:44 - ✘ JS ::                                            */
/* Multi-line error message here                                 */
/*      ^ there was a hyphen                                     */
/*****************************************************************/

// Re-render on terminal resize
process.stdout.on('resize', render);

/**
 * Render the UI
 */
function render () {
	const { columns, rows } = process.stdout;
	let availableRows = rows;
	let output = [];

	// Runners
	const runners = []
		, runKeys = Object.keys(data.runners);

	for (let i = 0, l = runKeys.length; i < l; i++) {
		const key = runKeys[i];
		const runner = data.runners[key];

		let icon = chalk.bold.gray('○'),
			time = chalk.gray('Not run');

		if (runner.running) icon = chalk.bold.yellow('►');
		else if (runner.errors > 0) icon = chalk.bold.red('✘');
		else if (runner.warnings > 0) icon = chalk.bold.yellow('!');
		else if (runner.duration) icon = chalk.bold.green('✓');

		if (runner.duration)
			time = chalk.cyanBright(prettyTime(runner.duration));

		runners.push([
			icon,
			runnerNames[key],
			time,
		]);

		availableRows--;
	}

	output.push(textTable(runners, {
		align: ['l', 'l', 'l'],
		stringLength: str => stripAnsi(str).length,
	}));

	// Divider
	availableRows--;
	output.push(chalk.gray(Array.from(
		{ length: Math.floor(columns / 2) },
		() => '-').join(' ')
	));

	// Messages
	let i = data.messages.length;
	while (i--) {
		if (availableRows < 1)
			break;

		const { key, message, type, time } = data.messages[i];
		let m = chalk.grey(formatTime(time)) + ' ';

		switch (type) {
			default:
			case 'message':
				m += chalk.bold.blue('○ ' + runnerNames[key]);
				break;
			case 'warning':
				m += chalk.bold.yellow('! ' + runnerNames[key]);
				break;
			case 'error':
				m += chalk.bold.red('✘ ' + runnerNames[key]);
				break;
		}

		m += chalk.grey(' :: ');

		if (NL_RX.exec(message)) {
			const splitMessage = message.split(NL_RX);
			const maxLen = columns - 1;
			let hasLong = false;
			for (let j = 0, x = splitMessage.length; j < x; j++) {
				if (stripAnsi(splitMessage[j] || '').length > maxLen) {
					hasLong = true;
					break;
				}
			}

			if (hasLong) {
				m += '\n' + splitMessage.map(s => {
					const l = stripAnsi(s).length;

					if (l < maxLen)
						return pad(s, maxLen) + chalk.grey('>');

					return s.substr(0, maxLen) + chalk.grey('>');
				}).join('\n');
			} else {
				m += '\n' + message;
			}

			availableRows -= m.split(NL_RX).length;
		} else {
			m += message;
			availableRows -= Math.ceil(stripAnsi(m).length / columns);
		}

		if (availableRows < 0) {
			const lines = m.split(NL_RX);
			const r = availableRows * -1;
			lines.splice(-r, r);
			m = lines.join('\n');

			availableRows = 0;
		}

		output.push(m);
	}

	// Pad bottom
	while (--availableRows > 0)
		output.push('');

	// Redraw the console
	//  \033c == First clear (windows)
	//  \u001B[?25l == Hide caret
	//  \033[2J == Second clear (UNIX) and move caret to 0,0
	process.stdout.write('\033c\u001B[?25l\033[2J' + output.join('\n'));
}

// UI Methods
// =========================================================================

/**
 * Register a runner
 *
 * @param {string} key - The runners key / handle
 * @param {string} name - The user facing name
 */
function UI_register (key, name) {
	runnerNames[key] = name;
}

/**
 * Start the runner
 *
 * @param {string} key - Runner handle
 */
function UI_run (key) {
	data.runners[key] = {
		running: true,
		errors: 0,
		warnings: 0,
		startTime: process.hrtime(),
		duration: data.runners[key] || null,
	};

	render();
}

/**
 * Stop the runner
 *
 * @param {string} key - Runner handle
 */
function UI_complete (key) {
	data.runners[key] = {
		...data.runners[key],
		running: false,
		startTime: null,
		duration: process.hrtime(data.runners[key].startTime),
	};

	render();
}

/**
 * Post a message
 *
 * @param {string} key - Runner handle
 * @param {string} message - The message
 */
function UI_message (key, message) {
	data.messages.push({ key, message, type: 'message', time: Date.now() });
	render();
}

/**
 * Post a warning
 *
 * @param {string} key - Runner handle
 * @param {string} message - The warning
 */
function UI_warning (key, message) {
	data.messages.push({ key, message, type: 'warning', time: Date.now() });

	if (data.runners[key])
		data.runners[key].warnings++;

	render();
}

/**
 * Post an error
 *
 * @param {string} key - Runner handle
 * @param {string|Error} message - The error message
 */
function UI_error (key, message) {
	message = formatError(message);
	data.messages.push({ key, message, type: 'error', time: Date.now() });

	if (data.runners[key])
		data.runners[key].errors++;

	render();
}

// Helpers
// =========================================================================

/**
 * Convert the given error message into a friendly format
 *
 * @param {string|Error} err
 * @return {string}
 */
function formatError (err) {
	if (typeof err === 'string')
		return err.replace('        ', '    ');

	let e = err.message;

	if (err.hasOwnProperty('file'))
		e += ' ' + err.file;

	if (err.hasOwnProperty('line') && err.hasOwnProperty('column'))
		e += ` (${err.line}:${err.column})`;

	if (err.hasOwnProperty('extract')) {
		const extract = Array.isArray(err.extract) ? err.extract : err.extract.split('\n')
			, formattedExtract = [];

		e += "\n\n";

		const l = extract.length
			, eh = Math.ceil((l % 2 === 0 ? l + 1 : l) / 2)
			, ln = err.line - eh
			, lnl = (String(err.line + eh)).length + 1;

		for (let i = 0; i < l; ++i) {
			const line = extract[i];

			if (typeof line === 'undefined')
				continue;

			let f, num = pad(String(ln + i), lnl);

			if (i + 1 === Math.ceil((l % 2 === 0 ? l + 1 : l) / 2))
				f = chalk.bgBlackBright(chalk.white(num) + line);
			else
				f = chalk.grey(num) + line;

			formattedExtract.push(f);
		}

		e += formattedExtract.join('\n');
	}

	return e;
}

/**
 * Pad the given string to the given length
 *
 * @param {string} n - The string to pad
 * @param {number} width - Then length to pad it to
 * @return {string}
 */
function pad (n, width) {
	return n.length >= width
		? n
		: n + new Array(width - n.length + 1).join(' ');
}

/**
 * Format the given UNIX time into a readable string
 *
 * @param {number|Date} time
 * @return {string}
 */
function formatTime (time) {
	time = new Date(time);

	let h = time.getHours(),
		m = time.getMinutes(),
		s = time.getSeconds();

	if (h < 10) h = '0' + h;
	if (m < 10) m = '0' + m;
	if (s < 10) s = '0' + s;

	return `${h}:${m}:${s}`;
}

// Export
// =========================================================================

module.exports = {
	UI_register,
	UI_run,
	UI_complete,
	UI_message,
	UI_warning,
	UI_error,
};
