const config = require('./config')
	, { UI_register, UI_error } = require('./gui');

UI_register('build', 'Build');

!async function () {
	try {
		if (config.sass.run)
			await require('./sass')();
	} catch (e) {
		UI_error('build', e);
	}
}();
