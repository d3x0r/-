
var ws = require( "websocket" );

var evr = require( "./evr.js" );

evr( driver );

var maps = [];       	
var connections = new Map();
function driver( op, evr, node ) {
	if( op === "init" ) {
        	var wscOpts = evr.opts.wsc = param.opts.wsc || {};
                // serial initializers; allowing single options to be initialized as required
                wscOpts.peers = wscOpts.peers || [];
                wscOpts.protocols = wscOpts.protocols || null;
        	maps.push( evr );

        }else if( op === "read" ) {
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

function handleMessage( msg ) {
	if( msg.op === "got" ) {
        	// server knew more about this than me...
        }
}

function wsRead( evr, node ) {
	connections.forEach( ws=>{
		if( !node.parent )
	        	ws.send( `{"op":"getroot","key":${node.key},"state":${node.state}}` );
		else
	        	ws.send( `{"op":"getpath","p":${parent.key},"text":${node.text},"state":${node.state}}` );
        });
}
