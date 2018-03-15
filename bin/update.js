const https = require("https")
	, chalk = require("chalk")
	, compareVersions = require("compare-versions")
	, version = require("../package").version;

/**
 * Check for a new version
 */
https.get({
	host: "raw.githubusercontent.com",
	path: encodeURI("/Tam/build/master/package.json?c=" + (new Date())),
	timeout: 500, // Timeout after 1s to prevent any hanging
}, resp => {
	let data = '';
	
	// A chunk of data has been received.
	resp.on('data', (chunk) => {
		data += chunk;
	});
	
	// The whole response has been received. Print out the result.
	resp.on('end', () => {
		const newVersion = JSON.parse(data).version;
		
		if (compareVersions(newVersion, version) === 1) {
			const g = chalk.green
				, c = chalk.bold.cyan;
			
			console.log(g("╔═════════════════════════════╗"));
			console.log(g("║") + "    An update is available   " + g("║"));
			console.log(g("║") + c("      npm i -g tam/build     ") + g("║"));
			console.log(g("║") + "              or             " + g("║"));
			console.log(g("║") + c("  yarn global add tam/build  ") + g("║"));
			console.log(g("╚═════════════════════════════╝"));
		}
	});
});