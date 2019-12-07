console.log( "Register User PROTOCOL" )
var db = require( "./userDatabase.js" );

var peers = [];

//var runkeyt = {key:config.run.Λ, step:0};
//var runkeyr = {key:config.run.Λ, step:1};

//console.log( "user protocol look:", entity.look() );
//console.log( "user protocol inv:", entity.inventory );
console.warn( "Diredt output? UserProtocol Register?");

async function initServices() {
	var nearThings = await near;
	var nearNames = nearThings.map( near=>near.name);
	Promise.all( nearNames ).then( nearNames=>{
		var serviceDirectory = nearNames.find( near=> near === "Services" );

		if( serviceDirectory ){

			serviceDirectory = serviceDirectory.o;
		
			console.log( "service directory inventory:", serviceDirectory.inventory );
		}
	} )
	
}
initServices();

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

//console.log( "Is:", require('sack.vfs' ));
async function startup() {
	const WebSocket = (await require('sack.vfs')).WebSocket.Client;

function openHello() {
	var firewall = io.getInterface( "firewall" );
	console.log( "firewall interface:" , firewall )

	var confirmed = false;
	console.log( "... connection to dekcore; we're still a thread.. so... it's connected...");

	return;
	var ws = new WebSocket('wss://localhost:8000', ["dekware.core"], {
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
			console.log( "remote closed, wait 5 seconds, and re-open" );
			// without set timeout; I have no throttle control ....
			setTimeout( openHello, 5000 );
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

}
startup();