

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
			config.run['The Void'] = id; // o.V should also equal ID...

			o.create( "MOOSE", "Master Operator of System Entites.", (o)=>{
				o.saved = true;
				o.saved.then( (id)=>{
					config.run.MOOSE = o.Λ.toString();
					config.commit().then( ()=>{
						o.wake().then( (thread)=>{
							process.stdin.pipe( thread.worker.stdin );
							o.require( startScript ).then( (r)=>{
								console.log( "Hmm, what doe shtis result?", r );
								o.save();
							});
						}).catch( (err) =>{
							console.log( "MOOSE Startup Wake failed:", err );
						})
					}).catch(err=>console.log("ERR?",err))

				}).catch(err=>console.log("ERR?",err))
			})
			//o.create( "MOOSE-HTTP", "(HTTP)Master Operator of System Entites.", (o)=>{
					//o.sandbox.require( "startupWeb.js" );
			//})
		}).catch(err=>console.log("ERR?",err))
	} );
	//});
}

//------------- some initial startup modes
config.start( BigBang );
config.resume();

