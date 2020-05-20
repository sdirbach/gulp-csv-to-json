var through = require('through2');
var gutil = require('gulp-util');
var path = require('path');
var map = require('map-stream');
var jsonFile = require('jsonfile');
var fs = require('graceful-fs');
var _ = require('lodash');

var csvjson = require('./lib/index');

var extendOptions = function(optionsObject) {
	var defaultOptions = {
		parserOptions: {
			auto_parse: true,
			tabSize : 2,
			eol: '\r\n'
		},
		processValue: function(key, value) {
			if (key !== '') {
				return value;
			}
		}
	};

	if (typeof optionsObject !== 'object') {
		return defaultOptions;
	}

	for (var k in optionsObject) {
		defaultOptions[k] = optionsObject[k];
	}
	return defaultOptions;
};

module.exports = function(options) {
	options = extendOptions(options);

	return map(function (file, cb) {

		if (file.isNull()) {
			return cb(null, file);
		}

		if (file.isStream()) {
			return cb(new gutil.PluginError('gulp-csv2json', 'Streaming not supported'));
		}

		if (['.csv'].indexOf(path.extname(file.path)) === -1) {
			gutil.log('gulp-csv-to-json: Skipping unsupported csv ' + gutil.colors.blue(file.relative));
			return cb(null, file);
		}

		if (!fs.existsSync(options.destinationPath)){
				fs.mkdirSync(options.destinationPath);
		}

		csvjson.process(file.contents, options, function(err, sets) {
			sets.forEach(function(set) {
				let file = options.destinationPath + "/" + set.name + ".json";
				jsonFile.writeFile(file, set.data, { spaces: options.tabSize,  EOL: options.eol }, function (err) {
					if (!_.isNull(err)) {
						throw new PluginError('gulp-csv-to-json', 'ERROR: Error during save. ' + err);
						}
				});
				cb(null, file);
			});
		});
	});
};
