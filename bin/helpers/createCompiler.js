const chalk = require("chalk")
	, output = require("../output")
	, STATUSES = require("../const").STATUSES
	, formatWebpackMessages = require("./formatWebpackMessages");

function createCompiler (handle, webpack, config) {
	let compiler;
	
	try {
		compiler = webpack(config);
	} catch (err) {
		console.log(chalk.red("Failed to compile."));
		console.log();
		console.log(err.message || err);
		console.log();
		process.exit(1);
	}
	
	// "invalid" event fires when you have changed a file, and Webpack is
	// recompiling a bundle. WebpackDevServer takes care to pause serving the
	// bundle, so if you refresh, it'll wait instead of serving the old one.
	// "invalid" is short for "bundle invalidated", it doesn't imply any errors.
	compiler.plugin("invalid", () => {
		output.updateStats(handle, {
			status: STATUSES.WORKING,
		});
	});
	
	// "done" event fires when Webpack has finished recompiling the bundle.
	// Whether or not you have warnings or errors, you will get this event.
	compiler.plugin("done", stats => {
		
		// We are going to "massage" the warnings and errors and present
		// them in a readable focused way.
		const messages = formatWebpackMessages(stats.toJson({}, true));
		const isSuccessful = !messages.errors.length && !messages.warnings.length;
		
		if (isSuccessful) {
			output.updateStats(handle, {
				status: STATUSES.SUCCESS,
			});
		}
		
		// If errors exist, mark as failed
		if (messages.errors.length) {
			// Only keep the first error. Others are often indicative
			// of the same problem, but can confuse the reader with noise
			if (messages.errors.length > 1)
				messages.errors.length = 1;
			
			output.updateStats(handle, {
				status: STATUSES.FAILURE,
				errors: messages.errors.join("\n\n"),
			});
			return;
		}
		
		// If warnings exist, mark as warning
		if (messages.warnings.length) {
			let warnings = messages.warnings.join("\n\n");
			
			// Learn yo self some eslint
			warnings += "\nSearch for the "
			            + chalk.underline(chalk.yellow("keywords"))
			            + " to learn more about each warning.";
			warnings += "\nTo ignore, add "
			            + chalk.cyan("// eslint-disable-next-line")
			            + " to the line before.\n";
			
			output.updateStats(handle, {
				status: STATUSES.WARNING,
				warnings,
			});
		}
	});
	
	return compiler;
}

module.exports = createCompiler;