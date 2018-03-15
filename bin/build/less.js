const lessConfig = require("../helpers/loadConfig").less
	, STATUSES = require("../const").STATUSES
	, getPath = require("../helpers/getPath")
	, ensureDirectoryExistence = require("../helpers/ensureDirectoryExistence")
	, trackTime = require("../helpers/trackTime")()
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
	, o = getPath(lessConfig.output, "style.css");

const localPath = path.dirname(i);
const clearAbsPath = s => s.replace(localPath + "/", "");

module.exports = {
	run: function (reload) {
		trackTime.start();
		
		output.updateStats("less", {
			status: STATUSES.WORKING,
		});
		
		let rawLess;
		
		try {
			rawLess = fs.readFileSync(i, "utf8");
		} catch (err) {
			output.updateStats("less", {
				status: STATUSES.FAILURE,
				errors: err.message,
				time: trackTime.stop(),
			});
			return;
		}
		
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
				fs.writeFileSync(o, css);
				if (map) fs.writeFileSync(o + ".map", map);
				
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