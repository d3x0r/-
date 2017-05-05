"use strict";

//console.log( "using require: ", require, module )
const fs = require('fs');
var config = require('./config.js');
//console.log( "config is ", config.run.root, "and which require ?" );

const fc = require('./file_cluster.js')
const Entity = require('./Entity/entity.js')
console.log("get id_generator...")
var IdGen = require("./util/id_generator.js");
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

function Key(maker_key, askey) {

	var key = null;
	var real_key;
	//console.log( "KEY IS OF COURSE :", typeof maker_key)
	if ( ( typeof (maker_key) !== "string" ) && ( "Λ" in maker_key ) ) real_key = keys.get(maker_key.Λ);
	else real_key = keys.get(maker_key);
	if (real_key) maker_key = real_key.Λ;
	//console.log( "maker", maker_key );

	key = keyProto(idGen());
	key.maker = maker_key; // always by name here (real key is maker)

	//console.log( "raw key is:", key.Λ, key.maker, maker_key );
	if (real_key) {
		//console.log( "maker now has ", real_key.made.length +1, "keys")
		real_key.made.push(key);
	}
	else {
		pendingMakers.push({ maker: maker_key, key: key });
	}
	//console.log("SET KEY ", key.Λ, key);
	keys.set(key.Λ, key);
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
	if (keys.get(key))
		return validateKey(key, (k) => { return k.authby });
	return false;
}

exports.authBy = (key, auth) => {
	auth = keys.get(auth);
	if (!auth) return false;
	if (keys.get(key)) {
		do {
			if (key.maker === maker)
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

var local_authkey;
Object.defineProperty(exports, "localAuthKey", {
	get: function () {
		//console.log( "local authkey request..." );
		if (local_authkey)
			return local_authkey;
		//console.log( "create a new local authority", config.run.Λ );
		local_authkey = Key(config.run.Λ)
		// this is one of those illegal operations.
		local_authkey.authby = keys.get(config.run.Λ);
		return local_authkey;
	}
});

Object.defineProperty(exports, "publicAuthKey", {
	get: function () {
		if (public_authkey)
			return public_authkey;
		//console.log( "create a new local authority", config.run.Λ );
		public_authkey = Key(config.run.Λ)
		// this is one of those illegal operations.
		public_authkey.authby = keys.get(config.run.Λ);
		return public_authkey;
	}
});

exports.delete = function deleteKey(key, maker) {
	if( !maker ) 
		throw new Error( "Key deletion requires maker" );
	key = (typeof key === 'object' && 'Λ' in key) ? key : keys.get(key);
	if (key) {
		keys.delete(key);
		key.made.forEach((m) => { deleteKey(m) });
		key.authed.forEach((a) => { deleteKey(a) });
	}
}


exports.ID = ID; function ID(making_key, authority_key, callback) {
	//stackTrace();
	//console.log( "Making a key...... ", making_key.Λ, authority_key )
	//console.log( config.run.Λ );
	//console.log( keys[making_key.Λ] );
	if (!making_key) throw new Error("Must specify at least the maker of a key");
	if (!keys.get(config.run.Λ)) {
		//console.trace("ID() waiting for config...", config.run, keys)
		config.injectStart(() => { ID(making_key, authority_key, callback); });
		config.defer(); // save any OTHER config things for later...
		return;
	}
	if (!authority_key)
		authority_key = keys.get(config.run.Λ)

	if (!making_key.Λ)
		making_key = keys.get(making_key);
	else
		making_key = keys.get(making_key.Λ); // things that have the ID might not be THE Key.

	if (!authority_key.Λ)
		authority_key = keys.get(authority_key);
	else
		authority_key = keys.get(authority_key.Λ);

	//console.log( `making_key ${making_key.toString()}` );
	//console.log( `authority_key ${authority_key.toString()}` );

	if (making_key === authority_key)
		throw new Error("Invalid source keys");

	if (!making_key || !validateKey(making_key, (k) => { return keys.get(k.maker) }))
		if (!authority_key || !validateKey(authority_key, (k) => { return k.authby })) {
			//console.log("MakingKey", making_key);
			//console.log("AuthorityKey", authority_key);
			throw { msg: "Invalid source key", maker: making_key, auth: authority_key };
		}
	var newkey = Key(making_key);
	newkey.authby = authority_key;
	//console.log( "authkey", newkey.Λ, authority_key )

	authority_key.authed.push(newkey);

	if (authority_key)
		newkey.authby = authority_key
	//console.log( "made a new key", newkey.Λ );
	if (callback)
		callback(newkey);
	return newkey.Λ;
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
			var runKey = Key(config.run.Λ);
			Object.defineProperty(config.run, "authed", { enumerable: false, writable: true, configurable: false, value: [] });
			runKey.trusted = true;
			keys.Λ = runKey.Λ;//config.run.Λ;
			//console.log( "2 set key ", keys.Λ)
			//keys.set( keys.Λ, runKey );


			var runKey2 = Key(config.run.Λ);
			// generated a ID but throw it away; create config.run key record.
			keys.delete(runKey2.Λ);
			runKey2.Λ = config.run.Λ;
			runKey2.authby = runKey;
			runKey.authby = runKey2;

			//console.log( "3 set key ", runKey2.Λ)
			keys.set(runKey2.Λ, runKey2);
			mkey = runKey2;

			pendingMakers.forEach((p, index) => {
				if (p.maker === runKey2.Λ)
					runKey2.made.push(p.key);
				if (p.maker === runKey.Λ)
					runKey.made.push(p.key);
				// pendingMakers[index] = null 
			}
			)

			saveKeys( config.resume );
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
			var key = Key(config.run.Λ);
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

		}
		//#endif
		if (keys.size < 100) {
			//console.log("manufacture some keys......-----------", mkey)
			//Key( keys. )
			ID(mkey, mkey.authby, (key) => {
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

