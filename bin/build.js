#!/usr/bin/env node

const onExit = require('signal-exit');

!function () {
	process.title = 'build';

	// Hide the caret, restore on exit
	process.stdout.write('\u001B[?25l');
	onExit(() => {
		process.stdout.write('\u001B[?25h');
	});

	switch (process.argv[2]) {
		case 'init':
			// Show the caret
			process.stdout.write('\u001B[?25h');
			require('../lib/init');
			return;
		case 'once':
		case 'prod':
		case 'p':
			process.env.NODE_ENV = 'production';
			require('../lib/build');
			return;
		default:
			require('../lib/build');
	}
}();
