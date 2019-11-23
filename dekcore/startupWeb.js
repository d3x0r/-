

async function buildPiping(){
	// the server part of this doesn't actually have IO
	
	(await require( './command_stream_filter/webConsole.js' )) .Filter();
}

buildPiping();

console.log( "Hello from startup Web.js" );//, Object.keys(this) );

