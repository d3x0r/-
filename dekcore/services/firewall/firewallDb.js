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
onInit( ()=>{
	console.log( "Should have disk now??");
var config;
var rules;
var configFile;

disk.open( "firewall.config.jsox").then( (file)=>{
	 configFile = file;
	 file.read().then( data=>{
		console.log( "Recovered config?", data);
		config = data;
		storage.get( config.rules ).then ( rules_=>{
			rules = rules_
		})
	 }).catch( (err)=>{
		storage.put( rules = []).then ( id=>{
			file.write( config = { vol:idGen(), rules:id } );
		})
	 })
	 console.log( "firewall config:", file );
}).catch( (err)=>{
	 console.log( "This is probably, file not found?", err);
	 
});


//var opdb = nativeDisk.Sqlite( `firewall option.db` );
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
	rules.push( rule );
	storage.put( rules );
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

})