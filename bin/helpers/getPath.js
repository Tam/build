const path = require("path")
	, fs = require("fs");

const targetDir = fs.realpathSync(process.cwd());

/**
 * Get's the absolute path to the given relative path
 *
 * @param {string} file
 * @param {string=} filename
 * @returns {string}
 */
const getPath = (file = "", filename = "") => {
	if (file === "")
		return targetDir;
	
	let bang = file[0] === "!";
	
	if (bang) file = file.slice(1, file.length);
	
	if (!path.parse(file).ext && filename)
		file = path.join(file, filename);
	
	return (bang ? "!" : "") + path.join(targetDir, file);
};

module.exports = getPath;