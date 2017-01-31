

var evr = require( "./evr.js" );

evr.addRemoteStorage( driver );

function driver( op, evr, node, field ) {
	if( op === "init" ) {
		evr.on( "in", handleInput );
		//evr.on( "in", handleInput );

	} else if( op === "read" ) {
		var msg;
        	var nodeOpts = node.opts.bio = evr.opts.bio || { msg : null };
		if( !node.parent ) 
			nodeOpts.msg = { op:"get", key:node.key, text:node.text, tick:node.tick };
		else
			nodeOpts.msg = { op:"get", parent:node.parent.key, key:node.key, text:node.text, tick:node.tick };
		
		evr.emit( "out", msg );
        } else if( op === "write" ) {
        	//var sqlOpts = evr.opts.sql;
		if( field ) {
                	//console.log( "got write on ", node, field );

			// this might as well just be ... 'on next write, ignore it.' ???
			if( ( sqlOpts.creatingProperty === field.field )
			   // && ( sqlOpts.creatingKey === node.key )
			   )
        	        	return;
			writeProperty( sqlOpts.names, node, field );
			fieldOpts.msg = { op : "write", 
		}
		// can also get write events on nodes; which I don't think I care about?
        } else if( op === "onMap" ) {
        	var sqlOpts = evr.opts.sql;
		readProperties( sqlOpts, node );
		readPaths( sqlOpts, node );
	} else if( op === "timeout" ) {
	} else if( op === "cancelTimeout" ) {
	}
}



function handleInput( evr, msg ) {
	console.log( "what is 'this'?", this );
	if( msg.op == "get" ) {
		if( msg.parent )
			var node = evr.get( msg.parent, msg.key, msg.text );
		else{ 
			var parentNode = evr.get( msg.parent );
			var node = parentNode.get( msg.text, msg.key );
			if( msg.key !== node.key ) {
				// client created a new one, and this one already exists...
			}
			if( node.tick !== msg.tick ) {
				//  something...
			}
		}
	}	
}