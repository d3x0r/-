
var vfs = require( "sack.vfs" );
var sqlDb = vfs.Sqlite( "graph.db" );

console.log( "init:", sqlDb.do( "PRAGMA foreign_keys = ON" ) )
console.log( "tables:", sqlDb.do( "select * from sqlite_master" ) );

function createTables( prefix ) {
	var names = { nodes : `${prefix}evr_nodes`
                    , node_links : `${prefix}evr_node_links`
                    , node_props : `${prefix}evr_node_props`
                    };
sqlDb.makeTable( `create table ${names.nodes} ( nodeKey char PRIMARY KEY )` );
sqlDb.makeTable( `create table ${names.node_links} `
	+"( parent char"
        +", child char"
		+", text char, state char" // what this link is called; and a revision id
        +", INDEX fowardMap(parent)"
        +", INDEX reverseMap(child)"
        +", CONSTRAINT `fk_parent_link` FOREIGN KEY (`parent`) REFERENCES `evr_nodes` (`nodeKey`) ON DELETE CASCADE ON UPDATE CASCADE"
        +", CONSTRAINT `fk_child_link` FOREIGN KEY (`child`) REFERENCES `evr_nodes` (`nodeKey`) ON DELETE CASCADE ON UPDATE CASCADE"
        +")"
        );


sqlDb.makeTable( `create table ${names.node_props} `
	+"( nodeKey char"
        +", name char"
        +", value char"
        +", state char"
        +", INDEX propertyMap(key,name)"
        +", CONSTRAINT `fk_evr_node_link` FOREIGN KEY (`nodeKey`) REFERENCES `evr_nodes` (`nodeKey`) ON DELETE CASCADE ON UPDATE CASCADE"
        +")"
        );
        return names;
}	

//var maps = [];
var evr = require( "./evr.js" );

evr.addLocalStorage( driver );
function driver( op, evr, node, field ) {
	//console.log( "sql driver got:", op )
	if( op === "init" ) {
        var sqlOpts = evr.opts.sql = evr.opts.sql || { prefix: "" };
		sqlOpts.creatingKey = null;
        sqlOpts.creatingProperty = null; 
        //maps.push( evr );
        sqlOpts.names = createTables( sqlOpts.prefix );
	}  else if( op === "updateKey" ) {
		// node's ID was updated...
		// field parameter in this case is the old key
		sqlDb.do( "update ${evr.opts.names.nodes} set nodeKey=${makeSqlValue(node.key)} where nodeKey=${makeSqlValue(field)}")
	}  else if( op === "initNode" ) {
       	var nodeOpts = node.opts.sql = node.opts.sql || { };
		nodeOpts.state = "added";
	}  else if( op === "initLink" ) {
       	var linkOpts = node.opts.sql = node.opts.sql || { };
		linkOpts.state = "added";
    } else if( op === "read" ) {
        	var sqlOpts = evr.opts.sql;
			if( sqlOpts.creatingKey === node.key )  {
				return;
			}
			//console.trace( "node has parent?", node.text, node.parent )
			if( !node.parent ) {
				readNode( sqlOpts, node );
			} else {
				var linkOpts = node.opts.sql = node.opts.sql || { state:"added" };
				readPath( sqlOpts, node );
			}
			readProperties( sqlOpts, evr, node );
			readPaths( sqlOpts, node );
        } else if( op === "initField" ) {
			var sqlOpts = evr.opts.sql;
			var fieldOpts = field.opts.sql = field.opts.sql || {};
			fieldOpts.state = "added";
			if( field ) {
				//console.log( "got write on ", node, field );
				// this might as well just be ... 'on next write, ignore it.' ???
				if( ( sqlOpts.creatingProperty === field.field )
					// && ( sqlOpts.creatingKey === node.key )
					)
					return;
				//console.log( "node is ", node, "\n FIELD IS", field)
				writeProperty( sqlOpts, node, field );
			}
			
        } else if( op === "write" ) {
        	var sqlOpts = evr.opts.sql;
			if( field ) {
						//console.log( "got write on ", node, field );

				// this might as well just be ... 'on next write, ignore it.' ???
				if( ( sqlOpts.creatingProperty === field.field )
				// && ( sqlOpts.creatingKey === node.key )
				)
					return;
				writeProperty( sqlOpts, node, field );
			}
		// can also get write events on nodes; which I don't think I care about?
        } else if( op === "onMap" ) {
        	var sqlOpts = evr.opts.sql;
			console.log( "onMap; reload properties and paths of old object?", node )
			//console.log( "read properties of node so it's not empty?")
			readProperties( sqlOpts, evr, node );
			//console.log( "read paths of node so it's not empty?")
			readPaths( sqlOpts, node );
	} else if( op === "timeout" ) {
		// field is actually a callback in this case
		console.log( "is node empty?", node.isEmpty );
		if( !node.isEmpty ) {
			node.opts.emitNot = false;
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
	} else {
		console.log( "Unknown Driver Op:", op )
	}
}

function readProperties( sqlOpts, evr, node ) {
	var names = sqlOpts.names;
	//var props = sqlDb.do( `select * from ${names.node_props}` );
	var props = sqlDb.do( `select * from ${names.node_props} where nodeKey=${makeSqlValue(node.key)}` );
	//console.log( "Read Properties:", props );
	if( props.length > 0 ) {
		props.forEach( (prop)=>{	
                	sqlOpts.creatingKey = node.key;
                	sqlOpts.creatingProperty = prop.name;
					
			var newProp = evr.makeObjectProperty( node, prop.name, prop.value );
			newProp.tick = prop.state;
			newProp.opts.sql.state = "commited";
			evr.driverEmit( "read", evr, node );
		} );
	}
}

function readPaths( sqlOpts, node ) {
	var names = sqlOpts.names;
	var paths = sqlDb.do( `select child nodeKey,text from ${names.node_links} l where parent=${makeSqlValue(node.key)}` );
	//console.log( "Read Paths:", paths );
	if( paths.length > 0 ) {
		paths.forEach( (path)=>{	
			sqlOpts.creatingKey = path.nodeKey;
			sqlOpts.creatingTick = path.state;
			var newPath = node.get( path.text, path.nodeKey );
			// short out recursive write of this.
			sqlOpts.creatingKey = null;

			newPath.tick = path.state;
			newPath.opts.sql.state = "commited";


		} );
	}
}


function readNode( sqlOpts, node, iKnowItDoesntExist ) {
	var names = sqlOpts.names;
	var makeit = true;
	var dbNode = sqlDb.do( `select * from ${names.nodes} where nodeKey=${makeSqlValue(node.key)}` );
	if( dbNode.length > 0 ) {
		makeit = false;
		if( !node.tick ) {
				node.tick = dbNode[0].state;			
		} else {
		}
	}
	else {
		node.tick = Date.now();
		sqlDb.do( `insert into ${names.nodes} (nodeKey)values(${makeSqlValue(node.key)})` );
		return true;
	}
	return false;
}


function readPath( sqlOpts, nodeLink ) {
	var names = sqlOpts.names;
	var dbNode = sqlDb.do( `select l.child as key,state from ${names.node_links} l where l.parent=${makeSqlValue(nodeLink.parent.key)} and l.text=${makeSqlValue(nodeLink.text)}` );
	if( dbNode.length > 0 ) {
		if( nodeLink.tick && node.key !== dbNode[0].nodeKey ) {                                  
				throw new Error( ["Database sync error, name of node and name given by application is wrong", nodeLink.text, dbNode[0].text].join( " " )  );
			}
		if( !nodeLink.tick ) {
			nodeLink.key = dbNode[0].key;
			nodeLink.tick = dbNode[0].state;			
		}
	} else {
		// use readNode to do the insert of the child node
		if( readNode( sqlOpts, nodeLink ) ) {
			//console.trace( "Creating link with name: ", nodeLink.text );
			sqlDb.do( `insert into ${names.node_links} (parent,child,text)values(${makeSqlValue(nodeLink.parent.key)},${makeSqlValue(nodeLink.key)},${makeSqlValue(nodeLink.text)})` );
			nodeLink.opts.sql.state = "commited";
		} else {

			sqlDb.do( `insert into ${names.node_links} (parent,child,text)values(${makeSqlValue(nodeLink.parent.key)},${makeSqlValue(nodeLink.key)},${makeSqlValue(nodeLink.text)})` );
			nodeLink.opts.sql.state = "commited";
			// the key existed... and this is a child node....
			// not sure how that can happen.
			//throw new Error( "Fix me." );
		}
	}
}


function writeProperty( sqlOpts, node, field ) {
	var names = sqlOpts.names;
	//console.log( "Added property; commit...", node )
	if( field.opts.sql.state == "added" ) {
		sqlDb.do( `insert into ${names.node_props} (nodeKey,name,value,state)values(${makeSqlValue(node.key)},${makeSqlValue(field.field)},${makeSqlValue(field.value)},${makeSqlValue(field.tick)})`);
	} else {
		sqlDb.do( `update ${names.node_props} set value=${makeSqlValue(field.value)},state=${Number(field.tick)} where nodeKey=${makeSqlValue(node.key)} and name=${makeSqlValue(field.field)}`);
	}
	field.opts.sql.state = "committed";
}



function makeSqlValue(  CTEXTSTR blob )
{
	var n = 0;

	var result = "'";

	while( n < blob.length )
	{	
		var thischar;
		if( ( thischar= blob.charAt(n)) === "'" )
			result += "'";
		result += thischar;
		n++;
	}

	result += "'";

	return result;
}
