
var vfs = require( "sack.vfs" );
var sqlDb = vfs.Sqlite( "graphdb" );

function createTables( prefix ) {
	var names = { nodes : `${prefix}evr_nodes`
                    , node_links : `${prefix}evr_node_links`
                    , node_props : `${prefix}evr_node_props`
                    };
sqlDb.makeTable( `create ${names.nodes} ( key char PRIMARY KEY, text char, state char )` );
sqlDb.makeTable( `create ${names.node_links} table evr_node_links `
	+"( parent char PRIMARY KEY"
        +", child char"
        +", INDEX reverseMap(child)"
        +", CONSTRAINT `parent_link` FOREIGN KEY (`parent`) REFERENCES `evr_nodes`(`key`) ON DELETE CASCASE ON UPDATE CASCADE"
        +", CONSTRAINT `child_link` FOREIGN KEY (`child`) REFERENCES `evr_nodes`(`key`) ON DELETE CASCASE ON UPDATE CASCADE"
        +")"
        );


sqlDb.makeTable( `create table ${names.node_props} `
	+"( key char PRIMARY KEY"
        +", name char"
        +", value char"
        +", state char"
        +", INDEX reverseMap(key,name)"
        +", CONSTRAINT `evr_node_link` FOREIGN KEY (`key`) REFERENCES `evr_nodes`(`key`) ON DELETE CASCASE ON UPDATE CASCADE"
        +")"
        );
        
}

var maps = [];

var evr = require( "./evr.js" );

evr( driver );
function driver( op, evr, node, field ) {
	if( op === "init" ) {
        	var sqlOpts = evr.opts.sql = evr.opts.sql || { prefix: "" };
        	maps.push( evr );
                sqlOpts.names = createTables( sqlOpts.prefix );
        } else if( op === "read" ) {
        	var sqlOpts = evr.opts.sql;
		if( !node.parent ) {
			readNode( sqlOpts.names, node );
		} else 
			readPath( sqlOpts.names, node );
        	readProperties( sqlOpts.names, node );
        } else if( op === "write" ) {
		if( field )
			writeProperty( evr, node, field );

		// can also get write events on nodes; which I don't think I care about?
	} else if( op === "timeout" ) {
		// field is actually a callback in this case
		if( !node.isEmpty ) {
			// not will not fire; it has data.
			// cancel further events, and for timeout, send cancelTimeout to prior events.
			return true;
		}
		// if it was empty, some other driver might add to it; but I should inidicate if noone does to call the event.
		
	} else if( op === "cancelTimeout" ) {
		// field is actually a callback in this case
		if( node.isEmpty ) {
			field();
			return true;
		}
	}
}

function readProperties( names, node ) {
	var props = sqlDb.do( `select * from ${names.evr_props} where key='${node.key}'` );
	if( props.length > 0 ) {
		props.forEach( (prop)=>{	
			var newProp = node.getProp( prop.name, prop.value );
			newProp.tick = prop.state;
			newProp.state = "commited";
		} );
	}
}

function readNode( names, node ) {
	var dbNode = sqlDb.do( `select * from ${names.evr_nodes} where key='${node.key}'` );
        if( dbNode.length > 0 ) {
        	if( node.text !== dbNode[0].text ) {
                	throw new Error( ["Database sync error, name of node and name given by application is wrong", node.text, dbNode[0].text].join( " " )  );
                }
        	if( !node.tick ) {
                	node.tick = dbNode[0].state;			
		}else {
			
		}
        } else {
		node.tick = Date.now();
		sqlDb.do( `insert into ${names.evr_names} (key,text,state)values('${node.key}','${node.text}','${node.tick}')` );
		return true;
	}
	return false;
}


function readPath( names, node ) {
	var dbNode = sqlDb.do( `select l.child,n.state as key from ${names.evr_links}l join ${names.evr_nodes}n on l.child=n.key where l.parent=${node.parent.key} and n.text='${node.text}'` );
        if( dbNode.length > 0 ) {
        	if( node.state && node.key !== dbNode[0].key ) {                                  
                	throw new Error( ["Database sync error, name of node and name given by application is wrong", node.text, dbNode[0].text].join( " " )  );
                }
        	if( !node.tick ) {
			node.key = dbNode[0].key;
                	node.tick = dbNode[0].state;			
		}
        } else {
		// use readNode to do the insert of the child node
		if( readNode( names, node ) )
			sqlDb.do( `insert into ${names.evr_links} (parent,child)values('${node.parent.key}','${node.key}')` );
		else {
			// the key existed... and this is a child node....
			// not sure how that can happen.
			throw new Error( "Fix me." );
		}
	}
}


function writeProperty( names, node, field ) {
	
}
