
console.log( "Firewall service begins.", entity.name );
var firewall = require( "./firewallDb.js" );

var firewallInterface;

if( io.addDriver( "firewall", "firewallInterface", firewallInterface = {
    block( target ) {
        // block the specified address.
    },
    route( target, port ) {
        // route the target address to a specified port to a service
        // compute an available input port to route.
    },
} ) )
{
	throw new Error( "Firewall driver has already been provided." );
}

