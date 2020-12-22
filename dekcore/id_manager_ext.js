"use strict";

//console.log( "using require: ", require, module )
var server = require( "./https_server.js")
var config = require('./config.js');
//console.log( "config is ", config.run.root, "and which require ?" );
const vfs = require( "sack.vfs" );

const fc = require('./file_cluster.js')
const Entity = require('./Entity/entity.js')
const IdGen = require("./util/id_generator.js");
var idGen = IdGen.generator;


var key_frags = new Map();
const _debug = false;
// key_frags[key] = keys
// #1: { }
//Map.prototype.length = function() { return Object.keys( keys ).length - 5
//}
var keys = new Map();
var mkey;

function initKeys() {
	keys.toString = () => {
		var leader = `{"Λ":"${keys.Λ}"
			,"mkey":"${mkey && mkey.Λ}"
			,"lkey":"${local_authkey&&local_authkey.Λ}"
			,"pkey":"${public_authkey&&public_authkey.Λ}"
			,"keys":`;
		var footer = '}';
		var buffer = null;
		keys.forEach((key, index, 
mem) => {
			if (!buffer) buffer = '{'; else buffer += '\n,';
			buffer += '"' + key.Λ + '":' + key.toString();
		});
		if (buffer) buffer += '}';
		return leader + buffer + footer;
	}
}
initKeys();


function keyProto(Λ, o) {
	var key = o || {
		maker: null
		, Λ: Λ
		, authby: null
		, requested: 0  // count
		, trusted: false // boolean
		, invalid: false // fail all auth and do not persist
		, authonly: true // don't send copies to other things
		, created: new Date().getTime()
		, time: config.run.timeOffset
	};
	["made", "authed"].forEach(prop => {
		Object.defineProperty(key, prop, { enumerable: false, writable: true, configurable: false, value: [] });
	})

	//var mystring;
	key.toString = () => {
		//if( !mystring ){
		var _a = key.authby;
		if (!_a) key.authby = key.Λ;
		else key.authby = key.authby.Λ;

		//console.log( "debug keytostring:", key.maker );
		var mystring = JSON.stringify(key);
		//console.log( mystring );
		key.authby = _a;
		//key.maker = _m;
		//}
		return mystring;
	}

	return key;
}

var pendingMakers = [];

function Key(maker_key, askey, callback ) {
	if( typeof askey === 'function' ) {
		callback = askey;
		askey = null;
	}
	var key = null;
	var real_key;
	//console.log( "KEY IS OF COURSE :", typeof maker_key)
	if( !callback )
		throw new Error( "Key making is now async... you need a callback." );

	// see if the maker is a local key...
	// if it's not we have to ask upstream for the key to be made.
	if ( ( typeof (maker_key) !== "string" ) && ( "Λ" in maker_key ) ) real_key = keys.get(maker_key.Λ);
	else real_key = keys.get(maker_key);
	//if (real_key) maker_key = real_key.Λ;
	//console.log( "maker", maker_key );


	//console.log( "raw key is:", key.Λ, key.maker, maker_key );
	if (real_key) {
		console.log( "Make local key without request...")
		key = keyProto(idGen());
		key.maker = maker_key; // always by name here (real key is maker)
		keys.set(key.Λ, key);
		callback( key );
		//console.log( "maker now has ", real_key.made.length +1, "keys")
		real_key.made.push(key);
	}
	else {
		console.log( "Send key making request..." );
		pendingMakers.push({ maker: maker_key, key: key, callback: callback });
		ws.send( {op:"key", maker:maker_key } );
	}
	//console.log("SET KEY ", key.Λ, key);

	//console.log( "generated key ", key.Λ )
	return undefined; // don't return anything, instead use the callback;
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
	if (keys.get(key))
		return validateKey(key, (k) => { return k.authby });
	return false;
}

exports.authBy = (key, auth,cb) => {
	auth = keys.get(auth);
	if (!auth) return false;
	if (key=keys.get(key)) {
		do {
			if( !key.authby ){
				ws.send( {op:"auth", key:key.Λ } );
			}
			if (key.authby === auth)
				return true;
			if (key.invalid)
				return false;
			key = key.authby;
		} while (key);
	}
	return false;
}

exports.madeFrom = (key, maker) => {
	let _maker = keys.get(maker);
	if (!_maker) return false;
	if (keys.get(key)) {
		do {
			if (key.maker === maker)
				return true;
			//if( key.maker.Λ === maker )
			//    return true;
			if (key.invalid)
				return false;
			key = key.maker;
		} while (key);
	}
	return false;
}

var vol = null;
var sqlDb = null;
var local_authkey;

Object.defineProperty(exports, "localAuthKey", {
	get: function () {
		//console.log( "local authkey request..." );
		if (local_authkey)
			return local_authkey;
		//console.log( "create a new local authority", config.run.Λ );
		var tmpkey;
		if( !vol ){
			Key(config.run.Λ, null, (tmpkey)=>{
				let storkey = vfs.Sqlite.op( config.run.Λ + "/lid", (tmpkey).Λ );
				if( storkey !== tmpkey.Λ) {
					keys.delete( tmpkey.Λ )
					var maker = keys.get(tmpkey.maker);
					var index = maker.made.find( k => k === tmpkey );
					maker.made.splice( index, 1 );
					tmpkey = keys.get( storkey );
				}else {
					tmpkey.authby = keys.get(config.run.Λ);
				}
				vol = vfs.Volume( null, storkey );
				sqlDb = vol.Sqlite( "idManager.db" );
				vfs.Λ();
			});
			while( !vol ) {
				console.log( "localauth pause 1")
				vfs.Δ();
			}
			console.log( "localauth started...")
		}
		Key(config.run.Λ, null, (tmpkey) =>{
			local_authkey = sqlDb.op( "lid", tmpkey.Λ )
			if( local_authkey !== tmpkey.Λ) {
					console.log( "reset key to local key")
				keys.delete( tmpkey.Λ )
				keys.set( local_authkey, tmpkey );
				tmpkey.Λ = local_authkey;
				//var maker = keys.get( tmpkey.maker );
				//var index = maker.made.find( k => k === tmpkey );
				//maker.made.splice( index, 1 );
				//tmpkey = keys.get( local_authkey );
			}else {
				tmpkey.authby = keys.get(config.run.Λ);
			}
			vfs.Λ();

		})
		while( !vol ) {
			console.log( "localauth pause 2")
			vfs.Δ();
		}
		return local_authkey;
	}
});

var public_authkey;
Object.defineProperty(exports, "publicAuthKey", {
	get: function () {
		if (public_authkey)
			return public_authkey;
		//console.log( "create a new local authority", config.run.Λ );
		// dyanmic key; creates a new peristent key though....
		if( !vol ){
			let storkey = vfs.Sqlite.op( config.run.Λ + "/pid", (tmpkey=Key(config.run.Λ)).Λ );
			if( storkey !== tmpkey.Λ) {
				keys.delete( tmpkey.Λ )
				tmpkey.madeFrom.made.delete( tmpkey.Λ );
				tmpkey = keys.get( storkey );
			}else {
				tmpkey.authby = keys.get(config.run.Λ);
			}
			vol = vfs.Volume( null, storkey );
			sqlDb = vol.Sqlite( "idManager.db" );
		}
		public_authkey = sqlDb.op( "pid", (tmpkey=Key(config.run.Λ)).Λ );
		// this is one of those illegal operations.
		if( local_authkey !== tmpkey.Λ) {
			keys.delete( tmpkey.Λ )
			tmpkey.madeFrom.made.delete( tmpkey.Λ );
			tmpkey = keys.get( public_authkey );
		}else {
			tmpkey.authby = keys.get(config.run.Λ);
		}
		return public_authkey;
	}
});

exports.delete = function deleteKey(key, maker) {
	if( !maker )
		throw new Error( "Key deletion requires maker" );
	if( !key.madeFrom || !key.authby ) {
		console.log( "Delete has to be passed to upstream..." );
		throw new Error( "Unimplemented" );
	}

	key = (typeof key === 'object' && 'Λ' in key) ? key : keys.get(key);
	if (key) {
		var makerKey = keys.get(maker);
		var index = makerKey.made.find( k => k === key );
		makerKey.made.splice( index, 1 );

		index = key.authby.authed.find( k=>k===key );
		key.authby.authed.splic( index, 1 );

		keys.delete(key);
		key.made.forEach((m) => { deleteKey(m) });
		key.authed.forEach((a) => { deleteKey(a) });
	}else {
		throw new Error( "Failed to delete invalid key." );
	}
}


var pendingKeys = [];

exports.ID = ID;
function ID(making_key, authority_key, callback) {
	let msg = null;
	var localAuth = keys.get( (typeof authority_key === "string")?authority_key:authority_key.Λ );
	var localMake = keys.get( (typeof making_key === "string")?making_key:making_key.Λ );
	//console.log( "keys;", keys );
	//console.log( "localAuth:", localAuth?localAuth.toString():"NULL" );
	//console.log( "localMake:", localMake?localMake.toString():"NULL" );
	if( !localAuth ) {
		if( localMake ) {
			Key( making_key, null, (key)=>{
				console.trace( "no auth, local make", making_key, authority_key );
				ws.send( msg={op:"requestAuth", key:key, auth:authority_key, maker:making_key} );
				pendingKeys.push( { msg:msg, callback:(key)=>{

				} } );
			} );
		}
		else {
			ws.send( msg={op:"request", key:idGen(), auth:authority_key, maker:making_key} );
			pendingKeys.push( { msg:msg, callback:callback} );
		}
	} else {
		if( localMake ) {
			Key(making_key, null, (newkey)=>{
				newkey.authby = authority_key;
				console.log( "authkey", newkey.Λ, localAuth )

				localAuth.authed.push(newkey);
				flushKeys();

				if (authority_key)
					newkey.authby = authority_key
				console.log( "made a new key", newkey.Λ );
				if (callback)
					callback(newkey);
			});

		} else {
			ws.send( msg={op:"requestMake", key:idGen(), maker:making_key} );
			pendingKeys.push( { msg:msg, callback:callback} );
		}
	}
}

function validateKey(key, next, callback) {
	let ID;
	if (!key) {
		return false;
	}
	if (key.Λ) ID = keys.get(key.Λ);
	else ID = keys.get(key);
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
		if (key === config.run.Λ) {
			console.log("validate success because key is config.run")
			return true;
		}
		if (ID.maker === ID.Λ)
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
	if (key.Λ) ID = keys.get(key.Λ);
	else ID = keys.get(key);
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
		if (key === config.run.Λ) {
			console.log("validate success because key is config.run")
			return true;
		}
		if (ID.maker === ID.Λ)
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

var flushTimer = null;
process.on( 'exit', ()=>{
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


function saveKeys(callback) {
	var fileName = "core/id.json"
	//console.log( "Saving keys:", keys );
	fc.store(fileName, keys, callback);
}

function TrackKeyFrags() {
	let frag = key_frags[0];

	if (!frag) {
		var fixup = () => {
			if (typeof Entity !== "Object")
				config.start(fixup);
			key_frags = Entity.create(config.run).create(keys);
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
						//console.log( "about to parse this as json", data );
						var reloaded_keys = JSON.parse(data);
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
	//console.log( "Load Keys")
	var result;
	var fileName = "core/id.json";
	//_debug&&console.log("CONFIG DEFER.... ");
	//config.defer(); // save any OTHER config things for later...

	_debug&&console.log("RELOAD STATIC FILE....")

	//console.log( "fc.reload... ")
	fc.reload(fileName, (error, buffer) => {
		if (error) {
			console.log("Reload failed", error, "Initialize root keys")
			//if( keys.size === 1 ) {
			//let newkey =  idGen.generator();
			//console.log(  newkey.toString() );

			// this callback will be immediate; it's a localonly make.
			var runKey = null;

			var key = runKey = keyProto(idGen());
			key.maker = config.run.Λ; // always by name here (real key is maker)
			keys.set(key.Λ, key);

			Object.defineProperty(config.run, "authed", { enumerable: false, writable: true, configurable: false, value: [] });
			runKey.trusted = true;
			keys.Λ = runKey.Λ;//config.run.Λ;

			var runKey2 = null;
			Key(runKey.Λ, null, (key)=>{
				runKey2 = key;
				// generated a ID but throw it away; create config.run key record.
				keys.delete(runKey2.Λ);

				runKey2.Λ = config.run.Λ;
				runKey2.authby = runKey;
				runKey.authby = runKey2;
				console.log( "3 set key ", runKey2.Λ)
				keys.set(runKey2.Λ, runKey2);

				mkey = runKey2;
		
				pendingMakers.forEach((p, index) => {
					if (p.maker === runKey2.Λ)
						runKey2.made.push(p.key);
					if (p.maker === runKey.Λ)
						runKey.made.push(p.key);
					// pendingMakers[index] = null
				})
			console.log( "SAVE ROOT KEYS and resume..." );
				saveKeys( config.resume );
			});

		} else {
			//console.log( "GOT FILE BACK???")
			var data = fc.Utf8ArrayToStr(buffer);
			//console.log( "...", data.length );
			try {
				//console.log( "json parse?")
				var loaded_keys = JSON.parse(data);
				//console.log( "data to parse ", loaded_keys);
				keys.Λ = loaded_keys.Λ;
				var keyids;
				(keyids = Object.keys(loaded_keys.keys)).forEach((keyid) => {
					//console.log( "key and val ", keyid, val );
					var key = keyProto(keyid, loaded_keys.keys[keyid]);
					//console.log( "recover key", keyid )
					keys.set(keyid, key);
					//key.toString =
				});
				keyids.forEach((keyid) => {
					var key = keys.get(keyid);
					if (!key.maker) {
						console.log("Bad Key:", keyid, key);
						return;
					}
					var maker = keys.get(key.maker);
					//console.log( "key and val ", keyid, key );
					//console.log( "maker failed?", maker, key.maker )
					maker.made.push(key);
					if (key.authby = keys.get(key.authby))
						key.authby.authed.push(key);
					//console.log( "recover  key authby ", key, key.authby )
				});
				mkey = keys.get(loaded_keys.mkey);

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
		if (keys.size === 0) {
			//console.log( Object.keys( keys ).length)
			console.log("NEED  A KEY")
			var key = Key(config.run.Λ, null, key=>{

				key.authby = key;
				key.trusted = true;
				//console.log( "created root key", key );
				mkey = key;
				//keys.set( key.Λ,  key );
				//console.log( keys )
				keys.first = keys.get(key.Λ);
				//console.log( "new keys after file is ... ", keys );

				console.log("first run key set")
				keys.set(config.run.Λ, config.run);

				ID(key, config.run.Λ, (runkey) => {
					//console.log( "created root key", runkey );
					runkey.authby = key;
					//console.log( "throwing away ", runkey.Λ );
					keys.delete(runkey.Λ);
					console.log("replace run key set")
					keys.set(config.run.Λ, runkey);
					runkey.Λ = config.run.Λ;
					mkey = key;
					//console.log( "new keys ", Object.keys(keys) );
				});
				//console.log( "fragment keys is a function??", key_frags[0] )
				//key_frags.keys[frag.Λ] = key.Λ;
			});
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
		var oldkey = keys.get(config.run.Λ);
		if( !oldkey ) {
			oldkey = Key(key);
			oldkey.authby = keys.get(key);
		}
		console.log("Set new run key: ", key, config.run.Λ, oldkey);
			// delete old key from map

		keys.delete(oldkey.Λ);
		console.log( "old run key: ", oldkey );
		config.run.Λ = oldkey.Λ = key;
		//console.log( "config.run is now? ", config.run.Λ )
		//console.log( "old key made: ", oldkey.made )
		//console.log( "old key authed: ", oldkey.authed )
		if( oldkey )
			oldkey.made.forEach(m => m.maker = key);
		//oldkey.authed.forEach( m=>m.authby=key );
		//console.log( "old key made: ", oldkey.made )
		// setup new key
		keys.set(key, oldkey);
		saveKeys();
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

//-----------------------------------------

const WebSocket = vfs.WebSocket.Client;
var ws = null;

function openHello( remote, rid, callback ) {

	var confirmed = false;
	var ws = new WebSocket( "wss://" + remote, ["id.core"], {
		perMessageDeflate: false
	});
	var runkeyt;
	var runkeyr;

	ws.on( "open", ()=>{
		console.log( "remote opened..." );
		var tmpkey = IdGen.generator();
		runkeyt = IdGen.xkey( tmpkey, 0 );
		runkeyr = IdGen.xkey( tmpkey, 1 );

		//console.log( "connect: ", config.run.Λ );
		console.log( "This should be a more dynamic key?", tmpkey );
		ws.send( tmpkey );
		ws.send = ((orig)=>(buf)=>orig(IdGen.u8xor( buf,runkeyt) ) )(ws.send.bind(ws))
		ws.send( JSON.stringify( {op:"hello", runkey:rid } ) );
	})

	ws.on( "message", (msg)=>{
		try {
			msg = JSON.parse( IdGen.u8xor(msg,runkeyr) );
		} catch(err) {
		// protocol error.
		console.log( "ID manager Protocol error", err );
		ws.close();
		return;
	}
		//if( !ws.key ) { ws.key = {key:msg,step:0};return }
			console.log( "ext hello got:", msg );
			if( msg.op === "hello") {
				console.log( "server accepted our hello..." );
				callback();
				//confirmed = true;
				//ws.close();
			}
			else if( msg.op === "key") {
				var id = pendingKeys.findIndex( key=>key.key === msg.key );
				if( id >= 0 ) {
					var req = pendingKeys[id];
					pendingKeys.splice( id, 1 );
					req.callback( msg.newKey );
				}else {
					ws.close();
				}
			}
			else if( msg.op === "error" ) {
				alert( msg.error );
		}
		else console.log( "what the hell??")
	});

	ws.on( "close", ()=>{
		if( !confirmed  ) {
			console.log( "remote closed..." );
			// without set timeout; I have no throttle control ....
			openHello();
		}
	})
}
exports.openHello = openHello;
