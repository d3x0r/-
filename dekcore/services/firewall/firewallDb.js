"use strict"

var DB = exports = module.exports = {};

var vfs = await require( 'sack.vfs');
const IdGen = await require( "../../util/id_generator.js" );
const idGen = IdGen.generator;
console.log( "isGen:", IdGen, idGen );
/*
	// these IDs would get saved with the entity config setting.
if( !config.firewall ) {
	config.firewall = { 
		IDs: [idGen(),idGen(),idGen(),idGen(),idGen(),idGen(),idGen()]
	}
}
*/

var opdb = vfs.Sqlite( `option.db` );
var vol = opdb.op( "vol", idGen() );
console.log( "Firewall Database...", vol );
DB.data = vfs.Volume( vol, vol/*, me*/ );
var db = DB.db = DB.data.Sqlite( `firewall.db` );


db.do( 'PRAGMA foreign_keys=ON' );

db.makeTable( "create table firewall_rules ( rule_id char PRIMARY KEY"
	+", name char"
	+", source char "
	+", dest char "
	+", allow int "  // if not allow, is a blocking rule.
	+" )"
	 );

var rules = db.do( "select * from firewall_rules" );

DB.blockAddress = addBlock;

function addBlock( tag, source ) {
	var rule = {rule_id:idGen(),
		name:tag,
		source:source,
		dest:"",
		allow:false
	}
	invokeRule( rule );
}

function invokeRule( rule ) {

}


DB.connect = (gun)=>{
	console.log( "Update gun databases!!!!!")
	var orgDef = gun.get( "orgDef" );
	//sites.forEach( )
	var siteDef = gun.get( "siteDef" );
	sites.forEach( s=>{ 
		console.log( "site:", s );
		var gunSite = gun.get( "siteDef:"+s.site_id );

		var o = {};
		gunSite.put( o[s.site_id] = { id:s.site_id,name:s.localName,address:s.address } );
		console.log( o );
		siteDef.put( o ); 
	} )
}

