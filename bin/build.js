const config = require("./config")
	, Output = require("./output");

const output = new Output(config);

// Less watch depencencies only: https://github.com/JakeSidSmith/watch-less-do-more
// Or w/ the parser only: https://gist.github.com/Craga89/96f7fcad1f35b08bf88d#file-lessimportlist-js
