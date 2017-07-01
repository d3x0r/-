"use strict";
const idGen = require("./util/id_generator.js");
Error.stackTraceLimit = Infinity;
const _debug = false;

const os = require( "os" );

var config = module.exports = exports = {
	starts: [loadConfig]  // starts to run sequentially....
	, start_deferred: 0  // count of deferments (one resume required for each defer?)
	, starts_deferred: null // starts that have been deferred.
	, Λ: null
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

function getLocation() {
	var here = process.cwd();
	var i = os.networkInterfaces();
	for( var int in i ) i[int].forEach( i=>{ 
		if( i.family == "IPv6" ) {
			if( !i.address.startsWith( 'fe80' ) 
			   && !i.address === "::1" )
				config.run.addresses.push( i.address );
		} else {
			if( i.address !== "127.0.0.1" 
			  && !i.address.startsWith( "192.168" ) 
			  && !["172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.",
			       "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31."].find( prefix=>i.address.startsWith( prefix ) )
			  && !i.address.startsWith( "10." ) )
				config.run.addresses.push( i.address );
		}
		here += i.mac 
	} );
	console.log( "Usable addresses:", config.run.addresses );
	config.Λ = idGen.regenerator( here );
}

getLocation();



function saveConfig(callback) {
	fc.store(  "config.json", config.run, callback);
}

//res.sendfile(localPath);
//res.redirect(externalURL);
//
function loadConfig(path) {
	//console.log("loadconfig");
	fc.init();
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
