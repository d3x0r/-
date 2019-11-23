



console.log( "userManagerStartup  (C&C protocol)websock server startup?", io );
try {
/*
io.addProtocol( "C&C", (conn)=>{
    conn.on( 'message', basicServices );
} )
*/
function basicServices( msg ) {
    console.log( msg );
    try {
        var m = JSON.parse( msg );
    console.log( "Got messsage:", m );
        if( m.op === "login" ) {
            console.log( "A remote user connected....",  m.key );
            var loginState = io.gun.get( m.key );
            loginState.map( userState );
        }
    } catch(err) {
    // json parsing probably failed.
    }
}

function userState( val, field ) {
    if( !("userKey" in val) ) {
        this.put( { userKey:ID() } )
    }else {
        // what else do you want from me??
    }
}


// client key logic....
// redirects if there's a required login and no key
function getLogin() {
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
}
} catch( err) {console.log( "What comma fails?",err)}