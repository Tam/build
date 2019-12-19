const fs = require('fs')
	, path = require('path');

function ensureDirectoryExists (filePath) {
	const dirname = path.dirname(filePath);

	if (fs.existsSync(dirname))
		return true;

	ensureDirectoryExists(dirname);
	fs.mkdirSync(dirname);
}

module.exports = ensureDirectoryExists;
