
const idGen = require( "./id_generator.js" );

module.exports = exports = ((orig)=>{
	(a,b)=>{
		var ws = new orig( a, b );
                ws.keyt = null;
                ws.keyr = null;
                ws._open = false;
                ws.onopen = (cb)=>{ ws.on( "open", cb ) };
                ws.onmessage = (cb)=>{ ws.on( "message", cb ) };
                ws.onerror = (cb)=>{ ws.on( "error", cb ) };
                ws.onclose = (cb)=>{ ws.on( "close", cb ) };
                ws.on = ((orig)=>(event,cb)=>{
                	if( event === "message" ) {
                        	orig( event, (buf)=>{
                                	buf.data = idGen.u8xor( buf.data, ws.keyr )
                                	cb( buf ) ;
                                } )
                        } else if( event === "open" ) {
                        	if( !ws._open ) {
	                        	orig( event, ()=>{
        	                        	let key = idGen.generator();
                	                	ws.send( key );
				                ws.keyt = { key : key, step : 0 };
                				ws.keyr = { key : key, step : 1 };
                                        	cb();
	                                } );
                                        ws._open = true;
                                } else {
                                	orig( event, cb );
                                }
                        } else {
                        	orig( event, cb );
                        }
                } )( ws.on.bind(ws) );
                
                ws.send = ((orig)=>(buf)=>{
                	if( ws.keyt )
	                	orig( idGen.u8xor( buf, ws.keyt ) );
                        else
	                	orig( buf );
                } )( ws.send.bind(ws) );
	}
})(WebSocket);
function 
