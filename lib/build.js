const config = require('./config')
	, { UI_register, UI_error } = require('./gui');

UI_register('build', 'Build');

!async function () {
	try {
		const syncRunners = [];

		if (config.sass.run)
			syncRunners.push(require('./sass')());

		if (config.less.run)
			syncRunners.push(require('./less')());

		if (config.js.run)
			syncRunners.push(require('./js')());

		await Promise.all(syncRunners);

		// TODO: Critical should be called here
	} catch (e) {
		UI_error('build', e);
	}
}();
