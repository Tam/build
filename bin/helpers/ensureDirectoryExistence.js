const fs = require("fs")
	, path = require("path");

function ensureDirectoryExistence (filePath) {
	const dirname = path.dirname(filePath);
	if (fs.existsSync(dirname))
		return true;
	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname);
}

module.exports = ensureDirectoryExistence;