var db = require( "./userDatabase.js" );

var peers = [];

//var runkeyt = {key:config.run.Λ, step:0};
//var runkeyr = {key:config.run.Λ, step:1};

//console.log( "user protocol look:", entity.look() );
//console.log( "user protocol inv:", entity.inventory );

var serviceDirectory = entity.look().find( near=>near.name === "Services" );
if( serviceDirectory ){
	serviceDirectory = serviceDirectory.o;

	console.log( "service directory inventory:", serviceDirectory.inventory );
}

on( "connect", (ws)=>{
	return (()=>(msg)=>protocol( msg ) )()
})

function protocol( msg ) {
	if( msg.op ) {
		if( msg.op === "login" ) {

		}
	}
}

var creationQueue = [];

function addCreated(c) {
	creatingQueue.push( { tick:Date.now(), address:c } );
}

function tickCreation() {
	var now = Date.now();
	while( ( now - 60000 ) > creatingQueue[0].tick )
		creatingQueue.shift();
}

var checkCreation = (ad)=>! creationQueue.find( c=>c.address===a);


const WebSocket = require('ws');

function openHello() {
	var firewall = io.openDriver( "firewall" );
	console.log( "firewall interface:" , firewall )

	var confirmed = false;
	var ws = new WebSocket('wss://localhost:8000', ["karaway.core"], {
		perMessageDeflate: false
	});

	ws.on( "open", ()=>{
		//console.log( "connect: ", config.run.Λ );
		ws.send( config.run.Λ );
		var t;
		ws.send( JSON.stringify( {op:"hello", runkey:config.run.Λ, me:me} ) );
	})

	ws.on( "message", (msg)=>{
		//if( !ws.key ) { ws.key = {key:msg,step:0};return }
		if( msg.length ) {
			msg = JSON.parse( msg );
			//console.log( "userprotocol hello got:", msg );
			if( msg.op === "hello") {
				confirmed = true;
				ws.close();
			}
			if( msg.op === "error" ) {
				alert( msg.error );
			}
		}
		else console.log( "what the hell??")
	});

	ws.on( "close", ()=>{
		if( !confirmed  ) {
			console.log( "remote closed..." );
			// without set timeout; I have no throttle control ....
			openHello();
		}
		else {
			console.log( "initial negotiation success" );
		}
	})
}
openHello();

io.addProtocol( "karaway.core", (conn)=>{
    console.log( "connected , add peer", conn.upgradeReq.connection. remoteAddress )
    peers.push( conn );

    conn.on( 'message',(msg)=>{
		if( !conn.keyt ){
			conn.keyt = {key:msg,step:0};
			conn.keyr = {key:msg,step:0};
			conn.send = ((orig)=>(msg)=>orig( idGen.u8xor( msg, conn.keyt )))(conn.send);
			return;
		}
		try {
			msg = JSON.parse(idGen.u8xor(msg,conn.keyr));
        	console.log( "coreAuth is getting", msg );
		}catch(err) {
			console.log( "Protocol error:", msg );
			conn.close();
		}

		if( msg.op === "userLogin" ) {
			//var address = conn.upgradeReq.connection. remoteAddress;
			if( !db.loginUser(msg.username,msg.password,[],conn.upgradeReq.connection.remoteAddress, null, (key)=>{
				conn.send(  `{"op":"session","key":"${key}"}`) ;
			} ) ) {
				conn.send(  `{"op":"newLogin"}`);
			}
		}
		if( msg.op === "createUser" ) {
			if( checkCreation( conn.upgradeReq.connection.remoteAddress )
				&& db.updateUser( msg.client_id,msg.user,msg.email,msg.password ) )
				conn.send( `{"op":"gotoLogin"}` );
			else
				conn.send( `{"op":"failed"}`);
		}
		if( msg.op === "auth" ) {
			if( "id" in msg ) {
				console.log( "authenticate, and tell firewall to map this?" );
			}
			else {
				console.log( "Create user crash?");
				var user = db.createUser();
				console.log( "vm crash doesn't process crash?")
				conn.send( `{"op":"session","key":"${user}"}`) ;
			}
			//var firewallAddr = firewall.request();
			//conn.send( '{"op":"redirect", address:"' + firewallAddr  + '"}'
		}
		if( msg.op === "request" ) {

		}

    })
    conn.on( 'close', (reason,desc)=>{
        // gunpeers gone.
		console.log( "kc thing has closed?")
        var i = peers.findIndex( p=>p===conn );
        if( i >= 0 ) peers.splice( i, 1 );
    })
})
