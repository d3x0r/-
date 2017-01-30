
//var ws = require( "websocket" );

//var evr = require( "./evr.js" );


function makeWebSockDriver() {
        var ws = {
		, maps : []
		, connections = new Map()
	};
	EVR( driver );

function driver( op, evr, node ) {
	if( op === "init" ) {
        	var wscOpts = evr.opts.wsc = param.opts.wsc || {};
                // serial initializers; allowing single options to be initialized as required
                wscOpts.peers = wscOpts.peers || [];
                wscOpts.protocols = wscOpts.protocols || null;
        	ws.maps.push( evr );

        }else if( op === "read" ) {
		wsRead( evr, node );
        }else if( op === "write" ) {
        	
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
        	ws.send( `{"op":"get","key":"${node.key}","text":"${node.text}","state":${node.state}}` );
        } );
}

}
makeWebSockDriver();