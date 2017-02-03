
var vfs = require( "sack.vfs" );
var sqlDb = vfs.Sqlite( "graph.db" );

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
	console.log( "sql seriver got:", op )
	if( op === "init" ) {
        var sqlOpts = evr.opts.sql = evr.opts.sql || { prefix: "" };
		sqlOpts.creatingKey = null;
        sqlOpts.creatingProperty = null; 
        //maps.push( evr );
        sqlOpts.names = createTables( sqlOpts.prefix );
	}  else if( op === "updateKey" ) {
		// node's ID was updated...
		// field parameter in this case is the old key
		sqlDb.do( "update ${evr.opts.names.nodes} set nodeKey='${node.key}' where nodeKey='${field}'")
	}  else if( op === "initNode" ) {
       	var nodeOpts = node.opts.bio = node.opts.bio || { };
		nodeOpts.reqMsg = null;
		nodeOpts.resMsg = null;
		nodeOpts.state = "added";
	
    } else if( op === "read" ) {
        	var sqlOpts = evr.opts.sql;
			if( sqlOpts.creatingKey === node.key )  {
				return;
			}

			if( !node.parent ) {
				readNode( sqlOpts, node );
			} else 
				readPath( sqlOpts, node );
			readProperties( sqlOpts, node );
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
			console.log( "read properties of node so it's not empty?")
		readProperties( sqlOpts, node );
			console.log( "read paths of node so it's not empty?")
		readPaths( sqlOpts, node );
	} else if( op === "timeout" ) {
		// field is actually a callback in this case
		console.log( "is node empty?", node.isEmpty );
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

function readProperties( sqlOpts, node ) {
	var names = sqlOpts.names;
	//var props = sqlDb.do( `select * from ${names.node_props}` );
	var props = sqlDb.do( `select * from ${names.node_props} where nodeKey='${node.key}'` );
	console.log( "Read Properties:", props );
	if( props.length > 0 ) {
		props.forEach( (prop)=>{	
                	sqlOpts.creatingKey = node.key;
                	sqlOpts.creatingProperty = prop.name;
			var newProp = node.getProp( prop.name, prop.value );
			newProp.tick = prop.state;
			newProp.opts.sql.state = "commited";
		} );
	}
}

function readPaths( sqlOpts, node ) {
	var names = sqlOpts.names;
	var paths = sqlDb.do( `select child nodeKey,text from ${names.node_links} l where parent='${node.key}'` );
	console.log( "Read Paths:", paths );
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
	var dbNode = sqlDb.do( `select * from ${names.nodes} where nodeKey='${node.key}'` );
	if( dbNode.length > 0 ) {
		makeit = false;
		if( !node.tick ) {
				node.tick = dbNode[0].state;			
		} else {
		}
	}
	else {
		node.tick = Date.now();
		sqlDb.do( `insert into ${names.nodes} (nodeKey)values('${node.key}')` );
		return true;
	}
	return false;
}


function readPath( sqlOpts, node ) {
	var names = sqlOpts.names;
	var dbNode = sqlDb.do( `select l.child as key,state from ${names.node_links} l where l.parent='${node.parent.key}' and l.text='${node.text}'` );
	if( dbNode.length > 0 ) {
		if( node.state && node.key !== dbNode[0].nodeKey ) {                                  
				throw new Error( ["Database sync error, name of node and name given by application is wrong", node.text, dbNode[0].text].join( " " )  );
			}
		if( !node.tick ) {
			node.key = dbNode[0].key;
			node.tick = dbNode[0].state;			
		}
	} else {
		// use readNode to do the insert of the child node
		if( readNode( sqlOpts, node ) ) {
			sqlDb.do( `insert into ${names.node_links} (parent,child)values('${node.parent.key}','${node.key}')` );
			node.opts.sql.state = "commited";
		} else {
			// the key existed... and this is a child node....
			// not sure how that can happen.
			throw new Error( "Fix me." );
		}
	}
}


function writeProperty( sqlOpts, node, field ) {
	var names = sqlOpts.names;
	console.log( "Added property; commit...", node )
	if( field.opts.sql.state == "added" ) {
		sqlDb.do( `insert into ${names.node_props} (nodeKey,name,value,state)values('${node.key}','${field.field}','${field.value}','${field.tick}')`);
	} else {
		sqlDb.do( `update ${names.node_props} set value='${field.value}',state=${field.tick} where nodeKey='${node.key}' and name='${field.field}'`);
	}
	field.opts.sql.state = "committed";
}
