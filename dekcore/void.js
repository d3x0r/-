
const cluster = require('cluster');

var config = require ('./config.js');

//-------------- Second Void Method

var config = require( "./config.js" );
var Entity = require( "./Entity/entity.js" );
var shell = require( "./Sentience/shell.js" );
var text = require( "../org.d3x0r.common/text.js" )


function BigBang() {
	console.log( "Creating the void....");
	var Void;
	Entity( null, "The Void", "Glistening transparent black clouds swirl in the dark.", (o)=>{
		Void = o;
                
		Entity( Void, "MOOSE", "Master Operator of System Entites.", (o)=>{
	console.log( "ZPath resolves...", require.resolve( "./startup.js" ) );
	var path = require.resolve( "./startup.js" ).replace( /\\/g, "/" );
                        shell.Script( o.sandbox, text.Text( path ) );
		})
	} );
}

if( cluster.isMaster ) {
	console.log( "defer bigBang")
	config.start( BigBang );
	//------------- some initial startup modes
}else {
	
}
setTimeout( waitrun,10 );


function waitrun(){
    console.log( "Wait for config");
    if( !config.run.Λ)
    {
	console.log( "wait some more then try again" );
        setTimeout(  waitrun, 10 );
    }
    else
        try { 
		if( cluster.isMaster ) {
        		run(); 
                }else {
                	run2();
                }
        } catch(err) {
            console.log( "Run Failed : ", err);
            run3();
        }
        console.log( "Done??" );
}

function run2() {
    var discoverer = require( "http://localhost:3212/discovery.js" );
    discoverer.discover( { timeout: 1000
        , ontimeout : ()=>{
            console.log( "i'm all alone. but all I can do is wait" );
        }
        , onconnect : ( sock ) => {
            console.log( "possible addresses ...", config.run.addresses );
            var idGen = require( "./id_generator.js");
            idMan.sync( sock );
        }
    })

}

function run3() {
    var discoverer = require( "./discovery.js" );
    var Cluster = require( './cluster.js' ).Cluster();
    discoverer.discover( { timeout: 1000
        , ontimeout : ()=>{
            console.log( "i'm all alone. but all I can do is wait" );
            Cluster.start();
        }
        , onconnect : ( sock ) => {
            console.log( "possible addresses ...", config.run.addresses );
            var idGen = require( "./id_generator.js");
            idMan.sync( sock );
        }
    })

}

function run() {
    var Cluster = require( './cluster.js' ).Cluster();
    var idMan = require( "./id_manager.js");
    var vfs = require( "./file_cluster.js" );
    var discoverer = require( "./discovery.js" );
    discoverer.discover( { timeout: 1000
        , ontimeout : ()=>{
            console.log( "i'm all alone.", config.run.Λ )
            Cluster.start();
            // really all of my keys are on my config.run key anyway
            //   so this shouldn't be done here?
            //idMan.SetKeys( idMan.ID( config.run.Λ ) );
        }
        , onconnect : ( sock ) => {
            var idGen = require( "./id_generator.js");
            idMan.sync( sock );
        }
    })
    console.log( "Run is completed... setup discover" );
}


//discoverer.
