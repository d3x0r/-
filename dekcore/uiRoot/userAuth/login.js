

var username;
var password;
var button;
var yesButton;
var noButton;

function loadControls( parent ) {
	username = parent.getElementById( "username" );
	password = parent.getElementById( "password" );
	button = parent.getElementById( "click" );
	yesButton = parent.getElementById( "yes" );
	noButton = parent.getElementById( "no" );
}

window.gunDb = null;
window.ws = null;
window.send = sendMessage;
window.ongun

function sendMessage( m ) {
  //wrap send for client.... 
  var msg = JSON.stringify( { client: localStorage.getItem( "clientKey" ), msg: m } );
  ws.send( msg );
}

function updateState( state, val ) {

}

var np = (p)=>{location.assign(p)};

if( !window.Required ) {
  np( "login.html" );
  throw new Error( "Page is not configured for auth; missing required tokens" ); 
}
if( button )  
  button.addEventListener( "click", ()=>{
    ws.send( `{"op":"userLogin","username":"${username.value}","password":"${password.value}","require":${JSON.stringify( Required ) }}`)
  } );
if( yesButton ) yesButton.addEventListener( "click", ()=>{
    ws.send( '{"op":"logout"}')
})
if( noButton ) noButton.addEventListener( "click", ()=>{
    np("/userAuth/login.html");
})
var processors = [];

if ("WebSocket" in window) {
  if( !location.host.length )  {
	  var peer = `wss://localhost:2403/userAuth`;
  }
  else
	  var peer = `${location.protocol==="https:"?"wss":"ws"}://${location.hostname}:${Number(location.port)}/userAuth`;
  openSocket();
} else {
  // the browser doesn't support WebSocket.
  if( !location.host.length )
	  np("../nosupport.html");
  else
	  np("nosupport.html");
}


function openSocket() {
  ws = new WebSocket(peer, "karaway.core");
  
  ws.onopen = function() {
    // Web Socket is connected. You can send data by send() method.
    //ws.send("message to send"); 
    if( location.pathname === "/userAuth/logout.html" )
      return;

    var key = localStorage.getItem( "clientKey" );
    console.log( "key is", key );
    if( !key )
      if( location.pathname !== "/userAuth/login.html" ) {
          console.log( "no key, ned to do login... ")
            np("/userAuth/login.html");
            return;
      }
      else ws.send( '{"op":"getClientKey"}' );
    else ws.send( `{"op":"getLogin","id":"${key}"}` );
    //ws.send( JSON.stringify( { MsgID: "Flashboard Login" } ) );
  };
  ws.onmessage = function (evt) { 
  	var received_msg = evt.data; 
        console.log( "received", received_msg );
      processors.find( processMessage=>processMessage( JSON.parse( evt.data ) ) );
  };
  ws.onclose = function() { 
    console.log( "CLOSED WEBSOCKET!")
    openSocket();
 	// websocket is closed. 
  };
}

processors.push( processMessage );

function processMessage( msg )
{
    //console.log( "handle Message?")
	   if( msg.op === "setLogin" ) {
        localStorage.clear();
        localStorage.setItem( "sessionKey", msg.key )
        	return true;
     }
     else if( msg.op === "oldLogin" ) {
       if( localStorage.getItem( "sessionKey" ) !== msg.key ) {
            ws.send( '{"op":"logout"}')
    	      np("/userAuth/login.html");
       }
       localStorage.setItem( "clientKey", msg.id );
        if( location.pathname === "/userAuth/login.html" ){ // this should always be called because of someone else...
            console.log( "go back one....");
            history.go(-1); // assume the prior page is the source (else someone cheated to just to go login.html)
        }
        else
          if( window.Gun ) {
            gunDb = window.Gun();
            connectGun();
          }

        return true;
     }
     else if( msg.op === "remoteLogoff") {
       if (confirm('Another system is attempting to log in as this user?  Allow(yes) or block(no)')) {
            // Save it!
        } else {
            // Do nothing!
        }
     }
     else if( msg.op === "confirmLogout") {
        console.log( "DO LOGOUT??" );
   	    np("logout.html");
        console.log( "LOCATION REPLACE FAILED")
        return true;
       
     }
     else if( msg.op ==="setClientKey" ) {
     	  localStorage.setItem( "clientKey", msg.key );
	      ws.send( `{"op":"getLogin","id":"${msg.key}"}` );
        return true;
     }
      else if( msg.op === "newLogin" ) {
        if( username ) username.value = "";
        if( password ) password.value = "";
        if( location.pathname !== "/userAuth/login.html" )
    	      np("/userAuth/login.html");
        return true;
      }
      return false;
}


function connectGun() {
            var wsDb = new WebSocket( peer, "gunDb" );
            wsDb.onopen = (ws)=>{
              gunDb.on('out', function (msg) {
                  msg = JSON.stringify({headers:{}, body: msg});
                  wsDb.send(msg)
              } )
              if( ongun )
                ongun();
            }
	          wsDb.onmessage = (msg)=>{
        				gunDb.on('in', JSON.parse(msg.data).body);
            };
            wsDb.onerror = (err)=>{ console.log( "error:", err)}
            wsDb.onclose = (msg)=>{
               // db closed...
               connectGun();
            };
}
