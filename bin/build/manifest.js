const fs = require("fs");

class Manifest {
	constructor (config) {
		this.manifestPath = config.manifest;
		this.loadManifest();

		Manifest.i = this;

		return (entry, output) => {
			this.manifest[entry] = output;
			this.writeManifest();
		};
	}

	static read (key) {
		return Manifest.i ? Manifest.i.manifest[key] : null;
	}

	loadManifest () {
		try {
			if (fs.existsSync(this.manifestPath)) {
				const stringManifest = fs.readFileSync(this.manifestPath, "utf8");

				if (stringManifest === "") {
					this.manifest = {};
				} else {
					this.manifest = JSON.parse(stringManifest);
				}
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