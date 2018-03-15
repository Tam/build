const path = require("path")
	, fs = require("fs");

const targetDir = fs.realpathSync(process.cwd());

/**
 * Get's the absolute path to the given relative path
 *
 * @param file
 * @returns {string}
 */
const getPath = file => {
	let bang = file[0] === "!";
	
	if (bang) file = file.slice(1, file.length);
	
	return (bang ? "!" : "") + path.join(targetDir, file);
};

module.exports = getPath;