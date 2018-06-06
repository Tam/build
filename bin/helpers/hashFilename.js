const crypto = require("crypto");

function hashFilename (filename, useHash = null, fileContents = null) {
	const hash = /\[hash:(\d)]/g.exec(filename);
	if (!hash)
		return filename;
	
	const h = hash[0]
		, l = +hash[1];
	
	let hashString = "";
	
	if (fileContents) {
		const hasher = crypto.createHash("sha1");
		hasher.setEncoding("hex");
		hasher.write(fileContents);
		hasher.end();
		hashString = hasher.read();
	} else {
		hashString = useHash || crypto.randomBytes(l).toString("hex");
	}
	
	return filename.replace(
		h,
		hashString.substr(0, l)
	);
}

module.exports = hashFilename;