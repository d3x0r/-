var rdb = require( "./rdb-dataset.js" );

var optiondb = /*new*/rdb.Graph();

var optval = /*new*/optiondb.Class( "option_value" );

/*new*/optval.Property( { name : "number", type:"number" } );
/*new*/optval.Property( { name : "string", type:"string" } );

var optname = optiondb.Class( "option_name" );
optname.Property( {name:"name", type:"string"})

var optmap = optiondb.Class( "option_map");
optmap.Property( {name:"name", type:"option_name" } );
optmap.Property( {name:"value", type:"option_value" } );
optmap.Property( {name:"nodes", type:"[option_map]" } );

var nameRow = optiondb.option_name.Row( { [namecol.name] : "first name" } );
var optionRow = optiondb.option_map.Row( { option_id : "0000", parent_option_id : "0000", option_name_id: nameRow.option_name_id } );

// root identity and type.
var optroot = optiondb.Node( "optionRoot", optmap );

console.log( "then?", nameRow );
console.log( "then?", optionRow );

optiondb.getValue = function( path, Default ) { 
	var option_path = path.split( '/' );
	var node = optroot;
	for( var n = 0; n < option_path; n++ ) {
		node = node.nodes.where( (node)=>node.name.name=== option_path[n] );
	}
	return node.value.string;
}
