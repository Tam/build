const config = require('./config')
	, { UI_register, UI_error, UI_message, UI_warning } = require('./gui');

UI_register('build', 'Build');

console.log = (...args) => UI_message('build', args.join(' '));
console.warn = (...args) => UI_warning('build', args.join(' '));
console.error = (...args) => UI_error('build', args.join(' '));

!async function () {
	try {
		const syncRunners = [];

		if (config.sass.run)
			syncRunners.push(require('./sass')());

		if (config.less.run)
			syncRunners.push(require('./less')());

		if (config.js.run)
			syncRunners.push(require('./js')());

		if (config.copy.run)
			syncRunners.push(require('./copy')());

		await Promise.all(syncRunners);

		if (config.critical.run)
			await require('./critical')();
	} catch (e) {
		UI_error('build', e);
	}
}();
