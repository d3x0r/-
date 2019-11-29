const stream = await require( "stream" );

const g = this;

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
        this.ws.send( JSON.stringify( {op:'write', data:chunk.toString( 'utf8' )} ) );
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


return require("sack.vfs" ).then(sack=>{
    
    sack.WebSocket.Thread.accept(Λ,async (id,ws)=>{ 
        if( id !== Λ ) {
            console.log( "Accept key is not correct?", id, Λ );
            return false;
        }
        const shellCommands = await require( "./Sentience/shell.js");
        const shell = (shellCommands).Filter( this );
        var nl;
    
        await require(  './command_stream_filter/strip_newline.js' ).then( (newline)=>{
            return require( './command_stream_filter/monitor_filter.js' ).then( monitor=>{
                //var commandFilter = require( './command_stream_filter/command.js');
                //var shell = io.command;
                nl = newline.Filter();
                var output = clientFilter(ws);
                //var cmd = commandFilter.Filter();
                g.io.output = (out)=>{
                    output.filter.write( out );
                    // after this, and before resume() do not log.
                }
                //nl.connectInput( process.stdin );
                nl.connectOutput( shell.filter );
                shell.connectOutput( output.filter );
            }); 
        })
    
        //console.log( "Setup message handeler..." );        
        ws.onmessage( function( msg ) {
            // this goes out the socket that a message has come in on?
            // only this thread is different than the receiving thread.
            //console.warn( "Received data:", msg );   
            
            var msg_ = JSOX.parse( msg );    
            if( msg_.op === "write" ) {   
                nl.write( msg_.data );
            } else if( msg_.op === "load" ) {   
                // get a script from this file's storage.
                //nl.write( msg_.data );
            } else if( msg_.op === "save" ) {   
                // update a script into the storage... 
                //nl.write( msg_.data );
            } else {   
                
            }  
        } );  
        ws.onclose( function() {  
                //console.log( "Remote closed" );  
        } );
        ws.resume();
        // after this point, can log... 
    });
    
})

