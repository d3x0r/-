"use strict";

const _debug = false;
const _debug_verbose = false; // these tend to be longer dump like logging things
const _debug_validate = false;

//console.log( "using require: ", require, module )
const util = require( 'util' );
const server = require( './https_server.js');
const sack = require( "sack.vfs" );
const JSOX=sack.JSOX;
const JSON=sack.JSOX;


//const db = sack.Sqlite( "id.db" );
var config = require('./config.js');
//console.log( "config is ", config.run.root, "and which require ?" );

const fc = require('./file_cluster.js')
const Entity = require('./Entity/entity.js')
const IdGen = require("./util/id_generator.js");
const idGen = IdGen.generator;
let loaded = false;
var keyRefs = new WeakMap();

exports.keyRef = keyRef;
// use for every object stored...
function keyRef( s ) {
	this.Λ = s || idGen();
	Object.defineProperty( this, "cb", {value:[]});
}
keyRef.prototype.toString = function() {
	return this.Λ;
}
keyRef.prototype.toJSOX = function() {
	return this.Λ;
}
keyRef.prototype.on = function(cb) {
	if(cb) this.cb.push(cb);	
	else { 
		//console.log( "ID CHANGE:", this ); 
		for( cb of this.cb ) cb(); this.cb.length = 0 }
}
keyRef.prototype.save = function() {
	let realid = tempKeyTracker.keys.get( this.Λ );
	if( !realid ) {
		realid = keyTracker.keys.get( this.Λ );
		if( !realid ) {
			throw new Error( "Invalid key reference." );
		}
		return Promise.resolve( realid.Λ.toString() );
	}
	return realid.save();
}

function keyRefEmitter() {
	//console.trace( "stringify");
	if( JSOX.stringifierActive )
		return JSOX.stringifierActive.stringify( this.Λ);
	return JSOX.stringify( this.Λ );
}
function keyRefRecover(field,val) {
	//console.log( "has a field so... ", this, field, val );
	if( !field ) {
		let realid = tempKeyTracker.keys.get( this.Λ );
		if( !realid ) keyTracker.keys.get( this.Λ );
		if( !realid ) {
			//console.log( "Have to recover this key...", this );
			fc.get( this.Λ ).then( (key)=>{
				fc.map( key ).then( key=>{
					keyTracker.keys.set( key.Λ, key );
					commitKeyTracker()
					if( key.maker instanceof Promise )
						key.maker.then( (maker)=>{
							maker.made.push( key );
						})
					else
						key.maker.made.push( key );
					if( key.authby instanceof Promise )
						key.authby.then( (auth)=>{
							auth.authed.push( key );
						})
					else
						key.authby.authed.push( key );
				})
				return key;
			} );
			return this;
		} else {
			console.log( "found existing key, returning real key.", realid,"for" ,this );
		}
		return realid;
	}else{
		this[field] = val;
	}
	return val;
}

function KeyTracker() {
	this.Λ = null;
	this.mkey = null;
	this.lkey = null;
	this.pkey = null;
	this.keys = new Map();
	//this.fragMaps = null;
	//this.deletes = [];
}

// can get replaced on reload?
var keyTracker = new KeyTracker();
const tempKeyTracker = new KeyTracker();

function keyTrackerEmitter(){
	const kt = {lkey:keyTracker.lkey?keyTracker.lkey.Λ.toString():null
		,mkey:keyTracker.mkey?keyTracker.mkey.Λ.toString():null
		,pkey:keyTracker.pkey?keyTracker.pkey.Λ.toString():null
		,keys:[]
		};
	keyTracker.keys.forEach( (key,id)=>kt.keys.push(id));
	return kt;
	
}

function commitKeyTracker() {
	if( !loaded ) return;
	fc.put( keyTrackerEmitter(), {id:config.run.keyTracker} ).then(id=>{
		if( !config.run.keyTracker) {
			config.run.keyTracker = id;
			console.log( "Saving an identifier for the root key tracker")
			config.commit();
		}
		//console.log( "SAVED KEY TRACKER INFO" );
	})
}

//JSOX.registerToFrom( "idkt", keyTracker.prototype );

// default parser behavior; but revives using KeyTracker as a type
var parserResult = null;
function receiveJSOXObject( value ) {
	if( parserResult )
		parserResult(value);
}

function keyStringProxy( id ){
	const ksp = new Proxy( id, {
		get(obj,property) {


		},
		set(obj,property,val) {

		},
	} );

}


function keyProto(Λ, o) {
	if( !(this instanceof keyProto) ) return new keyProto(Λ, o)
	//var key = o || {
	this. maker     = null
	// need this to be more of a reference that can update itself
	this. Λ         = new keyRef();
	this. authby    = null
	this. requested = 0  // count
	this. trusted   = false // boolean
	this. invalid   = false // fail all auth and do not persist
	this. authonly  = true // don't send copies to other things
	this. created   = new Date()
	if( o ) Object.assign( this, o );
	["made", "authed"].forEach(prop => {
		Object.defineProperty(this, prop, { enumerable: false, writable: true, configurable: false, value: [] });
	})
}

const pendingSaves = [];

keyProto.prototype.save = function() {
	if( keyTracker.keys.get( this.Λ.toString() ) ) // only temporary, do nothing.
		return true;
	const key = this;
	this.saved = true; // calls setter to do save.
	return this.saved;
	/*.then((r)=>{
		if( r.toString() !== key.Λ.toString() ){
			key.Λ = r;
			return key.saved.then( (r)=>{
				if( r.toString() !== key.Λ.toString() ){
					console.log( "FAIL", r, key );
				console.log( "Re-saved with updated key refrence in key...");
				return r;
			})
		}
		else console.log( "Okay we can stop saving this reference key" );
		return r;

	});
	*/
}

Object.defineProperty(keyProto.prototype, "saved", { enumerable: false, configurable: false
	, get(){ 
		let ps;
		if( ps =pendingSaves.find( ps=>ps.key===this )) return ps.p; // saved.
		//console.log( "Find key in keytracker.", pendingSaves);
		if( keyTracker.keys.get( this.Λ.toString() ) )
			return Promise.resolve( this.Λ );
		else
			return Promise.resolve( false );
	 }
	, set(val){
		//console.log( "Key Saved?", this, val)
		if( val ) {
			//console.trace( "----------------------------------- SAVE KEY ------------------------------- ")
			const this_ = this;
			function clearPending( this_ ) {
				var p = pendingSaves[pendingSaves.length-1];
				//console.log( "p is:", p, pendingSaves )
				//p.p
			}
			function dependSave( key ) {
				var maker;
				maker = key.maker
				if( maker && !maker.saved ) {
					maker.saved = true;
				}
				var auther;
				auther = key.authby;
				if( auther && !auther.saved ) {
					auther.saved = true;
				}
				//console.trace( "push pending save...", this_);
				let p;
				//console.log( "Saving key to file cluster..." );
				pendingSaves.push( { key:this_, p:p=fc.put( this_ ).then( (newId)=>{
						//console.log( "Saved key has a new ID...", newId );
						keyTracker.keys.delete( this_.Λ.toString(), this_ );
						this_.Λ.Λ = newId;
						keyTracker.keys.set( this_.Λ.toString(), this_ );
						this_.Λ.on();
						fc.put( this_ );
						commitKeyTracker()
						return this_.Λ;
					} ) 
				}
				)
				p.then( (p)=>{
					const zz = pendingSaves.findIndex( ps=>ps.key === this_ );
					if( zz >= 0 )
						pendingSaves.splice( zz, 1 );
					return p;
				})
				
			}
			//console.log( "this is a full key?", this );
			if( tempKeyTracker.keys.get( this.Λ.toString() ) ) {		
				//console.log( "Promoting temporary key to permanent key (save this key, and all related keys)" );
				tempKeyTracker.keys.delete( this.Λ.toString() ); // remove from temporary
				keyTracker.keys.set( this.Λ.toString(), this );  // put in permanent
				commitKeyTracker()
				dependSave( this );   // save required other keys and this key
			}else {
				if( !pendingSaves.find( ps=>ps.key===this )) {
					//console.log( "Already saved, just update?");
					const p=fc.put( this, {extraEncoders:[{tag:'',p:keyRef,f:keyRefEmitter }]} );
					pendingSaves.push( { key:this_, p:p } ); 
					p.then( (p)=>{
						const zz = pendingSaves.findIndex( ps=>ps.key === this_ );
						if( zz >= 0 )
							pendingSaves.splice( zz, 1 );
						return p;
					})
					
				}else {
					//console.log( "already saved, still pending a save, skip this mark to save.")
				}
			}
		}
	} }
);


var pendingOps = [];
var firstKey = true;
function Key(maker_key, askey) {
	var key = null;
	var real_key;
	//console.log( "KEY IS OF COURSE :", typeof maker_key, maker_key)
	//console.log( "keyTracker.keys:", keyTracker.keys );
	if( maker_key && ( typeof (maker_key) !== "string" ) && ( "Λ" in maker_key ) ) {
		real_key = tempKeyTracker.keys.get(maker_key.Λ.toString());
		real_key = real_key || keyTracker.keys.get(maker_key.Λ.toString());
	}
	else{
		//console.log( "look up maker key in temp:", tempKeyTracker );
		real_key = tempKeyTracker.keys.get(maker_key);
		//console.log( "look up maker key:", keyTracker );
		real_key = real_key || keyTracker.keys.get(maker_key);
	}
	if( !firstKey && !real_key ) {
		console.log( "throw maker error:", maker_key, real_key, firstKey );
		throw( new Error( util.format( "Specified maker is not a known key.", maker_key ) ) );
	}
	firstKey = false;
	if (real_key) maker_key = real_key.Λ;
	//console.log( "maker", maker_key );
	key = keyProto();
		//.then( (id)=>{
			//key.Λ = idGen();
			_debug_verbose&&console.log( "Manufacturing key, storage id gives:", key.Λ, real_key, maker_key );
			//if( !real_key ) throw( "new key is undefined.", key, real_key );
			key.maker = real_key; // always by name here (real key is maker)

			//console.log( "raw key is:", key.Λ, key.maker, maker_key );
			if (real_key) {
				real_key.made.push(key);
				//console.log( "store updated key information");
				// made is reindexed on load anyway... could make a lot of temporary things
				// which won't have real references.
				//real_key.save();
			}
			else {
				console.log( "Real key doesn't exist yet; work on it.")
				pendingOps.push({ maker: maker_key, key: key });
			}

		//console.log("SET new, temporary KEY ", key.Λ, key);
		tempKeyTracker.keys.set(key.Λ.toString(), key);
		//console.log( "generated key ", key.Λ )
		
		return Promise.resolve( key ); 

	//} );
}

exports.Auth = (key) => {
	if( tempKeyTracker.keys.get( key.Λ ) || keyTracker.keys.get(key.Λ) )
		return validateKey(key, (k) =>{ if( k.authby === k ) throw new Error( "Hey, you're at the root already."); return k.authby } );
	return false;
}

exports.authBy = (key, auth, cb) => {
	auth = tempKeyTracker.keys.get(auth);
	auth = auth || keyTracker.keys.get(auth);
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

exports.madeFrom = async (key, maker, cb) => {
	if( cb )
		console.trace( "Warning This is now Async.");
	console.log( 'checking if key is made from...');
	
	let _maker = keyTracker.keys.get(maker);
	console.log( 'checking if key is made from...');
	if (!_maker) {
		return Promise.resolve(false);
	}
	if (tempKeyTracker.keys.get(key) || keyTracker.keys.get(key)) {
		do {
			if (key.maker === maker){
				return Promise.resolve(true);
			}
			//if( key.maker.Λ === maker )
			//    return true;
			if (key.invalid){
				return Promise.resolve(false);
			}
			key = key.maker;
		} while (key);
	}
	return Promise.resolve(false);
}

Object.defineProperty(exports, "localAuthKey", {
	get: async function () {
		//console.log( "Getting local authkey...", keyTracker.lkey );
		if (keyTracker.lkey)
			return Promise.resolve(keyTracker.lkey);
		//console.log( "create a new local authority", config.run.Λ );
		return Key(config.run).then( (key)=>{
			//console.log( "Resulting with local authkey:", key );
	        keyTracker.lkey = key;
			commitKeyTracker()
			// this is one of those illegal operations.
			keyTracker.lkey.authby = keyTracker.keys.get(config.run.Λ) || tempKeyTracker.keys.get(config.run.Λ);
			keyTracker.lkey.saved = true;
			return keyTracker.lkey;
                });
	}
});

Object.defineProperty(exports, "publicAuthKey", {
	get: async function () {
		console.log( "Getting public authkey...");
		if (keyTracker.pkey)
			return Promise.resolve(keyTracker.pkey);
		//console.log( "create a new local authority", config.run.Λ );
		return Key(config.run).then( (key)=>{
        	keyTracker.pkey = key;
			commitKeyTracker()
			keyTracker.pkey.saved = true;
			// this is one of those illegal operations.
			keyTracker.pkey.authby = keyTracker.keys.get(config.run.Λ);
			return keyTracker.pkey;
        });
	}
});

exports.delete = function deleteKey(key, maker) {
	if( !maker )
		throw new Error( "Key deletion requires maker" );
	
	key = (typeof key === 'object' && 'Λ' in key) ? key : ( tempKeyTracker.keys.get(key) || keyTracker.keys.get(key) );
	if (key) {
		var makerKey = tempKeyTracker.keys.get(maker) || keyTracker.keys.get(maker);
		var index = makerKey.made.find( k => k === key );
		makerKey.made.splice( index, 1 );

		index = key.authby.authed.find( k=>k===key );
		key.authby.authed.splice( index, 1 );

		tempKeyTracker.keys.delete(key);
		keyTracker.keys.delete(key);
		key.made.forEach((m) => { deleteKey(m) });
		key.authed.forEach((a) => { deleteKey(a) });
	}
	else 
		throw new Error( "Failed to delete invalid key" );
}


exports.ID = ID; function ID(making_key, authority_key, callback) {
	//stackTrace();
	_debug && console.log( "Making a key...... ", making_key.Λ || making_key, authority_key.Λ || authority_key )
	//_debug && console.log( "CONFIG RUN:", JSOX.stringify( config.run.Λ, null, 4 ), JSOX.stringify( keyTracker.keys.get( config.run.Λ),null,3 )  );
	//console.log( keyTracker.keys[making_key.Λ] );
	const id = config.run.Λ;
	if (!making_key) throw new Error("Must specify at least the maker of a key");
	//console.log( "CHECK IS:",id,  tempKeyTracker.keys.get( id ),keyTracker.keys.get(id) )
	if( ! ( tempKeyTracker.keys.get( id ) || keyTracker.keys.get(id) ) ) {
		console.trace("ID() waiting for config...", config.run.Λ, JSOX.stringify(config.run), tempKeyTracker, keyTracker.keys)
		config.injectStart( function() { ID(making_key, authority_key, callback); });
		return config.defer(); // save any OTHER config things for later...
	}

	authority_key = authority_key || keyTracker.keys.get(config.run.Λ);

	// make sure we get THE keys... and weren't just passed a key-like thing.
	if (!authority_key.Λ)
		authority_key = tempKeyTracker.keys.get(authority_key) || keyTracker.keys.get(authority_key);
	else {
		//console.log( "Resolve autho key ", authority_key, keyTracker.keys.get(authority_key.Λ) );
		authority_key = tempKeyTracker.keys.get(authority_key.Λ.toString()) || keyTracker.keys.get(authority_key.Λ.toString());
	}
	//console.log( "Resolve autho key ", authority_key );
	if (!making_key.Λ)
		making_key = tempKeyTracker.keys.get(making_key) || keyTracker.keys.get(making_key);
	else
		making_key = tempKeyTracker.keys.get(making_key.Λ.toString()) || keyTracker.keys.get(making_key.Λ.toString()); // things that have the ID might not be THE Key.

	//console.log( `making_key ${making_key.toString()}` );
	//console.log( `authority_key ${authority_key.toString()}` );

	if (making_key === authority_key)
		throw new Error("Invalid source keys");

	if( (!making_key || !validateKey(making_key, (k) => { if( k === k.maker ) throw new Error( "HEY YOU're AT THE ROOT" ); return k.maker }))
		|| (!authority_key || !validateKey(authority_key, (k) => { if( k === k.authby ) throw new Error( "HEY You're at the root" ); return k.authby }))) {
		throw new Error( JSON.stringify( { msg: "Invalid source key", maker: making_key, auth: authority_key } ) );
	}
	//console.log( "Key is a promise thing...");
	return Key(making_key).then( (key)=>{
                var newkey = key;
		newkey.authby = authority_key;
		_debug && console.log( "authkey", newkey.Λ, authority_key )

		authority_key.authed.push(newkey);

		if (authority_key)
			newkey.authby = authority_key
		//console.log( "made a new key", newkey.Λ );
		callback(newkey);
		return key; // chain to any other then's.
    })
	return undefined;// newkey.Λ;
}


function validateKey(key, next, callback) {
	let ID;
	if (!key) {
		console.log( "null is the key?");
		return false;
	}
	if (key.Λ) ID = tempKeyTracker.keys.get(key.Λ.toString()) || keyTracker.keys.get(key.Λ.toString());
	else ID = tempKeyTracker.keys.get(key) || keyTracker.keys.get(key.toString());
	_debug_validate && console.trace( "validate key ", key, !!ID, ID&&ID.trusted,ID&& ID.maker.Λ,ID&& ID.Λ, config.run.Λ );
	if (ID) {
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
	if (key.Λ) ID = tempKeyTracker.keys.get(key.Λ.toString()) || keyTracker.keys.get(key.Λ.toString());
	else ID = tempKeyTracker.keys.get(key) || keyTracker.keys.get(key);
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
	console.log( "Saving would already be done? (or will be done?)");
	return;
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
						//console.log( "about to parse this as json\n", data );
						//var reloaded_keys;
						parserResult = (value)=>{
							reloadedKeys = value;
						}
						//console.log("no error", reloaded_keys);
						//if( keys.length === 0 )
					} catch (error) {
						console.log(data);
						console.log("bad keyfrag file", error);
					}
				}
			});
	});
}

function keyReviver( field, val ) {
	if( !field ) {
		keyTracker.keys.set( this.Λ.toString(), this );
		// last pass has option to swap entire object.
		return this;
	} else {
		//console.log( "ID REVIVE:", field, val );
		if( val instanceof Promise ){
			const this_ = this;
			//console.log( "Adding to promised value to set field" );
			val.then( (fixup)=>{
				//console.log( "FIXUP OBJECT REFERENCE", field, fixup)
				return this_[field]=fixup;}
			);
		}
		if( field === 'Λ' ) this.Λ.Λ = val;
		else this[field] = val;
	}
}

function loadKeys() {
	var result;
	fc.addEncoders( [{tag:"id",p:keyProto,f:null }
				,{tag:'',p:keyRef,f:keyRefEmitter }] );
	fc.addDecoders( [{tag:"id",p:keyProto,f:keyReviver }
			] );

	if( !config.run.keyTracker ) {
		commitKeyTracker()
		//console.log( "SOMETHING:create new keys"  );
		return Key(config.run.Λ).then( (key)=>{
			var runKey = key;
			//console.log( "Got back first root key...", key)
			config.run.Λ = key.Λ.Λ;
			key.Λ.on( (newkey)=>{
				//console.log( "Key value updated...", newkey, key, config.run );
				config.run.Λ = key.Λ.toString();
				keyTracker.Λ = runKey.Λ.Λ;//config.run.Λ;
				config.commit();
			})
			Object.defineProperty(config.run, "authed", { enumerable: false, writable: true, configurable: false, value: [] });
			runKey.trusted = true;
			keyTracker.Λ = runKey.Λ.Λ;//config.run.Λ;
			//console.log( "Save was what?", p );
			return runKey.save().then( ()=>{
				//console.log( "Make second root key...", key);
				return Key(key).then( key=>{
					var runKey2 = key;
					runKey2.trusted = true;
					// generated a ID but throw it away; create config.run key record.
					//tempKeyTracker.keys.delete(runKey2.Λ.toString());
					//tempKeyTracker.keys.set(runKey2.Λ.toString(), runKey2 );
					runKey2.authby = runKey;
					runKey2.maker = runKey2;
					runKey.authby = runKey2;
					runKey.maker = runKey;
					//console.log( "Setting runkey2:", runKey2, runKey );
					keyTracker.mkey = runKey2;
					commitKeyTracker()
					var remainingOps = []
					pendingOps.forEach((p, index) => {
						if (p.maker === runKey2.Λ.toString() ) {
							runKey2.made.push(p.key);
							p.maker = runKey2;
						}
						else if (p.maker === runKey.Λ.toString() ){
							runKey.made.push(p.key);
							p.maker = runKey;
						}else
							remainingOps.push( p );
					})
					pendingOps = remainingOps;
					//console.log( "Saving keys and then resuming...");
					return runKey2.save().then( (id)=>{
						runKey.saved = true;
						//console.log( "config used to be:", config.run.Λ, "will be", runKey2.Λ, id );
						//config.run.Λ = runKey2.Λ.toString();
						//config.run.Λ = runKey2.Λ.Λ;

						return config.commit().then( ()=>{
							loaded = true;
							console.log( "And finally really resume?(bigbang) (just return resolution)" );
							//config.resume();

						} );
					});
					//saveKeys( config.resume );
				} );
			});
		});
	} 
	//console.log( "load Keys: root is config.run (or not)", config.run.Λ );

	//_debug&&console.log("CONFIG DEFER.... ");
	//config.defer(); // save any OTHER config things for later...

	_debug&& console.log("RELOAD STATIC FILE....first key", config.run.keyTracker  )

	//console.log( "fc.reload... ")
	return fc.get( config.run.keyTracker/*, {decoders:[{tag:"id",p:Key,f:null }]}*/ ).then(kt=>{
		let p = null;
		const DO = (f=>(p?p.then(f):(p=f())));
		const loadpkey = ()=> fc.get( kt.pkey ).then( key=>keyTracker.pkey =key);
		const loadlkey = ()=> fc.get( kt.lkey ).then( key=>keyTracker.lkey =key);
		const loadmkey = ()=>fc.get( kt.mkey ).then(o=>{
			keyTracker.mkey = o;
			//console.log( "Used config.run as the root key id... but what aobut the tracker?" );
			if( !o ){
				_debug&&console.log(  "Reload failed; Initialize root keys", config.run.Λ);
			} else {
				//console.log( "Reloaded root key !!!!!!!!!!!!!! (get auth key of it)", keyTracker );
				//console.log( "GOT FILE BACK???", buffer)
				//var data = fc.Utf8ArrayToStr(buffer);
				//console.log( "...", data.length );
				
				fc.map( o ).then( (o)=>{
					//console.log( "main saved keys:", JSON.stringify(keyTracker,null, 3) );
					//console.log( "Completed loading keys?");
					loaded = true;
					//config.resume();
				}); // reload all related values.
			}
		}).catch( (err)=>{
			console.log( "FAILED TO LOAD ROOT", err );
		} );
		if( kt.keys ) {
			kt.keys.forEach( (id)=>DO( ()=>fc.get(id).then(obj=>{
				keyTracker.keys.set( id, obj );
				return obj
			} ) ) )
		}
		if( kt.lkey ) DO( loadlkey )
		if( kt.pkey ) DO( loadpkey );
		if( kt.mkey ) DO( loadmkey );

		return p;
	})
}

exports.setRunKey = setRunKey;

function setRunKey(key) {
	if (config.run.Λ !== key) {
		var oldkey = keyTracker.keys.get(config.run.Λ.toString());
		if( !oldkey ) {
			Key(key).then( oldkey=>{
				oldkey.authby = keyTracker.keys.get(key);
                        });
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
		console.log( "set key:", key )
		//keyTracker.keys.set(key, oldkey);
		//flushKeys();
	}

}

exports.setKeys = setKeys;
function setKeys(runkey) {

	console.log("Load Key Fragments; decided that these keys are the root......")
	//console.log( "O is config.run");
	loadKeyFragments(config.run);
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
			var test = IdGen.xor( msg.runkey, config.run.Λ.toString() );
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
                	exports.localAuthKey.then( lak =>{
				var test = IdGen.xor( config.run.Λ.toString(), lak );
				if( test === msg.key ) {
					// this remote might know how to validate a key...
					branches.push( test );
				}
                        })
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
