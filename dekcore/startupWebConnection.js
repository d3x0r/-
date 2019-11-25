async function buildPiping(){
    // opens our internal weak parser on the current object.
    // only one of these can work though. 
    //	var webCons = require( './command_stream_filter/webConsole.js' ).Filter();

    function localClientFilter(options) {
        this.ws = options.ws;
        options = options || {};
        options.decodeStrings = false;
                stream.Duplex.call(this,options)
    }

    util.inherits(localClientFilter, stream.Duplex)

    localClientFilter.prototype._read = function( size ) {
        //console.warn( "Read called...", size );  // 16384 by default... 
    }

    localClientFilter.prototype._write = function( chunk, decoding, callback ) {
        //console.warn( "write called:", chunk );
        try {
        this.ws.send( JSON.stringify( {op:'write', data:chunk.toString( 'utf8' )} ) );
        } catch( err) { /* already closed... */ }
        callback();
    }


    function clientFilter(ws) {
        var tmp = {
                filter : new localClientFilter( {ws:ws} )
                , connectInput : function(stream) { 
                        stream.pipe( this.filter );
                    }
                    ,connectOutput : function(stream) { 
                        this.filter.pipe( stream );
                    } 
            };
            tmp.filter.on("finish", ()=>{
                console.trace( "WebConsole Finish Event");
            });
            tmp.filter.on("end", ()=>{
                console.trace( "WebConsole End Event");
            });
            tmp.filter.on("close", ()=>{
                console.trace( "WebConsole Close Event");
            });
            return tmp;

    }

    const shellCommands = await require( "./Sentience/shell.js");
    console.log( "Result of require shell:", shellCommands );
  //var cons = require( './command_stream_filter/psi_console.js' ).Filter();
 const shell = (shellCommands).Filter( this );
  require(  './command_stream_filter/strip_newline.js' ).then( (newline)=>{
    console.log( "So the thing ran, resulted, and we got back the result??")
    require( './command_stream_filter/monitor_filter.js' ).then( monitor=>{
    //var commandFilter = require( './command_stream_filter/command.js');
console.log( "Got newline:", )
    //var shell = io.command;
    var nl = newline.Filter();
    var output = clientFilter();
    //var cmd = commandFilter.Filter();

    //nl.connectInput( process.stdin );
    nl.connectOutput( shell.filter );
    shell.connectOutput( output.filter );

    const sack = await require("sack.vfs" );


    
    sack.WebSocket.Thread.accept(Λ,(id,ws)=>{ 
        console.log( "Caught a new socket:", id, ws );
        if( id !== Λ ) {
            console.log( "Accept key is not correct?", id, Λ );
            return false;
        }
        
        ws.onmessage( function( msg ) {             
            console.warn( "Received data:", msg );   
            
            var msg_ = JSOX.parse( msg );    
            if( msg_.op === "write" ) {   
                nl.write( msg_.data );
            } else {   
                
            }  
        } );  
        ws.onclose( function() {  
                //console.log( "Remote closed" );  
            } );
        });
        
    })

}); 


}

return buildPiping();
