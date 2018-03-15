const lessConfig = require("../helpers/loadConfig").less
	, STATUSES = require("../const").STATUSES
	, getPath = require("../helpers/getPath")
	, output = require("../output")
	, less = require("less")
	, postcss = require("postcss")
	, fs = require("fs")
	, path = require("path");

const autoprefixer = require("autoprefixer")
	, flexBugsFixes = require("postcss-flexbugs-fixes")
	, customProperties = require("postcss-custom-properties")
	, cssnano = require("cssnano");

function ensureDirectoryExistence(filePath) {
	const dirname = path.dirname(filePath);
	if (fs.existsSync(dirname))
		return true;
	ensureDirectoryExistence(dirname);
	fs.mkdirSync(dirname);
}

const i = getPath(lessConfig.input)
	, o = getPath(lessConfig.output, "style.css");

const localPath = path.dirname(i);

const clearLocalPath = s => s.replace(localPath + "/", "");

// TODO: Record execution time
module.exports = {
	run: function () {
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
			map.sources = map.sources.map(clearLocalPath);
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
				
				output.updateStats("less", {
					status: STATUSES.SUCCESS,
				});
			}).catch(err => {
				output.updateStats("less", {
					status: STATUSES.FAILURE,
					errors: err.message,
				});
			});
		}).catch(err => {
			// Ensure errors are indented by 4 spaces
			const extract = err.extract.join("\n").replace(/\t/g, "    ");
			
			output.updateStats("less", {
				status: STATUSES.FAILURE,
				// errors: err.message + "\n" + extract,
				errors: `${err.message} in ${clearLocalPath(err.filename)} `
				        + `(${err.line}:${err.column})\n\n${extract}\n`,
			});
		});
	}
};