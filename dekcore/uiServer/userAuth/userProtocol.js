var db = require( "./userDatabase.js" );

var peers = [];

console.log( "user protocol look:", entity.look() );
console.log( "user protocol inv:", entity.inventory );

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

const WebSocket = require('ws');

function openHello() {
	var firewall = io.openDriver( "firewall" );
	console.log( "firewall interface:" , firewall )

	var confirmed = false; 
	var ws = new WebSocket('wss://localhost:8000', ["karaway.core"], {
		perMessageDeflate: false
	});

	ws.on( "open", ()=>{
		console.log( "connect: " );
		ws.send( JSON.stringify( {op:"hello", runkey:config.run.Λ, me:me} ) );
	})

	ws.on( "message", (msg)=>{
		if( msg.length ) {
		console.log( "got:", msg );
		msg = JSON.parse( msg );
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
			setTimeout( 5000, openHello );
		}
	})
}
openHello();

io.addProtocol( "karaway.core", (conn)=>{
    //console.log( "connected gundb, add peer")
    peers.push( conn );

    conn.on( 'message',(msg)=>{
        console.log( "coreAuth is getting", msg );
		if( msg.op === "auth" ) {
			if( "id" in msg ) {
				console.log( "authenticate, and tell firewall to map this?" );
			}
			else {
				var user = db.createUser();
				ws.send( `{"op":"session","key":"${user}"}`);
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

