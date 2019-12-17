#!/usr/bin/env node

!function () {
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
