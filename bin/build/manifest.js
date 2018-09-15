const fs = require("fs");

class Manifest {

	constructor (config) {
		this.manifestPath = config.manifest;
		this.loadManifest();

		return (entry, output) => {
			this.manifest[entry] = output;
			this.writeManifest();
		};
	}

	loadManifest () {
		try {
			if (fs.existsSync(this.manifestPath)) {
				this.manifest = JSON.parse(
					fs.readFileSync(this.manifestPath, "utf8")
				);
			} else {
				this.manifest = {};
				this.writeManifest();
			}
		} catch (e) {
			// TODO: Show error
			throw e;
		}
	}

	writeManifest () {
		fs.writeFileSync(
			this.manifestPath,
			JSON.stringify(this.manifest)
		);
	}

}

module.exports = Manifest;