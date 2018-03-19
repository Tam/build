const path = require("path")
	, { createFilter } = require("rollup-pluginutils")
	, { CLIEngine } = require("eslint");

const { warning, failure } = require("../output");

function normalizePath(id) {
	return path.relative(process.cwd(), id).split(path.sep).join("/");
}

module.exports = function eslint(trackTime, options = {}) {
	const cli = new CLIEngine(options);
	let formatter = options.formatter;
	
	if (typeof formatter !== "function") {
		formatter = cli.getFormatter(formatter || "stylish");
	}
	
	const filter = createFilter(
		options.include,
		options.exclude || /node_modules/
	);
	
	return {
		name: "eslint",
		
		transform(code, id) {
			const file = normalizePath(id);
			if (cli.isPathIgnored(file) || !filter(id)) {
				return null;
			}
			
			const report = cli.executeOnText(code, file, false);
			const hasWarnings = report.warningCount !== 0;
			const hasErrors = report.errorCount !== 0;
			
			if (!hasWarnings && !hasErrors) {
				return null;
			}
			
			const message = formatter(report.results);
			
			if (hasErrors) {
				failure("js", {
					errors: [{ message }],
					time: trackTime.stop(),
				});
				throw new Error("__ignore__");
			}
			
			if (hasWarnings) {
				warning("js", {
					warnings: [{ message }],
				});
			}
		}
	};
};