const chalk = require('chalk')
	, textTable = require('text-table')
	, prettyTime = require('pretty-hrtime')
	, stripAnsi = require('strip-ansi')
	, sliceAnsi = require('slice-ansi')
	, wrapAnsi = require('wrap-ansi');

// Constants
// =========================================================================

const NL_RX = /\r\n|\r|\n/
	, BUFFER_LIMIT = 100;

// Variables
// =========================================================================

const runnerNames = {};
let messageBuffer = [],
	bufferOffset = 0;

const data = {
	runners: {},
	messages: [],
};

// TODO: Buffer navigation
//  - [x]  }         =  Jump up 5 lines
//  - [x]  {         =  Jump down 5 lines
//  - [x]  \u001b[A  =  Jump up 1 line
//  - [x]  \u001b[B  =  Jump down 1 line
//  - [ ]  \u001b[C  =  Move horizontal overflow right by 5 characters (?)
//  - [ ]  \u001b[D  =  Move horizontal overflow left by 5 characters (?)

// Events
// =========================================================================

// Re-render on terminal resize
process.stdout.on('resize', () => generateBuffer());

// Handle input
const stdin = process.openStdin();
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');
stdin.on( 'data', key => {
	switch (key) {
		case '\u0003': // ctrl-c (end of text)
			process.exit();
			break;
		case '{': // Shift + [
			bufferOffset += 5;
			break;
		case '}': // Shift + ]
			bufferOffset -= 5;
			break;
		case '\u001b[A': // Up arrow
		case 'k': // Up arrow
			bufferOffset -= 1;
			break;
		case '\u001b[B': // Down arrow
		case 'j': // Down arrow
			bufferOffset += 1;
			break;
		// default:
		// 	UI_message('build', JSON.stringify(key));
	}

	if (bufferOffset < 0)
		bufferOffset = 0;
	else if (bufferOffset > messageBuffer.length - 2)
		bufferOffset = messageBuffer.length - 2;

	render();
});

// Methods
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
		else if (runner.indeterminate) {
			icon = chalk.bold.keyword('orange')('~');
			time = '';
		}

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
	const bl = messageBuffer.length;
	let rc = availableRows;

	if (availableRows > bl)
		rc = bl;

	availableRows -= rc;
	output.push(...messageBuffer.slice(bufferOffset, rc + bufferOffset));

	// Pad bottom
	while (--availableRows > 0)
		output.push('');

	// Redraw the console
	//  \033c == First clear (windows)
	//  \u001B[?25l == Hide caret
	//  \033[2J == Second clear (UNIX) and move caret to 0,0
	process.stdout.write('\033c\u001B[?25l\033[2J' + output.join('\n'));
}

/**
 * Generate the log buffer
 */
function generateBuffer () {
	const { columns } = process.stdout;

	// Clear the buffer & reset the offset
	messageBuffer = [];
	bufferOffset = 0;

	// Crop our stored messages
	const l = data.messages.length;
	if (l > BUFFER_LIMIT)
		data.messages = data.messages.slice(l - BUFFER_LIMIT, l);

	// Loop over the messages and format & add them to the message buffer
	let i = data.messages.length;
	while (i--) {
		const { key, message, type, time } = data.messages[i];
		let m = chalk.grey(formatTime(time)) + ' ';

		switch (type) {
			default:
			case 'message':
				m += chalk.bold.blue('○ ' + runnerNames[key]);
				break;
			case 'success':
				m += chalk.bold.green('✓ ' + runnerNames[key]);
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
				if (getStringLength(splitMessage[j] || '') > maxLen) {
					hasLong = true;
					break;
				}
			}

			if (hasLong) {
				m += '\n' + splitMessage.map(s => {
					const l = getStringLength(s);

					if (l < maxLen)
						return pad(s, maxLen) + chalk.grey('→');

					return sliceAnsi(s, 0, maxLen) + chalk.grey('→');
				}).join('\n');
			} else {
				m += '\n' + message;
			}
		} else {
			m += message;
		}

		// Add the messages to the buffer
		messageBuffer.push(...wrapAnsi(m, columns, { hard: true }).split(NL_RX));
	}

	messageBuffer.push(chalk.grey('[end of buffer]'));
	render();
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
	const isNew = !data.runners.hasOwnProperty(key);

	data.runners[key] = {
		running: true,
		indeterminate: false,
		errors: 0,
		warnings: 0,
		startTime: process.hrtime(),
		duration: data.runners[key] || null,
	};

	isNew && generateBuffer();
}

/**
 * Will mark the runner as indeterminate
 *
 * @param {string} key - Runner handle
 */
function UI_indeterminate (key) {
	data.runners[key] = {
		...data.runners[key],
		running: false,
		indeterminate: true,
		duration: null,
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
	generateBuffer();
}

/**
 * Post a success message
 *
 * @param {string} key - Runner handle
 * @param {string} message - The success message
 */
function UI_success (key, message) {
	data.messages.push({ key, message, type: 'success', time: Date.now() });
	generateBuffer();
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

	generateBuffer();
}

/**
 * Post an error
 *
 * @param {string} key - Runner handle
 * @param {string|Error} message - The error message
 */
function UI_error (key, message) {
	if (typeof message === 'string' && message.indexOf('NODE_TLS_REJECT_UNAUTHORIZED') > -1)
		return;

	message = formatError(message);
	data.messages.push({ key, message, type: 'error', time: Date.now() });

	if (data.runners[key])
		data.runners[key].errors++;

	generateBuffer();
}

// Helpers
// =========================================================================

/**
 * Convert the given error message into a friendly format
 *
 * @param {string|Error|Array} err
 * @return {string}
 */
function formatError (err) {
	if (Array.isArray(err))
		err = err.join('\n');

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

		const l = getStringLength(extract)
			, eh = Math.ceil((l % 2 === 0 ? l + 1 : l) / 2)
			, ln = err.line - eh
			, lnl = getStringLength(String(err.line + eh)) + 1;

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

	if (err.hasOwnProperty('stack'))
		e += '\n' + err.stack;

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
	const l = getStringLength(n);
	return l >= width
		? n
		: n + new Array(width - l + 1).join(' ');
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

/**
 * Returns the length of the string, stripping Ansi & setting the tab stop
 *
 * @param {string} s
 * @return {number}
 */
function getStringLength (s) {
	return stripAnsi(tabStop(s)).length || 0;
}

/**
 * Replaces all tab characters with 4 spaces
 *
 * @param {string} s
 * @return {string}
 */
function tabStop (s) {
	return s.replace(/\t/g, '    ');
}

// Export
// =========================================================================

module.exports = {
	UI_register,
	UI_run,
	UI_indeterminate,
	UI_complete,
	UI_message,
	UI_success,
	UI_warning,
	UI_error,
};
