"use strict";
//console.trace( "required by..." );
const _debug = false;

//console.log( "using require: ", require, module )
const fs = require('fs');
const server = require( './https_server.js');
const sack = require( "../sack.vfs" );
const JSOX=sack.JSOX;
const JSON=sack.JSOX;

const myStringifier = JSOX.stringifier();
var stringifierInitialized = false;
const myParser = JSOX.begin( receiveJSOXObject );

//const db = sack.Sqlite( "id.db" );
var config = require('./config.js');
//console.log( "config is ", config.run.root, "and which require ?" );

const fc = require('./file_cluster.js')
const Entity = require('./Entity/entity.js')
var IdGen = require("./util/id_generator.js");
var idGen = IdGen.generator;
var key_frags = new Map();
// key_frags[key] = keys
// #1: { }
//Map.prototype.length = function() { return Object.keys( keyTracker.keys ).length - 5
//}



function KeyTracker() {
	this.Λ = null;
	this.mkey = null;
	this.lkey = null;
	this.pkey = null;
	this.keys = new Map();
	this.fragMaps = null;
}

var keyTracker = new KeyTracker();


//JSOX.registerToFrom( "idkt", keyTracker.prototype );

// default strinigfy behavior; but wraps result prefixed by classname
myStringifier.registerToJSOX( "idkt", KeyTracker.prototype );
// default parser behavior; but revives using KeyTracker prototype
myParser.registerFromJSOX( "idkt", KeyTracker.prototype );

function receiveJSOXObject( value ) {
	
}

//var local_authkey;
//var public_authkey;
//var keys = new Map();
//var mkey;



function initKeys() {
/*
	keys.toString = () => {
		var leader = `{"Λ":"${keys.Λ}"
			,"mkey":"${mkey && mkey.Λ}"
			,"lkey":"${exports.localAuthKey.Λ}"
			,"pkey":"${exports.publicAuthKey.Λ}"
			,"keys":`;
		var footer = '}';
		var buffer = null;
		keys.forEach((key, index, mem) => {
			if (!buffer) buffer = '{'; else buffer += '\n,';
			buffer += '"' + key.Λ + '":' + key.toString();
		});
		if (buffer) buffer += '}';
		return leader + buffer + footer;
	}
*/        
}
//initKeys();



function keyProto(Λ, o) {
	var key = o || {
		maker: null
		, Λ: Λ
		, authby: null
		, requested: 0  // count
		, trusted: false // boolean
		, invalid: false // fail all auth and do not persist
		, authonly: true // don't send copies to other things
		, created: new Date()
	};
	if( !stringifierInitialized ) {
		myStringifier.defineClass( "id", key );
		stringifierInitialized = true;
	}

	["made", "authed"].forEach(prop => {
		Object.defineProperty(key, prop, { enumerable: false, writable: true, configurable: false, value: [] });
	})

	return key;
}

var pendingOps = [];

function Key(maker_key, askey) {
	var key = null;
	var real_key;
	//console.log( "KEY IS OF COURSE :", typeof maker_key, maker_key)
	if ( ( typeof (maker_key) !== "string" ) && ( "Λ" in maker_key ) ) real_key = keyTracker.keys.get(maker_key.Λ);
	else real_key = keyTracker.keys.get(maker_key);
	if (real_key) maker_key = real_key.Λ;
	//console.log( "maker", maker_key );

	key = keyProto(idGen());
	key.maker = real_key; // always by name here (real key is maker)

	//console.log( "raw key is:", key.Λ, key.maker, maker_key );
	if (real_key) {
		real_key.made.push(key);
	}
	else {
		pendingOps.push({ maker: maker_key, key: key });
	}
	//console.log("SET KEY ", key.Λ, key);
	keyTracker.keys.set(key.Λ, key);
	//console.log( "generated key ", key.Λ )
	return key;
}

function KeyFrag(fragof) {
	return {
		Λ: ID(fragof).Λ
		//_ :
		, keys: []
		, toString: () => {
			var mystring;
			//if( !mystring )
			mystring = keys.toString();
			return mystring;
		}
	}
}

exports.Auth = (key) => {
	if (keyTracker.keys.get(key.Λ))
		return validateKey(key, (k) => k.authby );
	return false;
}

exports.authBy = (key, auth, cb) => {
	auth = keyTracker.keys.get(auth);
	if (!auth){
		cb(false);
 		return false;
	}
	if (keyTracker.keys.get(key)) {
		do {
			if (key.maker === maker) {
			  cb( true );
				return true;
			}
			if (key.invalid) {
				cb(false);
				return false;
			}
			key = key.authby;
		} while (key);
	}
	cb(false);
	return false;
}

exports.madeFrom = (key, maker, cb) => {
	let _maker = keyTracker.keys.get(maker);
	if (!_maker) {
		cb(false);
		return;
	}
	if (keyTracker.keys.get(key)) {
		do {
			if (key.maker === maker){
				cb(true);
				return;
			}
			//if( key.maker.Λ === maker )
			//    return true;
			if (key.invalid){
				cb(false);
				return;
			}
			key = key.maker;
		} while (key);
	}
	cb(false);
	return;
}

Object.defineProperty(exports, "localAuthKey", {
	get: function () {
		//console.log( "local authkey request..." );
		if (keyTracker.lkey)
			return keyTracker.lkey;
		//console.log( "create a new local authority", config.run.Λ );
		keyTracker.lkey = Key(config.run.Λ)
		// this is one of those illegal operations.
		keyTracker.lkey.authby = keyTracker.keys.get(config.run.Λ);
		return keyTracker.lkey;
	}
});

Object.defineProperty(exports, "publicAuthKey", {
	get: function () {
		if (keyTracker.pkey)
			return keyTracker.pkey;
		//console.log( "create a new local authority", config.run.Λ );
		keyTracker.pkey = Key(config.run.Λ)
		// this is one of those illegal operations.
		keyTracker.pkey.authby = keyTracker.keys.get(config.run.Λ);
		return keyTracker.pkey;
	}
});

exports.delete = function deleteKey(key, maker) {
	if( !maker )
		throw new Error( "Key deletion requires maker" );
	
	key = (typeof key === 'object' && 'Λ' in key) ? key : keyTracker.keys.get(key);
	if (key) {
		var makerKey = keyTracker.keys.get(maker);
		var index = makerKey.made.find( k => k === key );
		makerKey.made.splice( index, 1 );

		index = key.authby.authed.find( k=>k===key );
		key.authby.authed.splic( index, 1 );

		keyTracker.keys.delete(key);
		key.made.forEach((m) => { deleteKey(m) });
		key.authed.forEach((a) => { deleteKey(a) });
	}
	else 
		throw new Error( "Failed to delete invalid key" );
}


exports.ID = ID; function ID(making_key, authority_key, callback) {
	//stackTrace();
	_debug && console.log( "Making a key...... ", JSOX.stringify(making_key,null,"\t"), JSOX.stringify(authority_key,null,"\t") )
	//_debug && console.log( "CONFIG RUN:", JSOX.stringify( config.run.Λ, null, 4 ), JSOX.stringify( keyTracker.keys.get( config.run.Λ),null,3 )  );
	//console.log( keyTracker.keys[making_key.Λ] );
	if (!making_key) throw new Error("Must specify at least the maker of a key");
	if (!keyTracker.keys.get(config.run.Λ)) {
			console.trace("ID() waiting for config...", JSOX.stringify(config.run), keyTracker.keys)
		config.injectStart(() => { ID(making_key, authority_key, callback); });
		config.defer(); // save any OTHER config things for later...
		return;
	}
	if (!authority_key)
		authority_key = keyTracker.keys.get(config.run.Λ)

	if (!making_key.Λ)
		making_key = keyTracker.keys.get(making_key);
	else
		making_key = keyTracker.keys.get(making_key.Λ); // things that have the ID might not be THE Key.

	if (!authority_key.Λ)
		authority_key = keyTracker.keys.get(authority_key);
	else
		authority_key = keyTracker.keys.get(authority_key.Λ);

	//console.log( `making_key ${making_key.toString()}` );
	//console.log( `authority_key ${authority_key.toString()}` );

	if (making_key === authority_key)
		throw new Error("Invalid source keys");

	if( (!making_key || !validateKey(making_key, (k) => { return k.maker }))
		|| (!authority_key || !validateKey(authority_key, (k) => { return k.authby }))) {
			throw new Error( JSON.stringify( { msg: "Invalid source key", maker: making_key, auth: authority_key } ) );
		}
	var newkey = Key(making_key);
	newkey.authby = authority_key;
	_debug && console.log( "authkey", newkey.Λ, authority_key )

	authority_key.authed.push(newkey);
	flushKeys();

	if (authority_key)
		newkey.authby = authority_key
	//console.log( "made a new key", newkey.Λ );
	if (callback)
		callback(newkey);
	return newkey.Λ;
}

var flushTimer = null;
process.on( 'exit', ()=>{
	console.trace( "Exit event in id_manager" );
	if( flushTimer ) {
		tickFlushKeys();
		clearTimeout( flushTimer );
	}
})
function flushKeys() {
	if( !flushTimer )
		flushTimer = setTimeout( tickFlushKeys, 1000 );
}

function tickFlushKeys() {
	saveKeys();
	flushTimer = null;
}

function validateKey(key, next, callback) {
	let ID;
	if (!key) {
		return false;
	}
	if (key.Λ) ID = keyTracker.keys.get(key.Λ);
	else ID = keyTracker.keys.get(key);
	_debug && console.log( "validate key ", JSOX.stringify(ID,null, '\t') )
	if (ID) {
		//console.log( "validate key had a key find", ID)
		if (ID.invalid)
			return false;
		if (ID.trusted)
			return true;
		//if( ID.key == key )
		//    return false;
		ID.requested++;
		if (key.Λ === config.run.Λ) {
			console.log("validate success because key is config.run")
			return true;
		}
		if (ID.maker === ID)
			return true;
		return validateKey(next(ID), next);//.maker ) && validateKey( ID.authby );
	}
	else {
		// requestKey and callback?

		if (callback) {
			callback(yesno);
		}
		console.log("no such key")
		//exports.ID( config.run.Λ );
		//return true;
	}
	return false;
}
function isKeyCreator(key, next, callback) {
	let ID;
	if (!key) {
		return false;
	}
	if (key.Λ) ID = keyTracker.keys.get(key.Λ);
	else ID = keyTracker.keys.get(key);
	//console.log( "validate key ", ID )
	if (ID) {
		//console.log( "validate key had a key find", ID)
		if (ID.invalid)
			return false;
		if (ID.trusted)
			return true;
		//if( ID.key == key )
		//    return false;
		ID.requested++;
		if (key.Λ === config.run.Λ) {
			console.log("validate success because key is config.run")
			return true;
		}

		if (ID.maker === ID)
			return true;
		return isKeyCreator(next(ID), next);//.maker ) && validateKey( ID.authby );
	}
	else {
		// requestKey and callback?

		if (callback) {
			callback(yesno);
		}
		console.log("no such key")
		//exports.ID( config.run.Λ );
		//return true;
	}
	return false;
}

function saveKeys(callback) {
	var fileName = config.run.defaults.dataRoot + "/id.json"
	console.log( "Saving keys:", fileName,  );
	fc.store(fileName, myStringifier.stringify( keyTracker, null, '\t' ), callback);
}

function TrackKeyFrags() {
	let frag = key_frags[0];

	if (!frag) {
		var fixup = () => {
			if (typeof Entity !== "Object")
				config.start(fixup);
			key_frags = Entity.create(config.run).create(keyTracker.keys);
			//key_frags.Λ = Key( config.run.Λ ).Λ;
			//frag = KeyFrag( config.run.Λ );
			//frag_ent = Entity( frag  );
			//frag_ent.value = keys;
			//key_frags.store( frag_ent );

			//key_frags.push( frag );
			//frag.keys = keys;
			fc.store(config.run, key_frags);
			saveKeys();
		};
		// keys is a valid type to pass to create
		// but is any value.
		if (typeof Entity !== "function")
			config.start(fixup);
		else
			fixup();
	}

}

function loadKeyFragments(o) {

	var result;
	//console.log('loadkeyFragment', o)
	fc.reloadFrom(o, (error, files) => {
		//console.log("got files?", files);
		if (error) {
			if (error.code === 'ENOENT') {
				return;
				//saveKeys();
			}
			console.log("loadfrom directoryerror: ", error, Object.keys(error))
		}
		else if (files.length === 0) {
			console.log("no files...")
			return;
		}
		//var fileName = fs.;
		//console.log( "loading fragments ", files );
		if (!error)
			fc.reload(files, (error, buffer) => {
				console.log("reload id : ", error, " ", buffer)
				if (error) {
					/* initial run, or the file was invalid*/
					console.log("can only load fragments that exist so... ", error);
				} else {
					var data = fc.Utf8ArrayToStr(buffer);
					try {
						console.log( "about to parse this as json\n", data );
						var reloaded_keys = JSOX.parse(data);
						console.log("no error", reloaded_keys);
						//if( keys.length === 0 )
					} catch (error) {
						console.log(data);
						console.log("bad keyfrag file", error);
					}
				}
			});
	});
}

function loadKeys() {
	var result;
	var fileName = config.run.defaults.dataRoot + "/id.json";


	//_debug&&console.log("CONFIG DEFER.... ");
	//config.defer(); // save any OTHER config things for later...

	_debug&&console.log("RELOAD STATIC FILE....", fileName )

	//console.log( "fc.reload... ")
	fc.reload(fileName, (error, buffer) => {
		if (error) {
			_debug&&console.log(  "Reload failed", error, "Initialize root keys")
			//if( keys.size === 1 ) {
			//let newkey =  idGen.generator();
			//console.log(  newkey.toString() );
			var runKey = Key(config.run.Λ);
			Object.defineProperty(config.run, "authed", { enumerable: false, writable: true, configurable: false, value: [] });
			runKey.trusted = true;
			keyTracker.Λ = runKey.Λ;//config.run.Λ;
			//console.log( "2 set key ", keys.Λ)
			//keys.set( keys.Λ, runKey );


			var runKey2 = Key(config.run.Λ);
			runKey2.trusted = true;
			// generated a ID but throw it away; create config.run key record.
			keyTracker.keys.delete(runKey2.Λ);
			runKey2.Λ = config.run.Λ;
			runKey2.authby = runKey;
			runKey2.maker = runKey2;
			runKey.authby = runKey2;
			runKey.maker = runKey;

			//console.log( "3 set key ", runKey2.Λ)
			keyTracker.keys.set(runKey2.Λ, runKey2);
			keyTracker.mkey = runKey2;

			pendingOps.forEach((p, index) => {
				if (p.maker === runKey2.Λ)
					runKey2.made.push(p.key);
				if (p.maker === runKey.Λ)
					runKey.made.push(p.key);
				// pendingOps[index] = null
			}
			)

			saveKeys( config.resume );
		} else {
			//console.log( "GOT FILE BACK???", buffer)
			var data = fc.Utf8ArrayToStr(buffer);
			//console.log( "...", data.length );
			try {
				console.log( "jsox parse?", data )
				var loaded_keys = JSOX.parse(data);
				//_debug && console.log( "data parsed ", loaded_keys);
				keyTracker = loaded_keys;

				var keyids;
				for( let key of loaded_keys.keys ) {
					keyProto(key.Λ, key[1] );
				}

				for( let keypair of loaded_keys.keys ) {
					var key = keypair[1];
					if (!key.maker) {
						console.log("Bad Key:", key);
						return;
					}

					key.maker.made.push(key);
					key.authby.authed.push(key);
					//console.log( "recover  key authby ", key, key.authby )
				}
				Object.defineProperty(config.run, "made", { enumerable: false, writable: true, configurable: false, value: [] });
				Object.defineProperty(config.run, "authed", { enumerable: false, writable: true, configurable: false, value: [] });

				//console.log( "new keys after file is ... ", keys );
				//console.log( "new mkey after file is ... ", mkey );
			} catch (error) {
				console.log("bad key file", error);
				//fs.unlink( fileName );
			}
		}
		//console.log("no error", keys.length());
		//#ifdef IS_VOID
		if (keyTracker.keys.size === 0) {
			//console.log( Object.keys( keys ).length)
			console.log("NEED  ROOT KEY INITIALIZATION")
			var key = Key(config.run.Λ);
			key.authby = key;
			key.trusted = true;
			//console.log( "created root key", key );
			keyTracker.mkey = key;
			//keyTracker.keys.set( key.Λ,  key );
			//console.log( keyTracker.keys )
			keyTracker.keys.first = keyTracker.keys.get(key.Λ);
			//console.log( "new keys after file is ... ", keyTracker.keys );

			console.log("first run key set")
			keyTracker.keys.set(config.run.Λ, config.run);

			ID(key, config.run.Λ, (runkey) => {
				//console.log( "created root key", runkey );
				runkey.authby = key;
				//console.log( "throwing away ", runkey.Λ );
				keyTracker.keys.delete(runkey.Λ);
				console.log("replace run key set")
				keyTracker.keys.set(config.run.Λ, runkey);
				runkey.Λ = config.run.Λ;
				keyTracker.mkey = key;
				//console.log( "new keys ", Object.keys(keyTracker.keys) );
			});
			//console.log( "fragment keys is a function??", key_frags[0] )
			//key_frags.keys[frag.Λ] = key.Λ;

		}
		//#endif
		if (keyTracker.keys.size < 100) {
			//console.log("manufacture some keys......-----------", mkey)
			//Key( keys. )
			//console.log( "GOT:", keyTracker, keyTracker.mkey.made );
			ID(keyTracker.mkey, keyTracker.mkey.authby, (key) => {
				//console.log("newkey:", key)
				saveKeys();
			})
		}
		config.resume();

	});
}

function saveKeyFragments() {
	key_frags.forEach((a) => {
		console.log(" doing store IN", key_frags, a);
		fc.store(key_frags, a);
	})

}

exports.setRunKey = setRunKey;

function setRunKey(key) {
	if (config.run.Λ !== key) {
		var oldkey = keyTracker.keys.get(config.run.Λ);
		if( !oldkey ) {
			oldkey = Key(key);
			oldkey.authby = keyTracker.keys.get(key);
		}
		console.log("Set new run key: ", key, config.run.Λ, oldkey);
			// delete old key from map

		keyTracker.keys.delete(oldkey.Λ);
		console.log( "old run key: ", oldkey );
		config.run.Λ = oldkey.Λ = key;
		//console.log( "config.run is now? ", config.run.Λ )
		//console.log( "old key made: ", oldkey.made )
		//console.log( "old key authed: ", oldkey.authed )
		console.log( "oldkey made:", oldkey.made )
		oldkey.made.forEach(m => m.maker = key);
		//oldkey.authed.forEach( m=>m.authby=key );
		//console.log( "old key made: ", oldkey.made )
		// setup new key
		keyTracker.keys.set(key, oldkey);
		flushKeys();
	}

}

exports.setKeys = setKeys;
function setKeys(runkey) {

	console.log("Load Key Fragments; decided that these keys are the root......")
	//console.log( "O is config.run");
	loadKeyFragments(config.run);
	if (!key_frags || !key_frags.size) {
		// no fragments
		//console.log( 'need some keys')
	}
	else {
		if (key_frags.size == 1) {
			console.log("Key_frags ... these should be on the disk....")
			//console.log( key_frags );
			//key_frags.forEach( (a)=>{
			//    console.log(" doing store IN", key_frags, a  );
			//fc.store( key_frags, a );
			//} )
			//fc.store( key_frags, key_frags.keys );
		} else {
			console.log("recovered key_frags", key_frags.size, " plus one ");
		}
	}
}

//function
//console.log( "Schedule loadKeys with config.start")
config.start(loadKeys);

exports.xor = IdGen.xor;
exports.dexor = IdGen.dexor;
exports.u8xor = IdGen.u8xor;
exports.xkey = IdGen.xkey;
exports.ukey = IdGen.ukey;

var peers = [];
var branches = [];

server.addProtocol( "id.core", (ws)=>{
	ws.on( 'message',(_msg)=>{
		var msg = JSOX.parse( _msg );
		console.log( "received ", msg );
		if( msg.op === "hello" ) {
			var test = IdGen.xor( msg.runkey, config.run.Λ );
			var testkey = keyTracker.keys.get( test );
			if( testkey ) {
				// this remote might know how to validate a key...
				ws.send( JSOX.stringify( { op:"hello" } ) );
			}
			else {
				console.log( "Key from remote failed." );
				ws.close();
			}
		}
		else if( msg.op === "fork" ) {
			var test = IdGen.xor( config.run.Λ, exports.localAuthKey );
			if( test === msg.key ) {
				// this remote might know how to validate a key...
				branches.push( test );
			}
		}
		else if( msg.op === "request" ) {
				ID( msg.auth, msg.maker, (key)=>{
					ws.send( JSOX.stringify( { op:"key", newKey:key.Λ, key:msg.key } ) );
				})
			}
			else if( msg.op === "auth" ) {
				if( exports.authBy( msg.key, msg.auth ) )
					ws.send( JSOX.stringify( { op:"auth", status:true } ) );
				else
					ws.send( JSOX.stringify( { op:"auth", status:false } ) );
			}
			else if( msg.op === "maker" ) {
				if( exports.madeFrom( msg.key.msg.maker ) )
					ws.send( JSOX.stringify( { op:"made", status:true } ) );
				else
					ws.send( JSOX.stringify( { op:"made", status:false } ) );
			}
	})
	ws.on( 'error', (err)=>{

	})
	ws.on( 'close', (reason,desc)=>{
			// gunpeers gone.
			var i = peers.findIndex( p=>p===ws );
			if( i >= 0 )
					peers.splice( i, 1 );
			else
				console.log( "Error: Close on an untracked socket" );
	})
})
