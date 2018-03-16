const fs = require("fs")
	, path = require("path")
	, crypto = require("crypto")
	, config = require("./loadConfig")
	, getPath = require("./getPath")
	, ensureDirectoryExistence = require("./ensureDirectoryExistence");

let env;

if (config.hasOwnProperty(".env")) {
	env = config[".env"];
	ensureDirectoryExistence(getPath(env));
	if (!fs.existsSync(env))
		fs.writeFileSync(env);
}

function writeToEnv (nextFile, handle) {
	if (!env)
		return nextFile;
	
	const hashedFilename = path.basename(nextFile);
	
	handle = handle.toUpperCase() + "_FILENAME";
	let envData = fs.readFileSync(env).toString();
	if (!envData || envData === "undefined")
		envData = "";
	const regex = new RegExp(`${handle}="([^"]*)"`, "g");
	const match = regex.exec(envData);
	const dir = path.dirname(nextFile);
	const nextName = handle + `="${hashedFilename}"`;
	
	if (match) {
		if (match[1] !== hashedFilename) {
			envData = envData.replace(match[0], nextName);
			const prevFile = path.join(dir, match[1]);
			try {
				fs.unlinkSync(prevFile);
				fs.unlinkSync(prevFile + ".map");
			} catch (e) {}
		}
	} else {
		envData += "\r\n" + nextName;
	}
	
	// Update CACHE
	const cacheHandle = "CACHE_HASH";
	const cacheHash = `${cacheHandle}="${crypto.randomBytes(5).toString("hex")}"`;
	const cacheRegex = new RegExp(`${cacheHandle}="([^"]*)"`, "g");
	const cacheMatch = cacheRegex.exec(envData);
	
	if (cacheMatch) {
		envData = envData.replace(cacheMatch[0], cacheHash);
	} else {
		envData += "\r\n" + cacheHash;
	}
	
	// Write the .env
	fs.writeFileSync(env, envData);
}

module.exports = writeToEnv;