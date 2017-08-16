
var ws = require( "websocket" );

var evr = require( "./evr.js" );

evr.addRemoteStorage( driver );

var maps = [];
var connections = new Map();
const driver = {
	init(evr) {
        	var wscOpts = evr.opts.wsc = param.opts.wsc || {};
                // serial initializers; allowing single options to be initialized as required
                wscOpts.peers = wscOpts.peers || [];
                wscOpts.protocols = wscOpts.protocols || null;
        	maps.push( evr );

        },
	read(evr,node) {
		wsRead( evr, node );
    },
	write(evr,node ) {

	},
	timeout(evr,node ) {
		var wscNodeOpts = node.opts.wsc || { };
        	wscNodeOpts.timeout = setTimeout( ()=>{
			node.opts.wsc.timeout = null;

		}, 250 );
    },
	cancelTimeout(evr,node ) {
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




var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 8080;

var Gun = require('../');
var gun = Gun({
	file: 'data.json',
	s3: {
		key: '', // AWS Access Key
		secret: '', // AWS Secret Token
		bucket: '' // The bucket you want to save into
	}
});

var server = require('http').createServer(function(req, res){
	require('fs').createReadStream(require('path').join(__dirname, req.url)).on('error',function(){ // static files!
		res.writeHead(200, {'Content-Type': 'text/html'});
		res.end(require('fs').readFileSync(require('path').join(__dirname, 'index.html'))); // or default to index
	}).pipe(res); // stream
});

// do not do this to attach server... instead pull websocket provider and use that.
// gun.wsp(server);

var ws = require( 'ws' ); // default websocket provider gun used...
var WebSocketServer = ws.server;

var wss = new WebSocketServer( {
        server: server, // 'ws' npm
        autoAcceptConnections : false // want to handle the request (websocket npm?)
    }

wss.on('connection',acceptConnection )

var gunPeers = [];  // used as a list of connected clients.

var evr = require( "./evr.js" );
evr.xx = z

Gun.on('out', function(msg){
	msg = JSON.stringify({headers:{},body:msg});
	gunPeers.forEach( function(peer){ peer.send( msg ) })
})
function acceptConnection( connection ) {
    // connection.upgradeReq.headers['sec-websocket-protocol'] === (if present) protocol requested by client
    // connection.upgradeReq.url  === url request
    console.log( "connect?", req.upgradeReq.headers, req.upgradeReq.url )
    gunPeers.push( connection );
    connection.on( 'error',function(error){console.log( "WebSocket Error:", error } );
    connection.on( 'message',function(msg){gun.on('in',JSON.parse( msg.utf8Data).body)})
    connection.on( 'close', function(reason,desc){
        // gunpeers gone.
        var i = peers.findIndex( function(p){return p===connection} );
        if( i >= 0 )
            gunPeers.splice( i, 1 );

    })
}

server.listen(port);

console.log('Server started on port ' + port + ' with ');
