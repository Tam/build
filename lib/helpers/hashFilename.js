const crypto = require('crypto');

module.exports = function hashFilename (filename, fileContents) {
	const hash = /\[hash:(\d+)]/g.exec(filename);
	if (!hash)
		return filename;

	const h = hash[0]
		, l = +hash[1];

	const hasher = crypto.createHash('sha1');
	hasher.setEncoding('hex');
	hasher.write(fileContents);
	hasher.end();
	let hashString = hasher.read().substr(0, l);

	return filename.replace(h, hashString);
};
