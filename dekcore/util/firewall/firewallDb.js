"use strict"

const DB = exports = module.exports = {
	driver : null,
	db : null,
	reload: reload,
};

const fc = require( "../../file_cluster.js" );

const IdGen = require( "../id_generator.js" );
const idGen = IdGen.generator;

/*
	// these IDs would get saved with the entity config setting.
if( !config.firewall ) {
	config.firewall = {
		IDs: [idGen(),idGen(),idGen(),idGen(),idGen(),idGen(),idGen()]
	}
}
*/

var db = DB.db = fc.cvol.Sqlite( `firewall.db` );


db.do( 'PRAGMA foreign_keys=ON' );

db.makeTable( "create table firewall_rules ( rule_id char PRIMARY KEY"
	+", name char"
	+", source char "
	+", source_port char "
	+", dest_port char "
	+", allow int "  // if not allow, is a blocking rule.
	+" )"
	 );

function reload() {
	var rules = db.do( "select * from firewall_rules" );
	db.do( "delete from firewall_rules" );
	rules.forEach( rule=>{
		DB.driver.removeRule( rule );
	});

}

DB.blockAddress = addBlock;

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



DB.reload
