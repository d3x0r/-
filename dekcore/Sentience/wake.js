
// Wake is the interface from the main threaded side
// It creates a remote thread, setup using sandboxInit.js and sandboxPrerun.js
// 
//

const _debug_thread_create = false;
const _debug_commands = false;
const _debug_commands_input = _debug_commands || false;
const _debug_commands_send = _debug_commands || false;
const _debug_entity_command_handling = _debug_commands || false;
const _debug_getters = _debug_commands || false;
const _debug_run = false;

var sack = require( 'sack.vfs');
const util = require('util' );
const idMan = require( '../id_manager.js');
const fc = require( "../file_cluster.js");
var wt = require( 'worker_threads');
wt = ( wt.isMainThread && wt );

var Entity = require( '../Entity/entity.js');
const disk = sack.Volume();


const startupInitCode = disk.read( __dirname + "/sandboxInit.js" ).toString();
const startupPrerunCode = disk.read( __dirname + "/sandboxPrerun.js" ).toString();



function WakeEntity( e, noWorker ) {
    var runId = 0;
    const pendingRuns = [];

    function processMessage( msg, string ) {
        _debug_commands_input && console.trace( "core thread input: ",msg, string );
        try {
            if( msg.op )
                if( msg.op == 'error' ) {
                    console.log( "Error is a result to 'run'", msg );
                    var id = pendingRuns.findIndex( pend=>pend.id===msg.id);
                    if( id >= 0 ){
                        pendingRuns[id].runReject( msg.error );
                        pendingRuns.splice(id,1);
                    }
                    else {
                        console.log( "Error wasn't about a pending run...");
                    }
                } else if( msg.op == 'out' ) {
                    console.log( e.name, ":##:", msg.out );
                } else if( msg.op == 'echo' ) {
                    msg.op = msg.echo;
                    e.thread.post( msg );
                } else if( msg.op == 'f' ) {
                    _debug_entity_command_handling && console.log( "Received general 'f'... ", msg );
                    if( msg.f === "create" ){
                        // this one has a callback to get the result
                        // the others are all synchrounous normally
                        //console.log( "create message:", msg )
                        return e.create( msg.args[0], msg.args[1], (o)=>{
                            try {
                                //console.log( "And reply with created object" );
                                let msgout = {op:msg.op,id:msg.id,ret:o.Λ.toString()};
                                e.thread.post(msgout);
                            } catch(err) {console.log(err);}    
                        } )
                    } else {
                        if( !e[msg.f] ) {
                                e.thread.post( { op:'error',id:msg.id,error:"Unknown Thing:"+msg.f,stack:"Stack.." } );
                                return;
                        }
                        //console.log( "Doing:", msg.f );
                        var r = e[msg.f].apply(e,msg.args)
                        //console.log( "Result of call is:", r );
                        if( r instanceof Promise )
                            r.then((r)=> {
                                // r is a Number that is the code stack length...
                                // the result of the post run was stored with this ID
                                // so internally the scirpt has already run by this point
                                //console.log( "R is :", r );
                                e.thread.post( {op:msg.op,id:msg.id,ret:r} ) 
                            })
                                .catch((err)=>e.thread.post( { op:'error',id:msg.id,error:err,stack:err.stack } ) );
                        else {
                            sack.log( util.format( "it's a promise but not?", r ));
                            e.thread.post( {op:msg.op,id:msg.id,ret:r} );
                        }
                    }
                } else if( msg.op == 'e' ) {
                    var o = Entity.makeEntity( msg.o );
                    if( o ) {
                        var eParts = msg.e.split('.');
                        var f = o;
                        for( let i = 0; i < eParts.length; i++ ) f = f[eParts[i]];
                        if( !f )
                            console.log( "Failed to find function for 'e':", o, msg.e  )
                        _debug_entity_command_handling && console.log( "Calling method:", msg.e, msg.id  );
                        var r = f.apply(o, msg.args);
                        _debug_entity_command_handling && console.log( "Done with that method...", msg.e, msg.id );
                        if( r instanceof Promise ) {
                            r.then( (r)=>{
                                    //sack.log( util.format( "Promise result should be an integer here:", new Error().stack,msg, r ));
                                    
                                    if( msg.e === "wake" )// native wake now results with the thread instead of true/undefined
                                        e.thread.post({op:msg.op,id:msg.id,ret:!!r}) 
                                    else
                                        e.thread.post({op:msg.op,id:msg.id,ret:r}) 
                                })
                                .catch((err)=>e.thread.post( {op:'error',id:msg.id,error:err,stack:err.stack}));
                        } else {
                            //console.log( "And then r = ",r);
                            let msgout = {op:msg.op,id:msg.id,ret:r};
                            e.thread.post(msgout);
                        }
                    }
                } else if( msg.op == 'g' ) {
                    var r = e[msg.g];
                    if( r instanceof Promise ) {
                        r.then((r)=>{
                            _debug_getters && console.log( "my Getter called:", msg.g, "=", r );
                            let msgout = {op:msg.op,id:msg.id,ret:r};
                            e.thread.post(msgout);
                        }).catch((err)=>{
                            return e.thread.post( {op:'error',id:msg.id,error:err,stack:err.stack});
                        });
                    } else {
                        _debug_getters && console.log( "my Getter called:", msg.g, "=", r );
                        let msgout = {op:msg.op,id:msg.id,ret:r};
                        e.thread.post(msgout);
                    }
                } else if( msg.op == 'h' ) {
                    var o = Entity.makeEntity(msg.o);
                    if( !o ) { 
                        console.warn ( "failed to find entity", msg );
                        return e.thread.post( {op:'error',id:msg.id,error:"Failed to find entity",stack:"no stack"});
                    }
                    _debug_getters && console.log( "Getter called:", msg.h );
                    var r = o[msg.h];
                    if( r instanceof Promise ) {
                        r.then((r)=>{
                            _debug_getters && console.log( "Getter result:", r );
                            return e.thread.post({op:msg.op,id:msg.id,ret:r});
                        }).catch((err)=>e.thread.post( {op:'error',id:msg.id,error:err,stack:err.stack}) );
                    } else {
                        _debug_getters && console.log( "Getter result:", r );
                        return e.thread.post({op:msg.op,id:msg.id,ret:r});
                    }
                } else if( msg.op == 'run' ) {
                    _debug_run && console.log( "response to 'run'", msg );
                    var id = pendingRuns.findIndex( pend=>pend.id===msg.id);
                    _debug_run && sack.log( util.format("got Reply for run result:", id, msg ));
                    if( id >= 0 ){
                        pendingRuns[id].runResult( msg.ret );
                        pendingRuns.splice(id,1);
                    }
                } else if( msg.op === "initDone"){
                    resolveThread( thread );
                    var threadVolume = fc.Store( e.Λ );
                    sack.ObjectStorage.Thread.post(e.Λ.toString(), threadVolume );                    
                    //console.trace( "posting another storage for native", e.Λ.toString()+"?", e.name, msg);
                    sack.Volume.Thread.post(e.Λ.toString(), sack.Volume() );                    
                } else if( msg.op[0] == '~' ) {
                    console.log( "not an RPC...");
                }else {
                    //e.creator.push();
                }
            else {
                console.log( ":!!:", msg );
            }
        } catch(err) {
            if( msg ) {
                let msgout = {op:'error',id:msg.id,cmd:msg.op,error:err.message, stack:err.stack};
                //console.log( "Throw error result (back)to thread:", msgout, msg, err );
                e.thread.post(msgout);
            } else {
                e.thread.post(util.format( "WHAT?", err ));

            }
        }

    }

    function makeIng( verb ) {
        if( verb.endsWith( "y" ) 
            || verb.endsWith( "o" ) 
            || verb.endsWith( "a" )
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
        , watchers: []
        , post(msg) {
            //thread.worker.stdin.write( JSOX.stringify(msg) );
            _debug_commands_send && console.log( "Post run:", msg );
            thread.worker.postMessage( msg );
        }
        , runFile(code) {
            let code_;
            if( disk.exists( code ) ){
                code_ = disk.read( code );
                if( code_ ) code_ = code_.toString();
            }else
                code_ = code;
            if( code_ ) {
                console.log( "RunFile:", code );
                var msg = {op:'run', file:code, code:(code_), id:runId};
                thread.post(msg);
                return new Promise( (res,rej)=>{
                    pendingRuns.push( { runResult : res, runReject: rej, id : runId++ } );
                })
            }
        }
        ,get pendingRuns() { return pendingRuns}
        , run(file,code) {
            if( thread.worker ) {
                return new Promise( (res,rej)=>{
                    _debug_run && sack.log( util.format("Posting run:", file, code, "to", e.name, new Error("").stack ));
                    var msg = {op:'run', file:file, code:(code), id:runId };
                    thread.post(msg); 
                    //console.log( "Pending run has pushed this one... and we return a promise.");
                    pendingRuns.push( { module:e._module
                        , runResult : res
                        , runReject: rej
                        , id : runId++ } );
                })
            }else {
                console.trace( "thread does not have a worker, Run fail. This shouldn't be running any VM code Yet.");
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
            if( data instanceof idMan.keyRef )
                data = data.toString();
            // drop the promise result, there is no then or catch.
            if( thread.worker )
                thread.post( { op:"on", on:event, args:data });
            thread.watchers.forEach( watcher=>{
                watcher.thread.post( {op:"on",Λ:entity.Λ.toString(),on:event,args:data} )
            })
        }
    }
    e.thread = thread;
    if( wt && !noWorker ) {
        _debug_thread_create && console.trace( "Waking up entity:", e.name, e.Λ, e.thread )
        // this is the thread that should be this...
        // so don't create a worker thread again. (tahnkfully worker_thread fails import of second worker_threads.)
        const invokePrerun = `{vm.runInContext( ${JSON.stringify(startupPrerunCode)}, sandbox, {filename:"sandboxPrerun.js"});}`

        //console.log( "Wanting to remount ...", fc.cvol  )

        fc.cvol.mount(e.Λ.toString()); 
	
	thread.worker = new wt.Worker( 'const Λ=' + JSON.stringify(e.Λ.toString()) + ";" 
            + 'Λ.maker=' + JSON.stringify(e.created_by.Λ.toString()) + ";" 
            + startupInitCode
            + invokePrerun
            , {
                //workerData: script,
                eval : true,
                stderr:true,
                stdin:true,
                stdout:true,
            })
        thread.worker.on("message",processMessage);
        var resolveThread;

        thread.worker.stdout.on('data', (chunk)=> {
            ( (string)=>{
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
    console.log( "Returning promise for thread, without worker(?)");
    return Promise.resolve( thread );
}

exports.WakeEntity = WakeEntity;