

var username;
var password;
var button;
var yesButton;
var noButton;
var loginCoverPage;
var uc_username,uc_email,uc_password,uc_password2

function loadControls( parent ) {
	loginCoverPage = parent.getElementById( "loginPageCover" );

	loginForm = parent.getElementById( "loginForm" );
	userCreateForm = parent.getElementById( "createUserForm" );

	createButton = parent.getElementById( "create" );
	createAccount = parent.getElementById( "createAccount" );
	if( createButton )
		createButton.addEventListener( "click", doCreate );
	if( createAccount ) 
		createAccount.addEventListener( "click", showCreate );

	uc_username = parent.getElementById( "uc_username" );
	uc_email = parent.getElementById( "uc_email" );
	uc_password = parent.getElementById( "uc_password" );
	uc_password2 = parent.getElementById( "uc_password2" );

	username = parent.getElementById( "username" );
	password = parent.getElementById( "password" );
	button = parent.getElementById( "login" );
	yesButton = parent.getElementById( "yes" );
	noButton = parent.getElementById( "no" );

if( button )  
  button.addEventListener( "click", ()=>{
	ws.send( `{"op":"userLogin","username":"${username.value}","password":"${password.value}"}`)
  } );

if( yesButton ) yesButton.addEventListener( "click", ()=>{
	ws.send( '{"op":"logout"}')
})
if( noButton ) noButton.addEventListener( "click", ()=>{
	np("/userAuth/login.html");
})

}

function showCreate() {
	loginForm.style.visibility = "hidden";
	userCreateForm.style.visibility = "visible";
}

function doCreate() {
	if( uc_password.value === uc_password2.value ) {
		var msg = { op:"createUser", user:uc_username.value, email: uc_email.value, password: uc_password.value };
		ws.send( JSON.stringify( msg ) );
	} else {
		alert( "Passwords did not match" );
	}

}

function checkPassword() {
	var tmp = uc_password.value;
	return true;
}

function checkUsername() {
	var curname = uc_username.value;
	if( curname.length > 4 ) {
		
	}
}

  loadControls( document );

window.ws = null;
window.send = sendMessage;

function sendMessage( m ) {
  //wrap send for client.... 
  var msg = JSON.stringify( { client: localStorage.getItem( "clientKey" ), msg: m } );
  ws.send( msg );
}

function updateState( state, val ) {

}

var np = (p)=>{
	location.assign(p)
};

if( !window.Required ) {
	hide();
}

function hide() {
	if( loginCoverPage )
	loginCoverPage.style.visibility = "hidden";
}

var processors = [];

if ("WebSocket" in window) {
  if( !location.host.length )  {
	  var peer = `wss://localhost:2403/userAuth`;
  }
  else
	  var peer = `${location.protocol==="https:"?"wss":"ws"}://${location.hostname}:${Number(location.port)}/userAuth`;
  openSocket( "karaway.core" );
} else {
  // the browser doesn't support WebSocket.
  if( !location.host.length )
	  np("../nosupport.html");
  else
	  np("nosupport.html");
}


function openSocket( protocol ) {
  ws = new WebSocket(peer, protocol);
  
  ws.onopen = function() {
	// Web Socket is connected. You can send data by send() method.
	//ws.send("message to send"); 
	var key = localStorage.getItem( "clientKey" );
	console.log( "key is", key );
	if( !key ){
	   loginCoverPage.style.visibility = "visible";
	   ws.send( '{"op":"auth"}' );
	}
	else 
		ws.send( `{"op":"auth","id":"${key}"}` );
	//ws.send( JSON.stringify( { MsgID: "Flashboard Login" } ) );
  };
  ws.onmessage = function (evt) { 
  	var msg = JSON.parse( evt.data ); 
	  if( msg.op === "session" ) {
		 localStorage.setItem( "clientKey", msg.key );
	  } else if( msg.op === "setLogin" ) {
		 localStorage.setItem( "sessionKey", msg.key );
	  } else if( msg.op === "redirect" ) {
		  ws.close();
		  openSocket( encodeURIComponent(msg.protocol) );
	  }
	  else if( msg.op === "newLogin" ) {
		if( username ) username.value = "";
		if( password ) password.value = "";
	  }
  };
  ws.onclose = function() { 
	console.log( "CLOSED WEBSOCKET!")
	setTimeout( ()=>{openSocket(protocol)}, 5000 ); 
 	// websocket is closed. 
  };
}

