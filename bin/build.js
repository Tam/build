#!/usr/bin/env node

const onExit = require('signal-exit');

!function () {
	process.title = 'build';

	// Restore the cursor (if hidden elsewhere)
	onExit(() => {
		process.stdout.write('\u001B[?25h');
	});

	switch (process.argv[2]) {
		case 'init':
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
