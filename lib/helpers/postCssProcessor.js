const postCss = require('postcss')
	, customProperties = require('postcss-custom-properties')
	, autoPrefixer = require('autoprefixer')
	, cssNano = require('cssnano');

module.exports = postCss([
	customProperties({ preserve: true }),
	autoPrefixer({
		overrideBrowserslist: [
			'>1%',
			'last 2 versions',
			'Firefox ESR',
			'not dead',
			'not ie <= 10',
		],
		flexbox: 'no-2009',
		grid: true,
	}),
	cssNano({
		preset: ['advanced', {
			zindex: false,
		}],
	}),
]);
