const lessConfig = require("../helpers/loadConfig").less
	, STATUSES = require("../const").STATUSES
	, getPath = require("../helpers/getPath")
	, ensureDirectoryExistence = require("../helpers/ensureDirectoryExistence")
	, trackTime = require("../helpers/trackTime")()
	, hashFilename = require("../helpers/hashFilename")
	, env = require("../helpers/env")
	, output = require("../output")
	, less = require("less")
	, postcss = require("postcss")
	, fs = require("fs")
	, path = require("path");

const autoprefixer = require("autoprefixer")
	, flexBugsFixes = require("postcss-flexbugs-fixes")
	, customProperties = require("postcss-custom-properties")
	, cssnano = require("cssnano");

const i = getPath(lessConfig.input)
	, oo = getPath(lessConfig.output, "style.css");

const localPath = path.dirname(i);
const clearAbsPath = s => s.replace(localPath + "/", "");

module.exports = {
	run: function (reload) {
		if (output.stats.less.status === STATUSES.WORKING)
			return;
		
		// Generate new hashed filename
		const o = hashFilename(oo);
		
		trackTime.start();
		
		output.updateStats("less", {
			status: STATUSES.WORKING,
		});
		
		let rawLess;
		
		try {
			rawLess = fs.readFileSync(i).toString();
		} catch (err) {
			output.updateStats("less", {
				status: STATUSES.FAILURE,
				errors: err.message,
				time: trackTime.stop(),
			});
			return;
		}
		
		// Manually clear LESS caches
		// Temp fix for https://github.com/less/less.js/issues/3185
		const fileManagers = less.environment && less.environment.fileManagers || [];
		fileManagers.forEach(fileManager => {
			if (fileManager.contents)
				fileManager.contents = {};
		});
		
		// 1. Compile the LESS
		less.render(rawLess, {
			paths: [localPath],
			relativeUrls: true,
			sourceMap: {},
			filename: path.basename(i),
		}).then(({ css, map }) => {
			// Make source map paths relative
			map = JSON.parse(map);
			map.sources = map.sources.map(clearAbsPath);
			map = JSON.stringify(map);
			
			// 2. Run through PostCSS
			postcss([
				flexBugsFixes,
				customProperties({ preserve: true }),
				autoprefixer({
					browsers: [
						">1%",
						"last 4 versions",
						"Firefox ESR",
						"not ie < 9",
					],
					flexbox: "no-2009",
				}),
				cssnano,
			]).process(css, {
				from: i,
				to: o,
				map: {
					inline: false,
					prev: map,
				},
			}).then(({ css, map }) => {
				ensureDirectoryExistence(o);
				// We have to manually add the souremap url for some reason
				fs.writeFileSync(o, css + `\r\n/*# sourceMappingURL=${path.basename(o)}.map */`);
				if (map) fs.writeFileSync(o + ".map", map);
				
				env(o, "less");
				reload && reload();
				
				output.updateStats("less", {
					status: STATUSES.SUCCESS,
					time: trackTime.stop(),
				});
			}).catch(err => {
				output.updateStats("less", {
					status: STATUSES.FAILURE,
					errors: err.message,
					time: trackTime.stop(),
				});
			});
		}).catch(err => {
			// Ensure errors are indented by 4 spaces
			const extract = err.extract.join("\n").replace(/\t/g, "    ");
			
			output.updateStats("less", {
				status: STATUSES.FAILURE,
				errors: `${err.message} in ${clearAbsPath(err.filename)} `
				        + `(${err.line}:${err.column})\n\n${extract}\n`,
				time: trackTime.stop(),
			});
		});
	}
};