# build
An opinionated build system for front-end web development.

Currently supports:
- Sass
  - Supports `glob` imports (i.e. `@import "glob:../../templates/**/*.scss";`)
- Less
- ES6 JS / JSX
- JSON Manifest (NOT webmanifest)
- Critical CSS
- File copy sync

## Installation

With Yarn:
```bash
$ yarn add -g tam/build
```

Or NPM:
```bash
$ npm i -g tam/build
```

## Usage
To compile your assets in development mode with file watching run:
```bash
$ build
```

To create production builds and generate critical CSS run:
```bash
$ build p
```

To generate a dedicated config file run:
```bash
$ build init
```

## Configuration

There are two ways to configure build (should you need to). The first is in your
`package.json` file, and the second is via a dedicated `build.config.js` file.

You can configure build in your `package.json` by adding a `build` property 
that maps to an object of your settings.

For more advanced configuration that can use Node JS you'll want to use the
`build.config.js` file. Run the `build init` command to generate this file.

**[Available Config Options](./lib/config/default.js)**

## Navigation

You can navigate up and down the message log using the following keys:

- `Shift + ]` - Jump up 5 lines
- `Shift + [` - Jump down 5 lines
- `[Up arrow]` or `k` - Jump up 1 line
- `[Down arrow]` or `j` - Jump down 1 line

---

## TODO
- [x] Write install / usage / config docs
- [ ] Remove BrowserSync (or replace it with something simpler)?
- [x] Allow config options to be set in `package.json`
- [x] Merge config from `package.json` into `build.config.js` when creating it
- [ ] Add CLI flags for temporary overrides (i.e. prod build without critical `--no-crit`)
- [x] Support `critical.cssUrl` being both absolute and relative to `critical.baseUrl`
- [ ] Watch package.json or build.config.js for changes and update everything accordingly
- [x] Support scrolling through log
- [ ] `build init` should have to option to create `build.config.js` or add `build` to `package.json` with defaults
