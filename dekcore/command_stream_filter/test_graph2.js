
var config = require( "../config.js" );
var consoleControl = require( "./psi_console.js" );

var newline = require( './strip_newline.js' );
var parse = require( './text_parse.js' );
var monitor = require( './monitor_filter.js' );
var command = require( './command.js');
var shell = require( '../Sentience/shell.js');
const JSOX = require( "../../sack-gui").JSOX;
//var sentient = require( '../Sentience/sentience.js');
var Entity = require( '../Entity/entity.js');
var idMan = require( "../id_manager.js");
Entity.idMan = idMan;

var shell;

var Void ;
var MOOSE;

//this.graphThis = true;
Object.freeze( this );
Object.seal(this);
//console.log( "Entity.create layer 1 'this':", JSOX.stringify(this) );

Entity.create( require, "The Void", "Glimmering matte black pebbles line the shore...", (o)=>{
	console.log(" THe VOid created" );
    Void = o;
    Entity.create( Void, "MOOSE", "Master Operator of System Entities", (o)=>{
	MOOSE = o;
        //o.sandbox.require = require;
//console.log(" this:", JSOX.stringify( this ) );
//console.log(" Entity:", JSOX.stringify( o ) );
//console.log(" sandbox:", JSOX.stringify( o.sandbox ) );

        o.shell = shell.Filter( o.sandbox );

        //o.shell.RegisterCommand( "asdf", (args)=>{ console.log( `asdf called with `, args   )})
        buildGuiPiping();

	MOOSE.sandbox.io.command = o.shell;
	//o.sandbox.require(  );
    });
});


var ioDevice = consoleControl.filter() ;

// newline strips the end of line return from stdin streams.
// the GUI does not include \n or \r in the entered command.
var nl = newline.Filter();
// text parsing got lost in chunking; all it could do is convert to JSON reprsentation
//  so the command filter does text parsing.
// var text = parse.Filter();
var cmd = command.Filter(  );

// monitors may be hooked to log traffic throughput...
//var mon1 = monitor.Filter();
//var mon2 = monitor.Filter();

function buildGuiPiping(){
	 //ioDevice.filter.pipe( nl.filter ).pipe( text.filter ).pipe( MOOSE.shell.filter ).pipe( ioDevice.filter );
	ioDevice.filter.pipe( MOOSE.shell.filter ).pipe( ioDevice.filter );
	// process.stdin.pipe( nl.filter ).pipe( text.filter ).pipe( MOOSE.shell.filter ).pipe( process.stdout );

}

function buildStdioPiping(){
	//mon1.connectInput( process.stdin );
	//console.log(" This just attaches stdin to stdout." );
	// process.stdin.pipe( process.stdout );
	//ioDevice.filter.pipe( nl.filter ).pipe( text.filter ).pipe( MOOSE.shell.filter ).pipe( ioDevice.filter );
	process.stdin.pipe( nl.filter ).pipe( MOOSE.shell.filter ).pipe( process.stdout );
}


config.resume()
//cmd.connectOutput( process.stdout );//mon2.filter );
//mon2.connectOutput( process.stdout );
