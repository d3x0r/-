
console.log( "Auth service begins.", entity.name );
//var firewall = require( "./firewallDb.js" );

var authInterface;

io.addDriver( "auth", "authInterface", authInterface = {
    redirect(  ) {
        // block the specified address.
    },
    route( target, port ) {
        // route the target address to a specified port to a service
        // compute an available input port to route.
    },
} );

io.addProtocol( "auth" );

on( 'contained', function( newContent ){
    
})