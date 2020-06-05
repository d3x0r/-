

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
	//console.log( "Config:", JSOX.stringify( config, null, "\t" ) );
	if( config.run['The Void'] ) {
		console.log( "System has already been pre-initialized, please startup using void-run.js" );
		return;
	}
	//console.log( "Creating the void....");
	Entity.create( null, "The Void", "Glistening transparent black clouds swirl in the dark.", (o)=>{
		const theVoid = o;
		o.saved = true;
		o.saved.then( (id)=>{
			console.log( "Creating first entity" );
			config.run['The Void'] = o.V;

			o.create( "MOOSE", "Master Operator of System Entites.", (o)=>{
				o.saved = true;
				o.saved.then( (id)=>{
					console.log( "Moose succesffully saved... ");
					config.run.MOOSE = o.V;
					config.commit().then( ()=>{
						console.log( "Okay so config IS Written!")
						o.wake().then( (thread)=>{
							process.stdin.pipe( thread.worker.stdin );
							console.log( "requiring start script", startScript );
							o.require( startScript ).then( (r)=>{
								console.log( "Hmm, what doe shtis result?", r );
								o.save();
							});
						}).catch( (err) =>{
							console.log( "MOOSE Startup Wake failed:", err );
						})
					})

				})

			})
			//o.create( "MOOSE-HTTP", "(HTTP)Master Operator of System Entites.", (o)=>{
					//o.sandbox.require( "startupWeb.js" );
			//})
		})
	} );
	//});
}

//------------- some initial startup modes
config.start( BigBang );
config.resume();

