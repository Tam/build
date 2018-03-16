const crypto = require("crypto");

function hashFilename (filename) {
	const hash = /\[hash:(\d)]/g.exec(filename);
	if (!hash)
		return;
	
	const h = hash[0]
		, l = +hash[1];
	
	return filename.replace(
		h,
		crypto.randomBytes(l).toString("hex").substr(0, l)
	);
}

module.exports = hashFilename;