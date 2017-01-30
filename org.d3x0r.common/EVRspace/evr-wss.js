
var ws = require( "websocket" );

var evr = require( "./evr.js" );

evr( driver );

var maps = [];       	
var connections = new Map();
function driver( op, evr, node, field ) {
	if( op === "init" ) {
		// an EVR instance existed, or is being created.
        	var wscOpts = evr.opts.wsc = param.opts.wsc || {};
                // serial initializers; allowing single options to be initialized as required
                wscOpts.peers = wscOpts.peers || [];
                wscOpts.protocols = wscOpts.protocols || null;
        	maps.push( evr );

        }else if( op === "read" ) {
		var wscNodeOpts = node.opts.wsc || { };
		wsRead( evr, node );
        }else if( op === "write" ) {
        	
        }else if( op === "timeout" ) {
		var wscNodeOpts = node.opts.wsc || { };
        	wscNodeOpts.timeout = setTimeout( ()=>{
			node.opts.wsc.timeout = null;
			
		}, 250 );
        }else if( op === "cancelTimeout" ) {
		if( node.opts.wsc.timeout ) {
	        	clearTimeout( node.opts.wsc.timeout );
			node.opts.wsc.timeout = null;
		}
        }
        
}


function makeConnection( opts ) {
	// for each peer, attempt to connect, if not already connected.
        opts.peers.forEach( (peer)=>{
        	var ws = connections( peer );
                if( ws ) {
                	// already connected
                } else {
                	new WebSocket( peer, wsc.protocols );
                }
        } );
}

function handleMessage( ws, evr, msg ) {
	if( msg.op === "getroot" ) {
		var node = evr.graph.get( msg.key );
		if( node ) {
			if( msg.state < node.state ) {
				ws.send( `{"op":"got","key":"${node.key}","state":${node.state}}` );
			}
		}else {
			evr.get( msg.key );
		}
        	// server knew more about this than me...
        }
	if( msg.op === "getpath" ) {
		var node = evr.graph.get( msg.key );
		if( node ) {
			if( msg.state < node.state ) {
				ws.send( `{"op":"got","key":"${node.key}","state":${node.state}}` );
			}
		}
        	// server knew more about this than me...
        }
}

function wsRead( evr, node ) {
	connections.forEach( ws=>{
        	ws.send( `{"op":"get","key":${node.key},"text":${node.text},"state":${node.state}}` );
        });
}
