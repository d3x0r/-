



//---------- lame connection stuff ------------------------

var Gun = require( '../util/gun/gun.js' );
var gun = Gun();// { wsc:{protocols:"gunDb"}, peers:[location.origin] } );

var key = config.run.Gun.text.random();

var db = gun.get( key );
//db.put( { userName: "Joe", email:"joe@joe.joe", password:"password" } );

var ws;
function wsConnect( protocol ) {
    var ws = new WebSocket( `wss://${location.host}`, protocol );
    ws.onopen = wsOpen;
    ws.onmessage = wsMessage;
    ws.onclose = wsClose;
    ws.protocolSpec = protocol;
     return ws;
}
var gunPeers = [];

var wsGun = null;

function gunWsConnect() {
    wsGun = wsConnect( ["gunDb"]);
    gunPeers.push( wsGun );
    wsGun.onopen = ()=>{
        gun.on('out',(msg)=>{
            msg=JSON.stringify(msg); 
            gunPeers.forEach( (peer)=>{peer.send(msg);})
        });
    }
    wsGun.onmessage = (msg)=>{ 
	msg = JSON.parse( msg.data);
	if( "forEach" in msg ) msg.forEach( m=>gun.on('in',JSON.parse(m)));
        else gun.on('in', msg ); 
    }
    wsGun.onclose = (close)=>{ 
        var i=gunPeers.findIndex(p=>p===close.target); 
        if( i >= 0 ) gunPeers.splice( i, 1 ); 
        else throw new Error( "Untracked Gun WS closed" );
        gunWsConnect(); // reconnect as normal
    }
    return wsGun;
}

function wsMessage( msg ) {
    //msg.data;
}
function wsOpen() {
    // yay.
    ws.send( JSON.stringify( {op:"login",key:key} ) );
}
function wsClose() {
    ws = wsConnect( ws.protocolSpec ); // reconnect
}
//console.log( "junk : ", key );

 gunWsConnect()
 ws = wsConnect( ["C&C"] );


document.getElementById( "createUser" ).addEventListener( "click", doCreateUser );
function doCreateUser( ) {
	    
}