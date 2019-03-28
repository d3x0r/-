
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

console.log( "Entity.create layer 1" );
Entity.create( require, "The Void", "Glimmering matte black pebbles line the shore...", (o)=>{
	console.log(" THe VOid created" );
    Void = o;
    Entity.create( Void, "MOOSE", "Master Operator of System Entities", (o)=>{
	MOOSE = o;
        //o.sandbox.require = require;
console.log(" Entity:", JSOX.stringify( o ) );

        o.shell = shell.Filter( o.sandbox );

        //o.shell.RegisterCommand( "asdf", (args)=>{ console.log( `asdf called with `, args   )})
        buildPiping();

	MOOSE.sandbox.io.command = o.shell;
	//o.sandbox.require(  );
    });
});


var ioDevice = consoleControl.filter() ;

var nl = newline.Filter();
var text = parse.Filter();
var cmd = command.Filter(  );
var mon1 = monitor.Filter();
var mon2 = monitor.Filter();

function buildPiping(){
    //mon1.connectInput( process.stdin );
console.log(" This just attaches stdin to stdout." );
// process.stdin.pipe( process.stdout );

   
 //ioDevice.filter.pipe( nl.filter ).pipe( text.filter ).pipe( MOOSE.shell.filter ).pipe( ioDevice.filter );
 ioDevice.filter.pipe( nl.filter ).pipe( MOOSE.shell.filter ).pipe( ioDevice.filter );
// process.stdin.pipe( nl.filter ).pipe( text.filter ).pipe( MOOSE.shell.filter ).pipe( process.stdout );

}

config.resume()
//cmd.connectOutput( process.stdout );//mon2.filter );
//mon2.connectOutput( process.stdout );
