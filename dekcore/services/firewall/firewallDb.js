"use strict"

var crypto = require('crypto')
var idGen = require( '../../id_generator.js' ).generator;

//var idMan = require( '../utils/id_manager.js')

var prime_length = 256;
var diffHell = crypto.createDiffieHellman(prime_length);

diffHell.generateKeys('base64');
console.log("Public Key : " ,diffHell.getPublicKey('base64'));
console.log("Private Key : " ,diffHell.getPrivateKey('base64'));

console.log("Public Key : " ,diffHell.getPublicKey('hex'));
console.log("Private Key : " ,diffHell.getPrivateKey('hex'));


function hash(v) {
		console.log( "hash", v );
  var shasum = crypto.createHash('sha1');
	shasum.update(v);
	return shasum.digest('hex');
}

/* this should already be resolved somehow?" */

var DB = exports = module.exports = {};

var vfs = require( 'sack.vfs');

var vol = idGen();
var opdb = vfs.Sqlite( `option.db` );
var vol = opdb.op( "vol", idGen() );
console.log( "op:", vol, opdb );

DB.data = vfs.Volume( vol, vol/*, me*/ );
var db = DB.db = vfs.Sqlite( `$sack@${vol}$firewall.db` );

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

