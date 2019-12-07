"use strict"

const DB = exports = module.exports = {
	driver : null,
	db : null,
	reload: reload,
	init: init,
	blockAddress : addBlock,
};
var db = null;

var fc = await require( "../../file_cluster.js" );

var IdGen = await require( "../id_generator.js" );
var idGen = IdGen.generator;
var vfs = null;

if( "string" === typeof Λ ) {

	return require( "../../file_cluster.js" ).then(r=>{
		fc = r;
		return require( "../id_generator.js" ).then(r=>{
		 	IdGen = r;
			idGen = r.generator;
			return require( "sack.vfs" ).then(r=>{
				vfs = r;
			})
			return exports;
 		})
	 } )
	 
} else {
 fc = require( "../../file_cluster.js" );

 IdGen = require( "../id_generator.js" );
 idGen = IdGen.generator;
}
/*
	// these IDs would get saved with the entity config setting.
if( !config.firewall ) {
	config.firewall = {
		IDs: [idGen(),idGen(),idGen(),idGen(),idGen(),idGen(),idGen()]
	}
}
*/


function init() {
	if( "undefined" !== typeof name )
		return name.then(doOpen)
	else
			doOpen('')

			function doOpen(name){
				if( !name )
					db = DB.db = fc.cvol.Sqlite( `firewall.db` );
				else
					db = DB.db = vfs.Sqlite( name+`firewall.db` );



		db.do( 'PRAGMA foreign_keys=ON' );

		db.makeTable( "create table firewall_rules ( rule_id char PRIMARY KEY"
			+", name char"
			+", source char "
			+", source_port char "
			+", dest_port char "
			+", allow int "  // if not allow, is a blocking rule.
			+" )"
			);
	}

}

function reload() {
	var rules = db.do( "select * from firewall_rules" );
	db.do( "delete from firewall_rules" );
	rules.forEach( rule=>{
		DB.driver.removeRule( rule );
	});

}

function addBlock( tag, source ) {
	var rule = {rule_id:idGen(),
		name:tag,
		source:source,
		source_port:0,
		dest_port:0,
		allow:false
	}
	invokeRule( rule );
}

function invokeRule( rule ) {
	DB.driver.addRule( rule );
}

