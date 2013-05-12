// uexpress.js use underscore as a rendering engine for express 2 and 3
var 	_ = require('underscore'),	// http://documentcloud.github.com/underscore
		fs = require('fs'), // http://nodejs.org/docs/latest/api/fs.html
		path = require('path'); // http://nodejs.org/api/path.html

_.setLayout=function(layoutName){
	TEngine.customLayout=layoutName;
};
//exports
module.exports = {
	compile: compile,
	__express: __express,
};
// express 2 method
// @param {String} str - html template
// @return {Function}
function compile(str, options) {
	// template returns function object
	// template.source is the function's JavaScript source string
	var template = _.template(str);
	return function (locals) {
		return template(locals);
	};	
}

// the engine object express 3 requires
// @param {String} filename
// @param {Object} options -  layout if present and false: do not use layout
// @param {Function} callback cb(err, templateFunc)
// for layout case, we need to return a function first rendering file then rendering layout using that result
// for no layout, return a template function based on the file
function __express(filename, options, callback) {
	// get the page template
	TEngine.init(options,callback);
	TEngine.getTemplate(filename,function(template){
		// render page
		var body = template(this.options);
		// if set to false value other than undefined: skip layout
		// (if missing, set to undefined, evaluating to true: we do layout)
		if (this.options.layout !== undefined && !this.options.layout) 
			this.callback(null, body);
		else {
			// get layout filename
			var layoutFile;
			if(TEngine.customLayout){
				layoutFile = TEngine.customLayout;
				TEngine.customLayout=undefined;
			}else
				layoutFile = this.options.layout || this.options.settings.layout || 'layout';

			if (!path.extname(layoutFile)) 
				layoutFile += '.' + this.options.settings['view engine'];
			if (path.dirname(layoutFile) == '.') 
				layoutFile = path.join(this.options.settings.views, layoutFile);

			// options is a temporary variable in express' app.render
			// we can add fields to it...
			this.options.body = body;
			this.getTemplate(layoutFile,function(layout){
				TEngine.callback(null, layout(TEngine.options));
			});
		}
	}.bind(TEngine));
}

var TEngine={
	cache: {},
	customLayout:undefined,
	init:function(options,callback){
		this.options = options;
		this.callback = callback;
	},
	// method used twice: when get template file and layout file!
	// @param {String} filename,
	// @param {Function} cb
	getTemplate: function(filename, cb){
		var template = this.cache[filename];
		if (template) {
			cb(template);
		} else {
			// read from file and save in cache
			fs.readFile(filename, 'utf-8', function (err, str) {
				if (err) 
					TEngine.callback(err);
				else {
					// compile to a template
					template = _.template(str);
					if (TEngine.options.cache) 
						TEngine.cache[filename] = template;
					cb(template);
				}
			});
		}
	}
};
