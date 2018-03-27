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
		"ignore": true,
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

##### Critical CSS
Critical CSS will only run when using `build once` (and it's not ignored).

##### .env
The path to your `.env` file. If you're using a hashed filename, the name will be written to the file using the `JS_FILENAME` or `CSS_FILENAME` handles.
(This way you can use `{{ getenv('JS_FILENAME') }}` in Craft 3).

##### Output
The both LESS & JS outputs can include a path (relative to the directory build is run in).

They can also include random hash generation (for cache breaking). 
`"output": "public/assets/build/app.[hash:5].min.js"`


#### Environment based config
You can have a single `.buildrc` file handle multiple node environments. Just nest your configs in objects keyed with the environment name.
You must have the `"*"` global environment for this to work. Missing options will fallback to the global environment, then to the default config.

```json
{
	"*": {
		"//": "Your global config goes here"
	},
	"production": {
		"//": "Your production environment config goes here"
	}
}
```

When running build, ensure you set the environment you want to use before hand:

`NODE_ENV=production build once`

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
- `bulid once --not-headless` - Will run the build once, and run chrome as an app

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

### Critical CSS
- Only runs on `build once`.
- Extracts critical CSS from the given pages.
- Will write to the `critical.output` directory (using the path key as the css filename).

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