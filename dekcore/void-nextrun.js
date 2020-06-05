

const wt = require( 'worker_threads');
global.isMainThread = wt.isMainThread;
var config = require ('./config.js');
var Entity = require( "./Entity/entity.js" );

Entity.idMan = require( "./id_manager.js");

function BigBang() {
	Entity.reloadAll().then( ()=>{
		console.log( "Universe successfully reloaded.")
	})
}
	//});


config.start( BigBang );
config.resume();


