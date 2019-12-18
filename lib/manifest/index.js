const fs = require('fs')
	, config = require('../config')
	, { UI_register, UI_error, UI_message } = require('../gui');

UI_register('manifest', 'Manifest');

// Variables
// =========================================================================

let manifest = null;

// Methods
// =========================================================================

/**
 * Load the manifest (or create a new one)
 */
function read () {
	try {
		if (fs.existsSync(config.manifest)) {
			// If a manifest file exists, load it
			const stringManifest = fs.readFileSync(config.manifest, 'utf8');

			if (stringManifest === '') {
				manifest = {};
			} else {
				manifest = JSON.parse(stringManifest);
			}

			UI_message('manifest', 'Loaded manifest.json');
		} else {
			// Otherwise create a new one
			manifest = {};
			write();
			UI_message('manifest', 'Created manifest.json');
		}
	} catch (e) {
		UI_error('manifest', e);
	}
}

/**
 * Write to the manifest
 *
 * @param {string|null} key
 * @param {string|null} value
 */
function write (key = null, value = null) {
	if (key) manifest[key] = value;
	fs.writeFileSync(
		config.manifest,
		JSON.stringify(manifest)
	);
}

// Export
// =========================================================================

if (config.manifest !== null) {
	// Load the manifest
	read();
	module.exports = write;
} else {
	// If manifest is disabled, do nothing
	module.exports = () => {};
}
