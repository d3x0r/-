"use strict";
const idGen = require("./util/id_generator.js");
//Error.stackTraceLimit = Infinity;
const _debug = false;

const os = require( "os" );

var config = module.exports = exports = {
	starts: [loadConfig]  // starts to run sequentially....
	, start_deferred: 0  // count of deferments (one resume required for each defer?)
	, starts_deferred: null // starts that have been deferred.
	, Λ: null // this is a system identifier.
       	, interfaces: []  // who I am...
       	, internal_interfaces: []  // who I am...
	, run: {
		Λ: undefined  // this is a service identifier
		, hostname: os.hostname()
		, defaults: { useIPv6 : false, include_localhost : false, dedupInterfaces: true }
		, debug: true
		, addresses: []  // who I am...
		, internal_addresses: []  // who I am...
		, friends: []  // discover should use this setting for off-network contact
		, timeOffset: new Date().getTimezoneOffset() * 60000
		, toString() {
			return JSOX.stringify(this);
		}
	},
	commit(cb) {
		saveConfig(cb);
	},
	toString() {
		return this.run.toString();
	},
	isLocal( addr ) {
		return isAddrLocal(addr );
	},
	fc : null,
}
const fc = require('./file_cluster.js');
config.fc = fc;
function isAddrLocal(address) {
	//console.log( "Test address:", address );
	if( address.startsWith( "::ffff:" ) ) { // ::ffff:192.168.173.13
		address = address.substr( 7 );
	}
        if( address.startsWith( "::" ) && address.includes( "." ) ) {
        	address = address.substr( 2 );
        }
	if( address.startsWith( "192.168" )
		|| ["172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.",
	        "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31."].find( prefix=>address.startsWith( prefix ) )
		||address.startsWith( "10." ) )
		return true;
	if( address.startsWith( 'fe80' ) )
		return true;
	return false;
}


function getLocation() {
	var here = process.cwd();
	var i = os.networkInterfaces();
	var i2 = [];
	for( var int in i ) {
        	var placed = false;
        	for( var int2 in i2 ) {
                	//console.log( "is ", i2[int2][0].mac, " < ", i[int][0].mac );
                	if( i2[int2][0].mac > i[int][0].mac ) {
                        	//console.log( "unshifted?" );
                                i2.splice( int2, 0, i[int] );
                                placed = true;
                                break;
                        }
                }
                if( !placed )
                	i2.push( i[int] );
        }
        i = i2;
        config.run.internal_addresses = [];
        config.run.addresses = [];
	for( var int in i ) { var added; added = 0; 
		i[int].forEach( i=>{
			if( i.family == "IPv6" ) {
				if( !i.address.startsWith( 'fe80' )
				&& !i.address === "::1" ) {
					// allow localhost as either a external or internal....
					config.run.addresses.push( i.address );
					config.run.internal_addresses.push( i.address );
					//console.log( "adding external v6", config.run.addresses );
					if( !config.run.defaults.include_localhost )
						return;
				}
				//config.interfaces.push( i );
				else if( config.run.defaults.useIPv6 )
					if( !isAddrLocal( i.address ) ) {
						config.run.addresses.push( i );
						config.interfaces.push( i );
						//console.log( "is external v6", config.run.addresses );
					} else {
						//console.log( "is local v6" );
						config.run.internal_addresses.push( i );
						config.internal_interfaces.push( i );
					}
				added |= 2;
			} else {
				if( i.address === "127.0.0.1" ) {
					if( !config.run.defaults.include_localhost )
						return;
				}
				else 
					if( !isAddrLocal( i.address ) ) {
						config.run.addresses.push( i );
						config.interfaces.push( i );
					} else {
						config.run.internal_addresses.push( i );
						config.internal_interfaces.push( i );
					}
				added |= 1;
			}
			//added = true;
			//here += i.mac
		} );
		if( added & 2 ) here += i[int][0].mac
		if( !config.run.defaults.dedupInterfaces )
			if( added & 1 ) here += i[int][0].mac
	}
	//console.log( "Usable addresses:", config.run.addresses, "internal:", config.run.internal_addresses );
	//here = "/home/chatment/kcore00:00:00:00:00:000c:c4:7a:7f:93:500c:c4:7a:7f:93:500c:c4:7a:7f:93:510c:c4:7a:7f:93:51";
	//console.log( "here is:", here,  idGen.regenerator( here ) );
	config.Λ = idGen.regenerator( here );
}

getLocation();



function saveConfig(callback) {
	console.log( "Saving config.run.jsox" );
	fc.store(  "config.run.jsox", config.run, callback);
}

//res.sendfile(localPath);
//res.redirect(externalURL);
//
function loadConfig(path) {
	//console.log("loadconfig");
	fc.init();
	loadDefaults();


	fc.reload( "config.run.jsox",
		function (error, result) {
			if( error ) 
				loadRun( null );
			else {
				loadRun( result.toString() );
			}
		}
	);

	function loadRun(str) {
				var file_defaults = require(  "./config.jsox");
				var object = str && JSOX.parse(str);

				//console.log( "Reloaded config obj....", object)
				var intern = config.run.internal_addresses;
				var extern = config.run.addresses;
				
				Object.assign(config.run, object);

				file_defaults = Object.assign( config.run.defaults, file_defaults ); // override with file (or we couldn't change settings.)

				config.run.internal_addresses = intern;
				config.run.addresses          = extern;
				saveConfig();
				resume();
	}


	function loadDefaults() {
		_debug&&console.log("initializing config.")
		if (!config.run.Λ)
			config.run.Λ = idGen.generator();
		else
			console.log("partial recovery??!");
		config.run.defaults = require( "./config.jsox" );
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
	_debug&&console.trace("config.defer....", config.start_deferred, config.starts_deferred)
	if( config.start_deferred ) {
		let i;
		while( i = config.starts.shift() )
			config.starts_deferred.push( i );
	}
	else {
		config.starts_deferred = config.starts;
		config.starts = [];
	}
	config.start_deferred++;
}

exports.resume = resume;
function resume() {

	_debug&&console.log("config.resume....", config.starts, config.starts && config.starts.length)
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
	if (config.starts_deferred) {
		config.starts = config.starts_deferred;
		config.start_deferred--;
	}
	//console.log( "clear deferred ")
}
