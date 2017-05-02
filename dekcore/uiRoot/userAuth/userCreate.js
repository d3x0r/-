


//---------- lame connection stuff ------------------------



function wsConnect( protocol ) {

var ws;
function doWsConnect( protocol ) {
    var ws = new WebSocket( `wss://${location.host}`, protocol );
    ws.onopen = wsOpen;
    ws.onmessage = wsMessage;
    ws.onclose = wsClose;
    ws.protocolSpec = protocol;
     return ws;
}

function wsMessage( msg ) {
    //msg.data;
}
function wsOpen() {
    // yay.
    ws.send( JSON.stringify( {op:"login",key:key} ) );
}
function wsClose() {
    ws = wsConnect( ws.protocolSpec ); // reconnect
}



ws = wsConnect( [protocol] );
}