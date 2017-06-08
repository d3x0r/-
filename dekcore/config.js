"use strict";
const idGen = require("./util/id_generator.js");
Error.stackTraceLimit = Infinity;
const _debug = false;

const os = require( "os" );

function getLocation() {
	var here = process.cwd();
	var i = os.networkInterfaces();
	for( var int in i ) i[int].forEach( i=>here += i.mac );
	return idGen.regenerator( here );
}

var config = module.exports = exports = {
	starts: [loadConfig]  // starts to run sequentially....
	, start_deferred: 0  // count of deferments (one resume required for each defer?)
	, starts_deferred: null // starts that have been deferred.
	, Λ: getLocation()
	, run: {
		Λ: undefined
		, hostname: os.hostname()
		, defaults: null
		, debug: true
		, addresses: []  // who I am...
		, friends: []  // discover should use this setting for off-network contact
		, timeOffset: new Date().getTimezoneOffset() * 60000
		, toString() {
			return JSON.stringify(this);
		}
	},
	commit: (cb) => {
		saveConfig(cb);
	},
	toString() {
		return this.run.toString();
	}
}
const fc = require('./file_cluster.js');

function saveConfig(callback) {
	fc.store(  "config.json", config.run, callback);
}

//res.sendfile(localPath);
//res.redirect(externalURL);
//
function loadConfig(path) {
	//console.log("loadconfig");
	fc.reload( "config.json",
		function (error, result) {
			//console.log("loadConfig: Error? ", error);
			if (!error) {
				//console.log( "attempt to re-set exports...", result);
				var str = result.toString();//fc.Utf8ArrayToStr(result);
				console.log( "Reloaded config so....", result, str)
				var object = JSON.parse(str);
				Object.assign(config.run, object);
				//console.log( "config reload is", config.run.Λ )
				//config.run = object;
				resume();
			}
			else {
				loadDefaults();
			}
		});

	function loadDefaults() {
		console.log("initializing config.")
		if (!config.run.Λ)
			config.run.Λ = idGen.generator();
		else
			console.log("partial recovery??!");
		config.run.defaults = require( process.cwd() + "/config.json");
		saveConfig(resume);
	}
	return true;
}


exports.start = function (callback) {
	_debug&&console.log("adding callback to start?", config.starts);
	if (config.run.Λ) {
		if (config.starts.length) {
			console.log("Defer callbacks... insert this one really?");
			config.starts.push(callback);
			//config.starts.forEach( (cb)=>{cb();});
			//config.starts = [];
			return;
		}
		//console.log( "config.start....")
		callback();
	}
	config.starts.push(callback);
}
exports.injectStart = function (callback) {
	_debug&&console.log("insert callback to start?", config.starts);
	config.starts.unshift(callback);
}
exports.defer = function () {
	_debug&&console.trace("config.defer....")
	/*
		if( config.start_deferred ) {
		var i;
			while( i = config.starts.shift() )
				config.starts_deferred.push( i );

		}
		else
			config.starts_deferred = config.starts;
	*/
	config.start_deferred++;
}

exports.resume = resume;
function resume() {

	_debug&&console.log("config.resume....", config.starts)
	while (config.starts.length) {
		if (config.start_deferred) break;
		//console.log( "run thing ", config.starts[0].toString())
		var startProc = config.starts.shift();
		if( startProc() )  // return true to get the next ome... will get a resume later
			break;

		if (config.start_deferred) {
			//console.log( "got deferred...", config.starts)
			config.starts_deferred = config.starts;
			//console.log( "run thing ", config.starts[0].toString())
			break;
		}
	}
	//config.starts = []
	if (config.start_deferred) {
		config.starts = config.starts_deferred;
		config.start_deferred--;
	}
	//console.log( "clear deferred ")
}
