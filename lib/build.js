// const config = require('./config');
// console.log(config);
const { UI_run, UI_complete, UI_message, UI_warning, UI_error } = require('./gui');

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
	if (Math.random() > 0.5) {
		UI_message('critical', `This is a\nmulti-line message\nit has many lines`);
	} else {
		UI_warning('less', 'This is a warning');
	}
}, 1000);
