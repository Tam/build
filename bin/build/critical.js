const fs = require("fs")
	, { URL } = require("url")
	, path = require("path")
	, http = require("http")
	, https = require("https")
	, cheerio = require("cheerio")
	, penthouse = require("penthouse")
	, puppeteer = require("puppeteer");

const { working, success, warning, failure, stats } = require("../output")
	, { STATUSES } = require("../const");

const criticalConfig = require("../helpers/loadConfig").critical
	, trackTime = require("../helpers/trackTime")()
	, getPath = require("../helpers/getPath")
	, ensureDirectoryExistence = require("../helpers/ensureDirectoryExistence");

// Ignore invalid SSL certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Get from URL
function getFromUrl(get, url, isCss = false) {
	return new Promise ((resolve, reject) => {
		const req = get(url);
		
		req.on('response', res => {
			let body = '';
			res.on('data', function(chunk) {
				body += chunk;
			});
			res.on('end', function() {
				// If CSS normalize relative URLs
				if (isCss) {
					const dir = url.substring(0, url.lastIndexOf('/')) + "/"
						, regex = /url\(\s*[\'"]?\/?(.+?)[\'"]?\s*\)/ig;
					
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
									(new URL(dir + match).href)
								);
							}
						});
					}
				}
				
				resolve(body);
			});
		});
		
		req.on('error', err => {
			reject(err);
		});
	});
}

// Custom Puppeteer
const browserPromise = puppeteer.launch({
	ignoreHTTPSErrors: true,
	args: [
		"--disable-setuid-sandbox",
		"--no-sandbox",
		"--ignore-certificate-errors",
	],
});

async function buildCritical (reload) {
	if (stats.critical.stats === STATUSES.WORKING)
		return;
	
	trackTime.start();
	
	// Tell the user Critical is generating
	working("critical");
	
	const { base, paths, output } = criticalConfig;
	const outputPath = getPath(output);
	
	// Are we viewing HTTP or HTTPS?
	const get = (~base.indexOf("https:") ? https : http).get;
	
	// Ensure output dir exists
	ensureDirectoryExistence(outputPath + "/fake.js");
	
	// Loop over paths & generate
	try {
		// Get CSS from first page
		// (this assumes the CSS file doesn't change across pages, which is fine)
		const url = base + paths[Object.keys(paths)[0]];
		
		// Load the HTML
		const html = await getFromUrl(get, url);
		
		// Extract CSS URLs
		const $ = cheerio.load(html);
		const links = $("head").find("link[href*='.css']");
		
		let cssString = "";
		
		for (let i = 0, l = links.length; i < l; ++i) {
			let url = $(links[i]).attr("href");
			
			if (url.indexOf("http") === -1)
				url = base + url;
			
			cssString += await getFromUrl(get, url, true);
		}
		
		// Convert our template => url object into an array
		const urls = Object.keys(paths).map(template => {
			return {
				template,
				url: base + paths[template],
			};
		});
		
		/**
		 * A single Critical CSS extraction job
		 *
		 * @return {Promise<*>}
		 */
		async function startNewJob () {
			// Get the next available URL
			const u = urls.pop();
			
			// If there isn't one, resolve
			if (!u)
				return Promise.resolve();
			
			const { url, template } = u;
			
			// Generate the critical CSS
			const css = await penthouse({
				url,
				cssString,
				unstableKeepBrowserAlive: true,
				puppeteer: { getBrowser: () => browserPromise }
			});
			
			// Write the CSS to our output dir
			fs.writeFileSync(
				path.join(outputPath, template + ".css"),
				css
			);
			
			// Continue until we run out of URLs
			return startNewJob();
		}
		
		// Make an initial request to bypass SSL errors
		// Temp fix for https://github.com/GoogleChrome/puppeteer/issues/1159
		const browser = await browserPromise;
		const page = await browser.newPage();
		await page.setViewport({width: 1300, height: 1000});
		await page.goto(base);
		
		// Run 5 Critical CSS extractions in parallel
		await Promise.all([
			startNewJob(),
			startNewJob(),
			startNewJob(),
			startNewJob(),
			startNewJob(),
		]);
		
		// Close Puppeteer
		browserPromise.then(browser => browser.close()).catch(() => {});
		
		// Reload the browser
		reload && reload();
		
		// Tell the user Critical completed successfully
		success("critical", {
			time: trackTime.stop(),
		});
	} catch (err) {
		// Close Puppeteer
		browserPromise.then(browser => browser.close()).catch(() => {});
		
		// Tell the user Critical failed
		failure("critical", {
			errors: [{
				message: err.message,
			}],
			time: trackTime.stop(),
		});
	}
}

module.exports = buildCritical;