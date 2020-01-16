const { UI_register, UI_run, UI_error, UI_message, UI_indeterminate, UI_warning } = require('../gui')
	, themeKitConfig = require('@shopify/themekit/lib/config')
	, { getFlagArrayFromObject } = require('@shopify/themekit/lib/utils')
	, path = require('path')
	, fs = require('fs')
	, { spawn } = require('child_process');

UI_register('themeKit', 'Theme Kit');

module.exports = async () => {
	UI_run('themeKit');
	UI_indeterminate('themeKit');

	try {
		const pathToExecutable = path.join(themeKitConfig.destination, themeKitConfig.binName);
		fs.statSync(pathToExecutable);

		await new Promise((resolve, reject) => {
			let errors = '';

			const child = spawn(
				pathToExecutable,
				['watch', ...getFlagArrayFromObject({ verbose: 1 })],
				{
					cwd: process.cwd(),
					stdio: 'pipe',
				},
			);

			child.stdout.setEncoding('utf8');
			child.stderr.setEncoding('utf8');

			child.on('error', err => errors += err);
			child.stderr.on('error', err => errors += err);
			child.stdout.on('data', data => {
				const messages = data.toString().trim().replace(/(\d\d:?){3}\s/g, '').split(/\r\n|\r|\n/);
				messages.forEach(m => {
					const l = m.toLowerCase();

					if (l.indexOf('error') > -1) UI_error('themeKit', m);
					else if (l.indexOf('warning') > -1) UI_warning('themeKit', m);
					else UI_message('themeKit', m);
				});
			});

			child.on('close', () => {
				if (errors) reject(errors);
				else resolve();
			});
		});
	} catch (e) {
		UI_error('themeKit', e);
	}
};
