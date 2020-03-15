

const wt = require( 'worker_threads');
global.isMainThread = wt.isMainThread;
var config = require ('./config.js');
var Entity = require( "./Entity/entity.js" );

Entity.idMan = require( "./id_manager.js");

function BigBang() {
	Entity.reloadAll( (o)=>{
		console.log( "got:", o );		
	}, (a,b,c)=>{
		console.log( "a,b,c", a, b, c );
	})
	//});
}


config.start( BigBang );
config.resume();


