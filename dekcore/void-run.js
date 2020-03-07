

var args = process.argv;
var startScript = "startup.js";
for( var arg = 2; arg < args.length; args++ ) {
	if( args[arg][0] == '-' ) {
		if( args[arg][0] === '-start' ) {
			startScript = args[arg+1];
			arg++;
		}
	}
}

var config = require ('./config.js');

var idMan = require( "./id_manager.js");
var Entity = require( "./Entity/entity.js" );
Entity.idMan = idMan;

function BigBang() {

	if( !config.run['The Void'] ) {
		console.log( "System has not been pre-initialized, please startup using void-firstrun.js" );
		return;
	}
	//console.log( "Config:", JSOX.stringify( config, null, "\t" ) );
	Entity.reload( config.run['The Void'] ).then( (o)=>{
		Entity.reload( config.run.MOOSE ).then( (o)=>{
			o.wake().then( (thread)=>{
				process.stdin.pipe( thread.worker.stdin );
			}).catch( (err) =>{
				console.log( "MOOSE Startup Wake failed:", err );
			})
		} );
	} );

}

config.start( BigBang );
config.resume();

