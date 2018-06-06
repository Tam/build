const fs = require("fs")
	, path = require("path")
	, crypto = require("crypto")
	, config = require("./loadConfig")
	, getPath = require("./getPath")
	, ensureDirectoryExistence = require("./ensureDirectoryExistence");

let env;

if (config.hasOwnProperty("manifest")) {
	env = config["manifest"];
	
	if (env) {
		ensureDirectoryExistence(getPath(env));
		if (!fs.existsSync(env))
			fs.writeFileSync(env);
	}
}

function writeToEnv (nextFile, handle) {
	if (!env)
		return nextFile;
	
	const hashedFilename = path.basename(nextFile);
	
	handle = handle.toLowerCase().replace(/_([a-z])/g, function (g) { return g[1].toUpperCase(); }) + "Filename";
	let envData = fs.readFileSync(env).toString();
	if (!envData || envData === "undefined") {
		envData = {};
	} else {
		try {
			envData = JSON.parse(envData);
		} catch (e) {
			envData = {};
		}
	}
	
	const dir = path.dirname(nextFile);
	const prev = envData[handle];
	
	if (prev) {
		const prevFile = path.join(dir, prev);
		
		// Delete the old file (if the names are different)
		if (prevFile !== nextFile) {
			try {
				fs.unlinkSync(prevFile);
				fs.unlinkSync(prevFile + ".map");
			} catch (e) {}
		}
	}
	
	envData[handle] = hashedFilename;
	
	// Update CACHE
	envData.cacheHash = crypto.randomBytes(5).toString("hex");
	
	// Write the manifest
	fs.writeFileSync(env, JSON.stringify(envData || {}));
}

module.exports = writeToEnv;