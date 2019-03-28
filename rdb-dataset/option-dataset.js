var rdb = require( "./rdb-dataset.js" );

var optiondb = rdb.Graph();

optiondb.Node( "option_value" );

optiondb.option_value.Field( { name : "number", type:"Number" } );
optiondb.option_value.Field( { name : "string", type:"String" } );


optiondb.Table( "option_name" );

var col = optiondb.option_name.Column( { 
	type: "guid", 
	primaryKey : true, 
	autoKey : ()=>Math.random() 
} );
var namecol = optiondb.option_name.Column( { 
	isName : true, 
	type: "string", 
	unique : true 
} )

optiondb.Table( "option_map" );
var idcol = optiondb.option_map.Column( {
	type : "guid",
	primaryKey : true,
	autoKey : ()=>Math.random()
} );
var nameidx = optiondb.option_map.Column( {
	type : "guid",
	indexed : true,
	foreign: {
		table : optiondb.option_name,
		column: optiondb.option_name.id,
		onUpdate:rdb.constants.Cascade,
		onDelete:rdb.constants.Cascade
	}
} );
var parentidcol = optiondb.option_map.Column( {
	name : "parent_option_id",
	type : "guid",
	foreign: {
		table : optiondb.option_map,
		column: optiondb.option_map.id,
		onUpdate:rdb.constants.Cascade,
		onDelete:rdb.constants.Cascade
	}
} );

optiondb.Table( "option_value" );
optiondb.option_value.Column( {
	name : "option_id",
	type: "guid",
	foreign: {
		table : optiondb.option_map,
		column: optiondb.option_map.id,
		onUpdate:rdb.constants.Cascade,
		onDelete:rdb.constants.Cascade
	}
} );
optiondb.option_value.Column( {
	name : "number",
	type: "int"
} );


console.log(" So then we have:", optiondb.option_map.getCreate() )
console.log(" So then we have:", optiondb.option_name.getCreate() )
console.log(" So then we have:", optiondb.option_value.getCreate() )

var nameRow = optiondb.option_name.Row( { [namecol.name] : "first name" } );
var optionRow = optiondb.option_map.Row( { option_id : "0000", parent_option_id : "0000", option_name_id: nameRow.option_name_id } );


console.log( "then?", nameRow );
console.log( "then?", optionRow );

optiondb.getValue = function( path, Default ) { 
	var option_path = path.split( '/' );
        
}
