const fs = require("fs")
	, path = require("path");

const less = require("less")
	, postCss = require("postcss");

const { working, success, warning, failure, stats } = require("../output")
	, { STATUSES } = require("../const");

const lessConfig = require("../helpers/loadConfig").less
	, trackTime = require("../helpers/trackTime")()
	, env = require("../helpers/env")
	, getPath = require("../helpers/getPath")
	, hashFilename = require("../helpers/hashFilename")
	, ensureDirectoryExistence = require("../helpers/ensureDirectoryExistence");

// File I/O
const isMultiple = Array.isArray(lessConfig.input);

if (isMultiple && (!Array.isArray(lessConfig.output) || lessConfig.input.length !== lessConfig.output.length)) {
	throw new Error("Less input array and output array must match in length.");
}

const input  = isMultiple ? lessConfig.input.map(i => getPath(i)) : [getPath(lessConfig.input)]
	, output = isMultiple ? lessConfig.output.map(o => getPath(o)) : [getPath(lessConfig.output, "style.css")];

// Initialize PostCSS
const postCssProcessor = postCss([
	require("postcss-flexbugs-fixes"),
	require("postcss-custom-properties")({ preserve: true }),
	require("autoprefixer")({
		browsers: [
			">1%",
			"last 4 versions",
			"Firefox ESR",
			"not ie < 9",
		],
		flexbox: "no-2009",
		grid: true,
	}),
	require("cssnano")({ zindex: false }),
]);

async function compileLess (input, output) {
	const lessDir = path.dirname(input)
		, lessFile = path.basename(input);
	
	const clearAbsPath = s => s.replace(lessDir + "/", "");
	
	// Load the LESS into a string
	let rawLess;
	
	try {
		rawLess = fs.readFileSync(input).toString();
	} catch (err) {
		// Tell the user LESS failed
		failure("less", {
			errors: [{ message: err.message }],
			time:   trackTime.stop(),
		});
		
		throw new Error("__HANDLED__");
	}
	
	// Manually clear LESS caches
	// (temp fix for https://github.com/less/less.js/issues/3185)
	(less.environment && less.environment.fileManagers || []).forEach(fm => {
		fm.contents && (fm.contents = {});
	});
	
	// Compile the LESS
	let css, map;
	
	try {
		const compiled = await less.render(rawLess, {
			filename:     lessFile,
			paths:        [lessDir],
			relativeUrls: true,
			sourceMap:    {},
		});
		
		css = compiled.css;
		map = compiled.map;
	} catch (err) {
		// Tell the user LESS failed
		failure("less", {
			errors: [{
				message: err.message,
				file:    clearAbsPath(err.filename),
				line:    err.line,
				column:  err.column,
				extract: err.extract.join("\n").replace(/\t/g, "    "),
			}],
			time: trackTime.stop(),
		});
		
		throw new Error("__HANDLED__");
	}
	
	// Hash the filename
	const outputFile = hashFilename(output, null, css);
	
	// Fix source map, making all paths relative
	map = JSON.parse(map);
	map.sources = map.sources.map(clearAbsPath);
	map = JSON.stringify(map);
	
	// Run through PostCSS
	const compiled = await postCssProcessor.process(css, {
		from: input,
		to:   outputFile,
		map:  { inline: false, prev: map, },
	});
	
	css = compiled.css;
	map = compiled.map;
	
	// Ensure the output directory exists
	ensureDirectoryExistence(outputFile);
	
	// Write compiled CSS & Source Map to disk
	fs.writeFileSync(
		outputFile,
		css + `\r\n/*# sourceMappingURL=${path.basename(outputFile)}.map */`
	);
	
	fs.writeFileSync(outputFile + ".map", map);
	
	// Update .env
	env(outputFile, isMultiple ? `less_${lessFile.replace(".less", "")}` : "less");
}

/**
 * Compile the LESS into CSS
 */
async function buildLess (reload) {
	if (stats.less.status === STATUSES.WORKING)
		return;
	
	trackTime.start();
	
	// Tell the user LESS is compiling
	working("less");
	
	try {
		// For each input
		input.map(async (input, i) => await compileLess(input, output[i]));
		
		// Reload the browser
		reload && reload();
		
		// Tell the user LESS compiled successfully
		success("less", {
			time: trackTime.stop(),
		});
	} catch (err) {
		if (err.message === "__HANDLED__")
			return;
		
		// Tell the user LESS failed
		failure("less", {
			errors: [{ message: err.message }],
			time:   trackTime.stop(),
		});
	}
}

module.exports = buildLess;
