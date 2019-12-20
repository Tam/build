const { UI_register, UI_error, UI_run, UI_complete, UI_message, UI_success } = require('../gui')
	, config = require('../config')
	, ensureDirectoryExists = require('../helpers/ensureDirectoryExists')
	, manifest = require('../manifest')
	, penthouse = require('penthouse')
	, fs = require('fs')
	, path = require('path')
	, http = require('http')
	, https = require('https')
	, chalk = require('chalk');

UI_register('critical', 'Critical');

// Constants
// =========================================================================

const FILE_RX = /\[([\w\d-_.]+)]/g;

// Variables
// =========================================================================

const cssCache = {};

const urls = Object.keys(config.critical.paths).map(tmpl => ({
	template: tmpl,
	url: path.join(config.critical.baseUrl, config.critical.paths[tmpl])
		.replace('//', '/')
		.replace(':/', '://'),
}));

// Methods
// =========================================================================

/**
 * Run the critical generation
 *
 * @return {Promise<void>}
 */
async function run () {
	// Ensure output directory exists
	ensureDirectoryExists(config.critical.output);

	// Run penthouse in 5x parallel
	await Promise.all([
		startJob(),
		startJob(),
		startJob(),
		startJob(),
		startJob(),
	]);
}

/**
 * Run the critical generation
 *
 * @return {Promise<undefined|*>}
 */
async function startJob () {
	// Get the next available URL
	const u = urls.pop();

	// If there isn't one, resolve
	if (!u)
		return;

	const { url, template } = u;

	UI_message('critical', `Starting ${template}`);

	try {
		// Get CSS string
		const targetMarkup = await getUrl(url);
		const cssString = await getCss(targetMarkup);

		if (!cssString)
			throw `CSS is empty for ${template}!`;

		// Generate Critical CSS
		const css = await penthouse({
			url,
			cssString,
			timeout: 60e3,
			width: 1300,
			height: 1500,
			forceInclude: config.critical.forceInclude,
			forceExclude: config.critical.forceExclude,
		});

		// Write the CSS to the output dir
		fs.writeFileSync(
			path.join(config.critical.output, `${template}.css`),
			css
		);

		UI_success('critical', `Finished ${template}`);
	} catch (e) {
		UI_error('critical', e);
	}

	// Continue until we run out of URLs
	return startJob();
}

// Export
// =========================================================================

module.exports = async () => {
	UI_run('critical');

	try {
		// Fix invalid SSL cert errors
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

		// Run critical
		await run();
	} catch (e) {
		UI_error('critical', e);
	}

	UI_complete('critical');
};

// Helpers
// =========================================================================

/**
 * Get the given URL
 *
 * @param {string} url
 * @return {Promise<number|string|Error>}
 */
function getUrl (url) {
	return new Promise((resolve, reject) => {
		const req = (~url.indexOf('https:') ? https : http).get(url);

		req.on('response', res => {
			if (res.statusCode < 200 || res.statusCode >= 400)
				return reject(chalk.bold.red(res.statusCode) + ' ' + url);

			let body = '';
			res.on('data', function(chunk) {
				body += chunk;
			});
			res.on('end', function() {
				resolve(body);
			});
		});

		req.on('error', err => reject(err));
	});
}

/**
 * Get CSS
 *
 * @param markup
 * @return {Promise<number|string|Error|*>}
 */
async function getCss (markup) {
	let urls = config.critical.cssUrl;

	if (!Array.isArray(urls))
		urls = [urls];

	for (let i = 0, l = urls.length; i < l; i++) {
		let url = urls[i];

		// Replace tokens with value from manifest
		if (url.indexOf('[') > -1)
			url = url.replace(FILE_RX, (_, key) => manifest.read(key));

		// Make relative URLs absolute
		if (url.indexOf('://') === -1)
			url = path.join(config.critical.baseUrl, url);

		// Fix slashes
		url = url.replace('//', '/').replace(':/', '://');

		// Skip if the url doesn't appear in the target markup
		if (markup.indexOf(url) === -1)
			continue;

		// Get and cache the CSS
		try {
			if (cssCache.hasOwnProperty(url))
				return cssCache[url];

			let css = await getUrl(url);

			// Normalize relative URLs
			const dir = url.substring(0, url.lastIndexOf('/')) + '/'
				, regex = /url\(\s*['"]?\/?(.+?)['"]?\s*\)/ig;

			let m;

			while ((m = regex.exec(css)) !== null) {
				if (m.index === regex.lastIndex)
					regex.lastIndex++;

				m.forEach((match, groupIndex) => {
					if (groupIndex !== 1)
						return;

					if (~match.indexOf('./')) {
						css = css.replace(
							match,
							new URL(dir + match).pathname
						);
					}
				});
			}

			cssCache[url] = css;
			return css;
		} catch (e) {
			UI_error('critical', e);
		}
	}

	return '';
}
