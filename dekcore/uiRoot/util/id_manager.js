"use strict";

console.log("get id_generator...")
var IdGen = require("./util/id_generator.js");
var idGen = IdGen.generator;

exports.xor = IdGen.xor;
exports.dexor = IdGen.dexor;
exports.u8xor = IdGen.u8xor;

var keyServer;

const _debug = false;

var pendingOps = [];  // outstanding operations.


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
		Λ: Λ
	};

	//var mystring;
	key.toString = () => {
		return JSON.stringify(key);
	}

	return key;
}

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
	console.log( "What about this key are we validating??" );
	//if (keys.get(key))
	//	return validateKey(key, (k) => { return k.authby });
	return false;
}

exports.authBy = (key, auth,cb) => {
	if( connected ) {
		var id = idGen(); 
		pendingOps.push( { callback:cb, id:id } );
		ws.send( JSON.stringify( {op:"auth", id:id, key:key, auth:auth } ) );
	}
}

exports.madeFrom = (key, maker, cb) => {
	if( connected ) {
		var id = idGen(); 
		pendingOps.push( { callback:cb, id:id } );
		ws.send( JSON.stringify( {op:"made", id:id, key:key, maker:maker } ) );
	}
}


exports.delete = function deleteKey(key, maker) {
	if( connected ) {
		var id = idGen(); 
		pendingOps.push( { callback:cb, id:id } );
		ws.send( JSON.stringify( {op:"delete", id:id, key:key, maker:maker } ) );
	}
}


exports.ID = ID; 
function ID(making_key, authority_key, callback) {
	let msg = null;
	ws.send( msg={op:"request", id:idGen() ,auth:authority_key, maker:making_key} );
	pendingKeys.push( { msg:msg, callback:callback} );
}


//-----------------------------------------

const WebSocket = require('./ws.js');
var connected = false;
var ws = null;

function openHello() {

	var confirmed = false;
	var ws = new WebSocket(location.origin, ["id.core"] );
	var runkeyt;
	var runkeyr;

	ws.on( "open", ()=>{
		runkeyt = {key:config.run.Λ, step:0};
		runkeyr = {key:config.run.Λ, step:1};

		//console.log( "connect: ", config.run.Λ );
		ws.send( config.run.Λ );
		ws.send = ((orig)=>(buf)=>orig(idGen.u8xor( buf,runkeyt) ) )(ws.send.bind(ws))
		ws.send( JSON.stringify( {op:"hello", runkey:localStorage.get("sessionKey"), me:me} ) );
		connected = true;
	})

	ws.on( "message", (msg)=>{
		try {
			msg = JSON.parse( msg.data );
		} catch(err) {
			// protocol error.
			console.log( "ID manager Protocol error", err );
			ws.close();
			return; 
		}
		//if( !ws.key ) { ws.key = {key:msg,step:0};return }
			//console.log( "userprotocol hello got:", msg );
			if( msg.op === "hello") {
				confirmed = true;
				ws.close();
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
			else if( msg.op === "auth" ) {
				var idx = pendingOps.findIndex( op=>op.id == msg.id );

				if( idx < 0 ) {
					console.log( "Protocol error" );
					ws.close();
				} else {
					var op = pendingOps[idx];
					op.callback( msg.status );
					pendingOps.splice( idx, 1 );
				}
			}
			else if( msg.op === "made" ) {
				var idx = pendingOps.findIndex( op=>op.id == msg.id );
				if( !op ) {
					console.log( "Protocol error" );
					ws.close();
				} else {
					var op = pendingOps[idx];
					op.callback( msg.status );
					pendingOps.splice( idx, 1 );
					
				}
			}
			else if( msg.op === "error" ) {
				alert( msg.error );
		}
	});

	ws.on( "close", ()=>{
		connected = falses;
		if( !confirmed  ) {
			console.log( "remote closed..." );
			// without set timeout; I have no throttle control ....
			openHello();
		}
	})
}
openHello();
