
var newline = require( './strip_newline.js' );
var parse = require( './text_parse.js' );
var monitor = require( './monitor_filter.js' );
var command = require( './command.js');

//var sentient = require( '../Sentience/sentience.js');
var Entity = require( '../Entity/entity.js');
var shell;

var Void ;
var MOOSE;

Entity( require, "The Void", "Glimmering matte black pebbles line the shore...", (o)=>{
    Void = o;
    Entity( Void, "MOOSE", "Master Operator of System Entities", (o)=>{
	MOOSE = o;
        o.sandbox.require = require;
        o.shell = require('../Sentience/shell.js').Filter( o.sandbox );
        //o.shell.RegisterCommand( "asdf", (args)=>{ console.log( `asdf called with `, args   )})
        buildPiping();
    });
});



var nl = newline.Filter();
var text = parse.Filter();
var cmd = command.Filter(  );
var mon1 = monitor.Filter();
var mon2 = monitor.Filter();

function buildPiping(){
    //mon1.connectInput( process.stdin );
    nl.connectInput( process.stdin ); //mon1.filter );
    nl.connectOutput( text.filter );
    text.connectOutput( MOOSE.shell.filter );//process.stdout );
    MOOSE.shell.connectOutput( process.stdout );
}
//cmd.connectOutput( process.stdout );//mon2.filter );
//mon2.connectOutput( process.stdout );
