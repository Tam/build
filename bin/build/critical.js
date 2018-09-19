const penthouse = require("penthouse")
	, ensureDirectoryExists = require("../helpers/ensureDirectoryExists")
	, Manifest = require("./manifest")
	, http = require("http")
	, https = require("https")
	, path = require("path")
	, fs = require("fs")
	, { URL } = require("url")
	, chalk = require("chalk");

class Critical {

	constructor (config, gui) {
		this.gui = gui;
		this.config = config;

		gui.run();

		try {
			// Fix invalid SSL cert errors
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			this.run();
		} catch (e) {
			gui.error(e);
			gui.complete();
			process.exit();
		}
	}

	async run () {
		// Ensure output dir exists
		ensureDirectoryExists(this.config.output);

		// Get the css
		this.css = await this.getCss();

		// Convert our template => url object into an array
		this.urls = Object.keys(this.config.paths).map(template => ({
			template,
			url: path.join(this.config.baseUrl, this.config.paths[template]),
		}));

		// Run penthouse in parallel
		try {
			await Promise.all([
				this.startNewJob(),
				this.startNewJob(),
				this.startNewJob(),
				this.startNewJob(),
				this.startNewJob()
			]);
		} catch (e) {
			this.gui.error(e);
		}

		this.gui.complete();
	}

	async getCss () {
		let css = "",
			urls = this.config.cssUrl;

		if (!Array.isArray(urls))
			urls = [urls];

		const regex = /\[([\w\d.]+)]/g;

		for (let i = 0, l = urls.length; i < l; ++i) {
			let url = urls[i];

			// Replace tokens w/ values from manifest
			if (url.indexOf("[") > -1) {
				url = url.replace(
					regex,
					(_, key) => Manifest.read(key)
				);
			}

			css += await this.get(url);
		}

		return css;
	}

	get (url) {
		return new Promise ((resolve, reject) => {
			const req = (~url.indexOf("https:") ? https : http).get(url);

			req.on('response', res => {
				let body = '';
				res.on('data', function(chunk) {
					body += chunk;
				});
				res.on('end', function() {
					// Normalize relative URLs
					const dir = url.substring(0, url.lastIndexOf('/')) + "/"
						, regex = /url\(\s*['"]?\/?(.+?)['"]?\s*\)/ig;

					let m;

					while ((m = regex.exec(body)) !== null) {
						if (m.index === regex.lastIndex)
							regex.lastIndex++;

						m.forEach((match, groupIndex) => {
							if (groupIndex !== 1)
								return;

							if (~match.indexOf("./")) {
								body = body.replace(
									match,
									new URL(dir + match).pathname
								);
							}
						});
					}

					resolve(body);
				});
			});

			req.on('error', err => {
				reject(err);
			});
		});
	}

	async startNewJob () {
		// Get the next available URL
		const u = this.urls.pop();

		// If there isn't a one, resolve
		if (!u)
			return Promise.resolve();

		const { url, template } = u;

		this.gui.message(chalk.grey("Starting ") + template);

		// Generate the critical CSS
		const css = await penthouse({
			url,
			cssString: this.css,
			timeout: 60e3,
			width: 1300,
			height: 1500,
		});

		// Write the CSS to our output dir
		fs.writeFileSync(
			path.join(this.config.output, template + ".css"),
			css
		);

		this.gui.message(chalk.grey("Finished ") + template);

		// Continue until we run out of URLs
		return this.startNewJob();
	}

}

module.exports = Critical;