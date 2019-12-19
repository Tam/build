# build
An opinionated build system for front-end web development.

Currently supports:
- Sass
- Less
- ES6 JS / JSX
- TypeScript / TSX (WIP)
- JSON Manifest (NOT webmanifest)
- Critical CSS (WIP)
- File copy sync (WIP)

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

For more advanced configuration that use include Node JS you'll want to use the
`build.config.js` file. Run the `build init` command to generate this file.

## TODO
- [ ] Write install / usage / config docs
- [ ] Remove BrowserSync (or replace it with something simpler)?
- [x] Allow config options to be set in `package.json`
- [x] Merge config from `package.json` into `build.config.js` when creating it
- [ ] Add CLI flags for temporary overrides (i.e. prod build without critical `--no-crit`)
- [ ] Support `critical.cssUrl` being both absolute and relative to `critical.baseUrl`
- [ ] Add an option in JS for TypeScript support (similar to the jsx option)
