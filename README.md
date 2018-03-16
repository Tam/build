# build
An opinionated build system for LESS & ES6

## Usage
- To install run `npm i -g tam/build`
- Run `build` in the directory you want build from

## Config
Create a `.buildrc` file to configure 
(all parameters are optional, below are the defaults. Tell your editor to treat as JSON):

```json
{
	".env": "/.env",
	"less": {
		"ignore": false,
		"input": "public/assets/less/style.less",
		"output": "public/assets/css/style.css",
		"watch": [
			"public/assets/less/**/*"
		]
	},
	"js": {
		"ignore": false,
		"input": "public/assets/js/app.js",
		"output": "public/assets/js/bundle.js",
		"watch": [
			"public/assets/js/**/*.js",
			"!public/assets/js/**/bundle.js"
		]
	},
	"critical": {
		"ignore": false,
		"base": "LOCAL_URL.dev",
		"output": "craft/templates/_critical",
		"paths": {
			"_templateName": "url/to/template"
		}
	},
	"browserSync": {
		"ignore": false,
		"proxy": "LOCAL_URL.dev",
		"watch": [
			"craft/templates/**/*"
		]
	}
}
```

URL's must be relative to the directory `build` is being run in. Prefixing a url
with `!` will ignore that file, `*` are wildcards.

##### .env
The path to your `.env` file. If you're using a hashed filename, the name will be written to the file using the `JS_FILENAME` or `CSS_FILENAME` handles.
(This way you can use `{{ getenv('JS_FILENAME') }}` in Craft 3).

##### Output
The both LESS & JS outputs can include a path (relative to the directory build is run in).

They can also include random hash generation (for cache breaking). 
`"output": "public/assets/build/app.[hash:5].min.js"`

### Multiple JS files

You can build multiple separate JS files by passing an array of paths to the 
`input` and `output` parameters (remember to watch all these directories!).
`output` follows [Webpack's `output.filename`](https://webpack.js.org/configuration/output/#output-filename).

```json
{
	"js": {
		"input": [
			"fileA.js",
			"fileB.js"
		],
		"output": "[name].js"
	}
}
```

## Commands
- `build` - Starts the watcher & build process
- `build init` - Creates a .buildrc file containing the default config
- `build once` - Runs the build once

## What it does
### LESS
- Autoprefixes for last 3 browser versions
- Creates sourcemap
- Complies to CSS
- Minifies

### JS
- Opinionated ESLint
- Creates sourcemap
- Resolves node imports
- Fixes CommonJS shit
- Opinionated Babel ES6 -> ES5 compile
- Uglifies & Minifies

### BrowserSync
- Reloads the browser (at `proxy:3000`) whenever any file in `watch` changes 
(this includes the JS & LESS `watch`es) 

## TODO
- [x] Add support for multiple inputs & outputs
- [ ] Make Babel, ESLint, & AutoPrefixer configurable (locally & globally)
- [x] Move away from Gulp?
- [ ] Add React support via webpack
- [x] Add check for newer versions of self
- [ ] Allow output to be object w/ `{ filename, path }` for both Less & JS