// const config = require('./config');
// console.log(config);
const { UI_run, UI_complete, UI_message, UI_warning, UI_error, UI_register } = require('./gui');

UI_register('less', 'Less');
UI_register('critical', 'Critical');

UI_run('less');
UI_run('critical');
setTimeout(() => {
	UI_complete('less');
	UI_complete('critical');
}, 1000);
UI_message('less', 'Hello world!');
UI_warning('less', 'This is a warning');
UI_error('critical', new Error('Uh oh, something went wrong!'));
UI_message('less', `This is a\nmulti-line message\nit has many lines`);

setInterval(() => {
	const r = Math.random();
	if (r < 0.3) {
		UI_message('critical', `This is a\nmulti-line message lorem ipsum dolor this should be cropped at some point\nit has many lines`);
	} else if (r < 0.6) {
		UI_warning('less', 'This is a warning');
	} else {
		UI_error('critical', 'This is a longer message hello world lorem ipsum dolor amet something something');
	}
}, 1000);
