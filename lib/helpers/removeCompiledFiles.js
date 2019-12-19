const path = require('path')
	, fs = require('fs');

function removeCompiledFiles (outputPath) {
	const name = path.basename(outputPath)
		, dir  = path.dirname(outputPath);

	const hash = /\[hash:(\d+)]/g.exec(name);
	let regex;

	const output = name.replace(/\./g, "\\.");

	if (hash) {
		regex = new RegExp("^" + output.replace(
			hash[0],
			"[a-z\\d]{" + hash[1] + "}"
		) + "(\\.map)?$");
	} else {
		regex = new RegExp("^" + output + "(\\.map)?$");
	}

	const files = fs.readdirSync(dir).filter(name => regex.test(name));

	for (let i = 0, l = files.length; i < l; ++i)
		fs.unlinkSync(path.join(dir, files[i]));
}

module.exports = removeCompiledFiles;
