const _debug_thread_create = false;
const _debug_commands = false;
const _debug_commands_input = _debug_commands || false;
const _debug_commands_send = _debug_commands || false;

var sack = require( 'sack.vfs');
const util = require('util' );
var wt = global.isMainThread && require( 'worker_threads');
// this is a sandbox; and we don't have real entity support.
var Entity = require( '../Entity/entity.js');
//console.log( "Did require Entity:", Entity );
JSOX = sack.JSOX;
disk = sack.Volume();


const startupCode = require('sack.vfs').Volume().read( __dirname + "/sandboxInit.js" ).toString();
async function WakeEntity( e, noWorker ) {
    var runId = 0;
    const pendingRuns = [];

    async function processMessage( msg, string ) {
        _debug_commands_input && console.trace( "core thread input: ",msg, string );
        try {
            if( msg.op )
                if( msg.op == 'error' ) {
                    var id = pendingRuns.findIndex( pend=>pend.id===msg.id);
                    if( id >= 0 ){
                        pendingRuns[id].runReject( msg.error );
                        pendingRuns.splice(id,1);
                    }
                } else if( msg.op == 'out' ) {
                    console.log( e.name, ":##:", msg.out );
                } else if( msg.op == 'f' ) {
                    if( msg.f === "create" ){
                        // this one has a callback to get the result
                        // the others are all synchrounous normally
                        e.create( msg.args[0], msg.args[1], (o)=>{
                            try {
                                let msgout = {op:msg.op,id:msg.id,ret:o.Λ};
                                e.thread.post(msgout);
                            } catch(err) {console.log(err);}    
                        } )
                    }else {
                        if( !e[msg.f] ) {
                                e.thread.post( { op:'error',id:msg.id,error:"Unknown Thing:"+msg.f,stack:"Stack.." } );
                                return;
                        }
                        var r = e[msg.f].apply(e,msg.args);
                        if( r instanceof Promise ) {
                            r = await r;
                        }
                        let msgout = {op:msg.op,id:msg.id,ret:r};
                        e.thread.post(msgout);
                    }
                } else if( msg.op == 'e' ) {
                    var o = Entity.makeEntity( msg.o );
                    if( o ) {
                        var eParts = msg.e.split('.');
                        var f = o;
                        for( let i = 0; i < eParts.length; i++ ) f = f[eParts[i]];
                        if( !f )
                            console.log( "f:", o, msg.e  )
                        var r = f.apply(o, msg.args);
                        if( r instanceof Promise ) {
                            r = await r;
                        }
                        //console.log( "And then r = ",r);
                        let msgout = {op:msg.op,id:msg.id,ret:r};
                        e.thread.post(msgout);
                    }
                } else if( msg.op == 'g' ) {
                    var r = e[msg.g];
                    if( r instanceof Promise ) {
                        r = await r;
                    }
                    console.log( "my Getter called:", msg.g );
                    let msgout = {op:msg.op,id:msg.id,ret:r};
                    e.thread.post(msgout);
                    //e[msg.f].call(e,msg.args);
                } else if( msg.op == 'h' ) {
                    var o = Entity.makeEntity(msg.o);
                    if( !o ) { 
                        console.warn ( "failed to find entity", msg );
                        e.thread.post( {op:'error',id:msg.id,error:"Failed to find entity",stack:"no stack"});
                    }
                    console.log( "Getter called:", msg.h );
                    var r = o[msg.h];
                    if( r instanceof Promise ) {
                        r = await r;
                        console.log( "Getter resolved r:", r );
                    }
                    console.log( "Getter result:", r );
                    let msgout = {op:msg.op,id:msg.id,ret:r};
                    e.thread.post(msgout);
                    //e[msg.f].call(e,msg.args);
                } else if( msg.op == 'run' ) {
                    var id = pendingRuns.findIndex( pend=>pend.id===msg.id);
                    _debug_commands && console.log( "Replying with run result:", id, msg );
                    if( id >= 0 ){
                        pendingRuns[id].runResult( msg.ret );
                        pendingRuns.splice(id,1);
                    }
                } else if( msg.op === "initDone"){
                    resolveThread( true );
                } else if( msg.op[0] == '~' ) {
                    console.log( "not an RPC...");
                }else {
                    //e.creator.push();
                }
            else {
                //console.log( string ||  );
            }
        } catch(err) {
            if( msg ) {
                let msgout = {op:'error',id:msg.id,cmd:msg.op,error:err.message, stack:err.stack};
                console.log( "Throw error result (back)to thread:", msgout, msg, err );
                e.thread.post(msgout);
            } else {
                e.thread.post(util.format( "WHAT?", err ));

            }
        }

    }

    function makeIng( verb ) {
        if( verb.endsWith( "y" ) 
            || verb.endsWith( "o" ) 
            ||verb.endsWith( "a" )
            || verb.endsWith( "u" )
            || verb.endsWith( "w" ) ) {
            // try -> trying
            // scuba -> scubaing
            // moto -> motoing
            return verb + "ing";
        } else if( verb.endsWith( "e" ) ) {
            if( verb[verb.length-2] === 'i') {
                // untie untying
                return verb.substr(0,verb.length-2) + "ying";
            }
            // make -> making
            // congrue ->congruing
            return verb.substr(0,verb.length-1) + "ing";
        } else {
            // ram -> ramming
            return verb + verb.substr(verb.length-1,1) + "ing";
        }
    }

    const thread = {
        worker : null
        ,something: null
        ,post(msg) {
            //thread.worker.stdin.write( JSOX.stringify(msg) );
            thread.worker.postMessage( msg );
        }
        ,runFile(code) {
            let code_;
            if( disk.exists( code ) ){
                code_ = disk.read( code );
                if( code_ ) code_ = code_.toString();
            }else
                code_ = code;
            if( code_ ) {
                var msg = {op:'run', file:code, code:(code_), id:runId};
                _debug_commands_send && console.log( "Post runFile:", msg );
                thread.post(msg);
                return new Promise( (res,rej)=>{
                    pendingRuns.push( { runResult : res, runReject: rej, id : runId++ } );
                })
            }
        }
        ,async run(file,code) {
            if( thread.worker ) {
                //console.log( "passing check for madefrom?")
                //var allow = await ID.madeFrom( e.Λ, something );
                //console.log( "is allow:", allow );
                var msg = {op:'run', file:file, code:(code), id:runId };
                _debug_commands_send && console.log( "Post run:", msg );
                thread.post(msg);
                return new Promise( (res,rej)=>{
                    //console.log( "Pending run has pushed this one... and we return a promise.");
                    pendingRuns.push( { runResult : res, runReject: rej, id : runId++ } );
                })
            }else {
                console.log( "This shouldn't be running any VM code Yet.")
                if( !e.sandbox ) {
                    e.sandbox = {
                         scripts : { code: [], index : 0, push(c){ this.index++; this.code.push(c)} }
                    }
                }
                e.sandbox.scripts.push( { type:"run", file:file, code:code } );
                vm.runInContext(code, this.sandbox, { filename: file, lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 10 })
            }
        }
        
        , 
        // ing() is an event but allows a cancel event from any participant. 
        // return value is 'may' or 'may not'  
        //        May = if forced accept or any may accept, this will get called for 'on'.  
        //        may not = if forced accept do not notify this.
        // return value is 'must' or 'must not'  
        //       force accept, force cancel all
        //       all handler must still be called to get their may/may not.
        //       a force cancel will override a force accept.
        ing( event, data ) {
            return thread.post( { op:"ing", ing:makeIng(event), args:data });
        }
        , emit( event, data ) {
            // drop the promise result, there is no then or catch.
            thread.post( { op:"on", on:event, args:data });
        }
    }

    e.thread = thread;
    if( wt && !noWorker ) {
        _debug_thread_create && console.trace( "Waking up entity:", e.name, e.Λ, e.thread )
        // this is the thread that should be this...
        // so don't create a worker thread again. (tahnkfully worker_thread fails import of second worker_threads.)
        thread.worker = new wt.Worker( 'const Λ=' + JSON.stringify(e.Λ) + ";" 
            + 'Λ.maker=' + JSON.stringify(e.created_by.Λ) + ";" 
            + startupCode
            , {
                //workerData: script,
                eval : true,
                stderr:true,
                stdin:true,
                stdout:true,
            })
        thread.worker.on("message",processMessage);
        var resolveThread;
        //worker.stdout.connectOutput( sandbox.io.commmand );

        thread.worker.stdout.on('data', (chunk)=> {
            ( (string)=>{
                //_debug_commands_input && process.stdout.write( util.format("Core Thread Received:", string ));
                //console.log( e.name, ":##:", string );
                thread.worker.postMessage( {op:"out",out:string});
            }  )( chunk.toString('utf8') );
            }
        )
        thread.worker.on('error', (error)=>{
            console.log( "Error from thread:", error );
        });
        thread.worker.on('exit', (code) => {
            if (code !== 0);
            console.log(`Worker stopped with exit code ${code}`);
        });
        return new Promise( (res,rej)=>{
            resolveThread = res;
        })
    }else {
        console.trace( "This would have to call the main scheduler to create a thread... ");
    }
    console.log( "Returning promise for thread");
    return Promise.resolve( thread );
}

exports.WakeEntity = WakeEntity;