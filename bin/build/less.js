const less = require("less")
	, fs = require("fs")
	, path = require("path");

class Less {

	constructor (config, output) {
		this.buildDependencyTrees(config, output);
	}

	// Dependency Trees
	// =========================================================================

	async buildDependencyTrees (config, output) {
		this.trees = [];

		for (let i = 0, l = config.entry.length; i < l; ++i) {
			const input = config.entry[i];

			try {
				const { imports } = await this._render(
					fs.readFileSync(input, "utf8"),
					{
						filename: path.basename(input),
						paths: [path.dirname(input)],
					}
				);

				this.trees[input] = [input, ...imports];
			} catch (e) {
				output.less.error(e);
			}
		}

		console.log(this.trees);
	}

	// Helpers
	// =========================================================================

	_render (css, opts) {
		return new Promise(((resolve, reject) => {
			less.render(css, {
				...opts,
				relativeUrls: true,
				sourceMap: {},
			}, (err, out) => {
				if (err) reject(err);
				else resolve(out);
			});
		}));
	}

}

module.exports = Less;