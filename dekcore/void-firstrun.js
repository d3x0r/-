

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
var idGen = require( "./util/id_generator.js");

//Entity.addService = https.addService;
//Entity.addProtocol = https.addProtocol;


var MOOSE;


function BigBang() {
	//console.log( "Config:", JSOX.stringify( config, null, "\t" ) );
	if( config.run['The Void'] ) {
		console.log( "System has already been pre-initialized, please startup using void-run.js" );
		return;
	}
	//console.log( "Creating the void....");
	Entity.create( null, "The Void", "Glistening transparent black clouds swirl in the dark.", (o)=>{
		o.saved = true;
		console.log( "Creating first entity" );
		config.run['The Void'] = o.Λ;

		o.create( "MOOSE", "Master Operator of System Entites.", (o)=>{
			config.run.MOOSE = o.Λ;
			o.saved = true;
			config.commit();
			console.log( "Got moose created..." );
				o.wake().then( (thread)=>{
					console.log( "Got thread?", thread );
					process.stdin.pipe( thread.worker.stdin );
					console.log( "requiring start script", startScript );
					o.require( startScript ).then( (r)=>{
						console.log( "Hmm, what doe shtis result?", r );
						Entity.saveAll();
					});
				}).catch( (err) =>{
					console.log( "MOOSE Startup Wake failed:", err );
				})

		})
		//o.create( "MOOSE-HTTP", "(HTTP)Master Operator of System Entites.", (o)=>{
				//o.sandbox.require( "startupWeb.js" );
		//})
	} );
	//});
}

//------------- some initial startup modes
var discoverId = idGen.generator();

config.start( run );
config.resume();


var d;

function run() {
        BigBang();
}

