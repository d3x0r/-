
console.log( "Firewall service begins.", entity.name );
var firewall = require( "./firewallDb.js" );

var firewallInterface;


if( io.addDriver( "firewall", "firewallInterface", firewallInterface = {
    block( target ) {
        // block the specified address.
		console.log( "Received block command from remote")
    },
    route( target, port ) {
        // route the target address to a specified port to a service
        // compute an available input port to route.
		console.log( "Received route command from remote")
    },
} ) )
{
	throw new Error( "Firewall driver has already been provided." );
}

