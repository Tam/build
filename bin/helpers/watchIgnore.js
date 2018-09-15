const getPath = require("./getPath");

module.exports = function watchIgnore (paths) {
	return paths.map(getPath).reduce((a, b) => {
		if (b[0] === "!") a[1].push(b.slice(1, b.length));
		else a[0].push(b);
		return a;
	}, [[/* watch */], [/* ignore */]]);
};