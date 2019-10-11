
"use strict";

function protocolHidder() {

const _debug = false;



var protocol = {
	connect : connect,
	login : login,
	connectTo : connectTo,
	request : requestService,

	connected : false,
	loggedIn : false,
	doneWithAuth : false,
	username : null,
	userkey : null,
	requestKey(ident,cb) { wsAuth.requestKey( ident,cb )},
	closeAuth() { wsAuth.close(1000, "done"); },
	relogin( service, cb ) { 
		wsAuth.relogin( (user,message,reset)=>{
			if( user === false ) {
				cb( false, message );
				//pendingServiceRequest = false;
			} else {
			protocol.loggedIn = true;
			protocol.username = reset;
			protocol.userid = message;

			requestService(service, null, null, (msg,data)=>{
				if( !msg ) {
					cb( false, data );
					return;
				} else {
					cb( msg, data );
				}
				//cb();
			})
			}
		} ); 
	},
	createUser(a,b,c,d,e ) {
		wsAuth.createUser(a,b,c,d,e);
	}
};
const _protocol = protocol;
var connectEventHandler;

if( typeof localStorage === "undefined" ) { 
	//window.localStorage;
	window.localStorage = localStorage || { 
	   getItem( path ) { return sack.Sqlite.op( path, "" ) },
	   setItem( path,val ) { sack.Sqlite.so( path, val ) }
	}
}

//var u8xor = sack.u8xor;
JSON = exports.JSOX;

//var peer = `wss://chatment.com:8000/userAuth`;
var peer = "wss://" + location.host + "/userAuth";

function connect(cb) {
	//console.log( "calling connect?" );
	connectEventHandler = cb;
	openSocket( "chatment.core", 0, cb );
}

var config = {run:{ ['\u039b']:localStorage.getItem( "devkey" ) } };

if( !config.run['\u039b'] ) {
	config.run['\u039b'] = idGen.generator();
	localStorage.setItem( "devkey", config.run['\u039b'] )
}

var connections = 0; // how many times a connection was attempted

var wsAuth;

var loginCallback;
var loginTimer = null;
var secureChannel = false;

var stage = 0;
var connectTimer = null;
var pendingServiceRequest = null;
var currentProtocol = "";
var requestTimer = null;
var timeoutAuth;

function openSocket( protocol, _stage, cb, passkey, redirect ) {
	var redirected = false;
	//var https_redirect = null;
	var mykey = { key:idGen.generator(), step:0 }
	var myreadkey = { key:mykey.key, step:1 }
	if( !_stage )
		stage = 0;
	var connected = false;
	var ws;
	if( stage && !redirect )
		console.log( "Need to re-request service....", protocol, stage)
	connections++;
	cb( { op:"status", status:"connecting..."+stage + " " + protocol } );
	try {
		ws = new WebSocket( (_stage == 0?peer:redirect)
			, protocol
			, _stage>0?{
				perMessageDeflate: false,
				//ca : config.caRoot
			}:null
		);
		redirect = null;

		if( _stage === 1 ) {
			wsAuth = ws;
		} else if( _stage > 1 ) {
			cb( true, ws );
		}
	} catch( err ) {
		console.log( "CONNECTION ERROR?", err );
		return;
	}
        //console.log( "Got websocket:", ws, Object.getPrototypeOf( ws ) );

	function startup() {
		var key = localStorage.getItem( "clientKey" );
		//console.log( "key is:", typeof key, key );
		var skey = localStorage.getItem( "sessionKey" );
		if( !key && _stage === 0 ) {
			//console.log( "need key..." );
			ws.send( '{op:"getClientKey"}' );
		} else {
			if( _stage == 0 ) {
				//console.log( "request auth0" );
				ws.send( "AUTH" );
				_debug && console.log( "setup timeout auth.")
				timeoutAuth = setTimeout( ()=>{
			        cb( { op:"status", status: " AUTH not responding..." });
					console.log( "Auth timed out..." );
				}, 5000 );
			} else {
				ws.send( passkey );
				ws.send( `{op:"hello"}` );
			}
		}
	}

	ws.onopen = function() {
			connected = true;
			if( _stage == 0 )
				cb( { op:"status", status: "Opened...." });
			else if( _stage == 1 )
				cb( { op:"status", status: "Ready to login..." });
			else
				cb( { op:"status", status: "Connecting..." });

		// Web Socket is connected. You can send data by send() method.
		//ws.send("message to send");
		//console.log( "key is", mykey );
		//console.log( "keys:", key, skey );
		ws.send( mykey.key );
		ws.send = ((orig)=>(msg)=>{ _debug && console.log( "Send:",msg);orig( u8xor( msg,mykey))})(ws.send.bind(ws));
		startup();
	};
	ws.onmessage = function (evt) {
		var tmpmsg = u8xor( evt.data, myreadkey );
		var msg = JSON.parse( tmpmsg );
		if( !msg ) return;
		//_debug && 
		//console.log( "got message:", protocol, _stage, msg );
		if( _stage > 0 ) {
			if( msg.op === "addMethod" ) {
				try {
					var f = new Function( "JSON", "config", "localStorage", "idGen", msg.code );
					f.call( ws, JSON, config, localStorage, idGen );
					if( pendingServiceRequest ) {
						var tmp = pendingServiceRequest;
						if( requestTimer ) { clearTimeout( requestTimer ); requestTimer = null; }
						pendingServiceRequest = null;
						//console.log( "and so... invoke callback" );
						tmp( { op:"connected", ws:ws } );
						return;
					}

					if( "setEventCallback" in ws )
						ws.setEventCallback( cb );
					else if( _stage > 0 ) {
						stage = _stage; // socket opened, is good to advance stage?
						cb( {op:"login", ws:ws } );
					}
				} catch( err ) {
					console.log( "Function compilation error:", err,"\n", msg.code );
				}
				
			}
			else {
				if( this.fw_message )
					this.fw_message( ws, msg, tmpmsg );
			}
		} else if( _stage == 0 ) {
			//console.log( "Layer0 message", msg );
			if( msg.op === "setClientKey" ) {
				//console.log( "Got key:", msg );
				localStorage.setItem( "clientKey", msg.key );
				startup();
				return;
			}

			if( msg.op === "redirect" ) {
				//console.log( "redirect and close this...", msg );
				//msg : { id:"bBjnnAjH65xkXsDDqptZDZDrxOCsOtMWrrtrQXriJUg=", port:16579, address:"198.143.191.26" }
				secureChannel = true;
				redirected = true;
				//https_redirect = "https://"+msg.address+":"+msg.port+"/";
				openSocket( "Auth0", 1, cb, msg.id, "wss://"+msg.address+":"+msg.port+"/" );

				//console.log( "Layer0 redirect into system." );				
				if( _stage == 0 ) {
					//console.log( "close now." );
					ws.close(1000,"done");
					_debug && console.log( "clear auth time; got first redirect.")
					if( timeoutAuth ) {
						clearTimeout( timeoutAuth );
						timeoutAuth = null;
					}
				}
			}
		}
	};
	ws.onerror = function(err) {
		console.log( "Can I get anything from err?", err );
		if( _stage == 1 ) {
			//location.href=https_redirect;
		}
		if( !err.target.url.includes( "chatment.com" ) ) {
			//location.href="https://www.chatment.com"
		}
	}
	ws.onclose = doClose;
	function doClose(status) {
		//console.log(" Connection closed...", status );
		if( status.code == 1000 ) return;

		if( !connected ) {
			//console.log( "Aborted WEBSOCKET!", step, status.code, status.reason )
			cb( { op:"status", status:"connection failing..." + [".",".",".","."].slice( 0, connections%4 ).join('') });
			_debug && console.log( "Setup initial connection timer." );
			setTimeout( ()=>{openSocket(protocol,_stage,cb)}, 5000 );
            return;
        }
		connected = false;
		
        if( ( _stage == 0 || _stage == 2 ) && pendingServiceRequest ) {
			pendingServiceRequest(null);
			if( requestTimer ) { clearTimeout( requestTimer ); requestTimer = null; }
			pendingServiceRequest = null;

        }
		//console.log( "CLOSED WEBSOCKET!", protocol, stage, status )
		if( redirected && _stage == 0 ) {
			// success; nothiing to do.
			return;
		} else if( redirect && _stage >= 1 ) {
			if( _stage > 1 )
				console.log( "Cannot auto-reconnect; need to re-request service" );
			else
				openSocket( currentProtocol, stage = ++_stage, cb );
			redirect = null;
		} else {
			// stage 2 connection or non-redirect loss resets back to initial connect.			
			secureChannel = false;
			// reconnect this same protocol...
			_protocol.loggedIn = false;
			_protocol.doneWithAuth = false;
	        cb( { op:"status", status: "Disconnected... waiting a moment to reconnect..." });
			cb( { op:"disconnect" } )
			if( !connectTimer ) {
				_debug && console.log( "reconnect from start timeout" );
				connectTimer = setTimeout( ()=>{connectTimer = null; openSocket("chatment.core",0, connectEventHandler)}, 5000 );
			}

		}
		// websocket is closed.
	};
}

function abortLogin( ) {
	if( loginCallback ) {
		loginCallback( false, "Timeout" );
		loginCallback = null;
	}
}

function connectTo( addr, service, sid, cb ) {
	openSocket( service, 3, cb, sid, addr );
}

function login(user,pass, cb) {
	if( !loginCallback ) {
		if( stage !== 1 ) {
			if( stage > 1 )
				console.log( "already logged in?" );
			console.log( "Login is not ready yet..." );
			cb( false, "Login is not ready yet..." );
			return;
		}
		loginCallback = cb;
		if( wsAuth && stage == 1 ) {
			//console.log( "Send login to auth0" );
			wsAuth.login( user, pass, (a,b,c)=>{
				clearTimeout( loginTimer ) ;
				loginCallback=null;
				cb(a,b,c,wsAuth) 
			} );
			loginTimer = setTimeout( abortLogin, 5000 );
		}
	} else {
		console.log( "login already in progress" );
	}
}

function timeoutRequest() {
	if( pendingServiceRequest ) {
		pendingServiceRequest( { op:"status", status:"Service not available..." } );
		wsAuth.abortRequest();
		if( requestTimer ) { clearTimeout( requestTimer ); requestTimer = null; }
		pendingServiceRequest = null;
	}
}

function requestService( service, user_id, password, cb ) {
	if( !pendingServiceRequest ) {
		currentProtocol = service;
		// callback after addMethod of anther connection happens.
		pendingServiceRequest = cb;
		
		// { msg: "login", user:user_id, pass:password, devkey: localStorage.getItem("clientKey") }

		function doRequest() {
			_debug && console.log( "SETUP TIMEOUT REQUEST" );
			requestTimer = setTimeout( timeoutRequest, 5000 );
			wsAuth.request( service, function(msg,data) {
				//console.log( "got requested service:", service, msg )
				if( !msg ) {
					cb( false, data );
					return;
				}
				// {op:"serviceReply", id:"B3D2Z$EvTox_9Pf$VAot8i6wC$JZPV0rHlW8zWAjIHQ=",port:32678,address:"198.143.191.26",service:"KCHATAdmin"}
				//redirect = "wss://"+msg.address+":"+msg.port+"/";
				//https_redirect = "https://"+msg.address+":"+msg.port+"/";
				currentProtocol = msg.service;
				secureChannel = true;
				openSocket( msg.service, msg.service==="KCHAT"?2:3, cb, msg.id, "wss://"+msg.address+":"+msg.port+"/" );
				//ws.close(); // trigger connect to real service...
			} );
		}

		if( user_id && password ) {
			_debug && console.log( "DOING LOGIN" );
			wsAuth.login( user_id, password, ( success, userid, username )=>{
				protocol.username = username;
				protocol.userid = userid;
				if( success ) {
					doRequest();
				} else {
					cb( { op:"status", status:userid } )
					pendingServiceRequest  = null;
				}
			} )
		} else {
			if( wsAuth ) {
				_debug && console.log( "USING EXSITING AUTH AND GETTING MORE" );
				doRequest();
			} else
				cb( { op:"status", status:"Not Logged In" } );
		}
	} else {
		pendingServiceRequest( { op:"status", status:"Service request pending..." } );
	}
}


	return protocol;
}

var protocol = protocolHidder();