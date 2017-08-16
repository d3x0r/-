

var evr = require( "./evr.js" );

evr.addRemoteStorage( driver );

const driver =  {
	init( evr ) {
		var evrOpts = evr.opts.bio = evr.opts.bio || {};
		evrOpts.creatingNode = null;
		evrOpts.creatingField = null;
		evr.on( "in", handleInput );
		//evr.on( "in", handleInput );

	},
	initField(evr,node,field) {
		var msg;
		var fieldOpts = field.opts.bio = field.opts.bio || { };
		fieldOpts.state = "inital";
		evr.emit( "out", { op:"add", key:node.key, field:field.field, value:field.value } );
	},
	initNode( evr,node) {
		var msg;
		var nodeOpts = node.opts.bio = node.opts.bio || { };
		nodeOpts.reqMsg = null;
		nodeOpts.resMsg = null;

		nodeOpts.msg = { op:"get", key:node.key, tick:node.tick, init : true };

		evr.emit( "out", nodeOpts.msg );
		//evr.emit( "out", msg );
	},
	initLink(evr,node) {
		var msg;
       	var linkOpts = node.opts.bio = node.opts.bio || { };
		nodeOpts.reqMsg = null;
		nodeOpts.resMsg = null;
		if( !node.parent )
			linkOpts.reqMsg = { op:"get", key:node.key, text:node.text, tick:node.tick };
		else
			linkOpts.reqMsg = { op:"get", parent:node.parent.key, text:node.text, key:node.key, tick:node.tick };

		evr.emit( "out", nodeOpts.msg );
		//evr.emit( "out", msg );
	},
	updateKey( evr,node ) {
		var nodeOpts = node.opts.bio;
		nodeOpts.msg.key = node.key;
		nodeOpts.msg.oldKey = field;
		evr.emit( "out", nodeOpts.msg )
	},
	read(evr,node ) {
		var msg;
		var nodeOpts = node.opts.bio = evr.opts.bio || { msg : null };
		if( !node.parent )
			nodeOpts.msg = { op:"get", key:node.key, tick:node.tick };
		else
			nodeOpts.msg = { op:"get", parent:node.parent.key, text:node.text, key:node.key, tick:node.tick };

		evr.emit( "out", nodeOpts.msg );
		//evr.emit( "out", msg );
	},
	write(evr,node) {
		//var sqlOpts = evr.opts.sql;
		if( field ) {
			var fieldOpts = field.opts.bio = field.opts.bio || { msg : null };
			if( !fieldOpts.msg )
				fieldOpts.msg = { op : "put", key:node.key, field:field.field, value:field.value, tick:field.tick };
			else {
				fieldOpts.msg.value = field.value;
				fieldOpts.msg.tick = field.tick;
			}
			evr.emit( "out", fieldOpts.msg );
		}
	// can also get write events on nodes; which I don't think I care about?
	},
	onMap(evr,node ) {
		var nodeOpts = node.opts.bio;
		var msg = { op:"map", key:node.key };
		evr.emit( "out", msg );

	},
	timeout(evr,node,field ) {
		var evrOpts = evr.opts;
		evrOpts.emitNot = false; // a timeout will be in place, prevent default emit.
		var nodeOpts = node.opts.bio;
		// field in this case is a callback for onTimeout accepting no args
		if( !nodeOpts.timeout )
			nodeOpts.timeout = setTimeout( ()=>{handleTimeout( evr, node, field )}, 250 )
		else {
			// duplicate not event?
		}
		// setup to alert when no data comes back on this node...
	},
	cancelTimeout( evr,node ) {
		var nodeOpts = node.opts.bio;
		if( nodeOpts.timeout )	{
			clearTimeout( nodeOpts.timeout );
			nodeOpts.timeout = null;
		}
	}
}

function handleTimeout( evr, node, cb ) {
	var nodeOpts = node.opts.bio;
	nodeOpts.timeout = null;
	cb();
}

function handleInput( evr, msg ) {
	console.log( "what is 'this'?", this, msg );
	if( msg.op === "get" ) {
		if( !msg.parent )
			var node = evr.get( msg.key, msg.text );
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
	if( msg.op === "put" ) {
		// remote mapping has discovered a path/property...
		var evrOpts = evr.opts.bio;
		if( msg.parent ) {
			var parentNode = evr.graph.get( msg.parent );
			if( !parentNode ) {
				// don't have the parent node to put this one on...
				// should probably definitely send to stop sending this to me?
				return;
			}
			// this will end up generating a write to self which we want to skip?
			var newNode = parentNode.get( msg.text, msg.key );

			// generate confirmation for reference to sender?
		} else {
			var node = evr.graph.get( msg.key );
			node.getProp( msg.field, msg.value );
		}
	}
	if( msg.op === "map" ) {
		var node = evr.get( msg.key );
		node.map( (val,field)=>{ sendFieldUpdates(evr, node,val,field) } )
	}
}

function sendFieldUpdates( evr, node, val, field ) {
	if( typeof val === "object" ) {
		var valNode = evr.get( val );
		evr.emit( "out", { op:"put", parent:node.key, key:valNode.key, text:valNode.text, tick:field.tick } );
	} else {
		evr.emit( "out", { op:"put", key:node.key, field:field.field, value: field.value, tick:field.tick } );
	}
}
