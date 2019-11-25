const _debug_thread_create = false;
const _debug_commands = false;

var sack = require( 'sack.vfs');
var wt = global.isMainThread && require( 'worker_threads');
// this is a sandbox; and we don't have real entity support.
var Entity = require( '../Entity/entity.js');
console.log( "Did require Entity:", Entity );
JSOX = sack.JSOX;
disk = sack.Volume();


const startupCode = require('sack.vfs').Volume().read( __dirname + "/sandboxInit.js" ).toString();
async function WakeEntity( e, noWorker ) {
    var runId = 0;
    const pendingRuns = [];
    const thread = {
        worker : null
        ,runFile(code) {
            let code_;
            if( disk.exists( code ) ){
                code_ = disk.read( code );
                if( code_ ) code_ = code_.toString();
            }else
                code_ = code;
            if( code_ ) {
                var msg = {op:'run', file:code, code:code_, id:runId};
                thread.worker.stdin.write(JSOX.stringify(msg));
                return new Promise( (res,rej)=>{
                    pendingRuns.push( { runResult : res, runReject: rej, id : runId++ } );
                })
            }
        }
        ,async run(file,code) {
            if( thread.worker ) {
                //console.log( "Sending work to thread to run....");
                var msg = {op:'run', file:file,code:code, id:runId };
                thread.worker.stdin.write(JSOX.stringify(msg));
                return new Promise( (res,rej)=>{
                    //console.log( "Pending run has pushed this one... and we return a promise.");
                    pendingRuns.push( { runResult : res, runReject: rej, id : runId++ } );
                })
            }else {
                if( !e.sandbox ) {
                    e.sandbox = {
                         scripts : { code: [], index : 0, push(c){ this.index++; this.code.push(c)} }
                    }
                }
                e.sandbox.scripts.push( { type:"run", file:file, code:code } );
                vm.runInContext(code, this.sandbox, { filename: file, lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 10 })
            }
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
                stderr:false,
                stdin:true,
                stdout:true,
            })
        //worker.stdout.connectOutput( sandbox.io.commmand );
        thread.worker.stdout.on('data', (chunk)=> {
            // chunk is given as 'buffer' and is a buffer
            //console.log( `text parse : ${chunk}` );
            //console.log( encoding );
            (async (string)=>{
                //console.log( "Received:", string );
                if( string[0]== '[' || string[0] == '{' )
                    try {
                        const msg = JSOX.parse( string );
                        _debug_commands && console.log( "thread stdout input: ",msg, string );

                        try {
                            if( msg.op == 'error' ) {
                                var id = pendingRuns.findIndex( pend=>pend.id===msg.id);
                                if( id >= 0 ){
                                    pendingRuns[id].runReject( msg.error );
                                    pendingRuns.splice(id,1);
                                }
                            } else if( msg.op == 'f' ) {
                                if( msg.f === "create" ){
                                    // this one has a callback to get the result
                                    // the others are all synchrounous normally
                                    e.create( msg.args[0], msg.args[1], (o)=>{
                                        try {
                                            let msgout = `{op:f,id:${msg.id},ret:${JSOX.stringify(o.Λ)}}`;
                                            e.thread.worker.stdin.write(msgout);
                                        } catch(err) {console.log(err);}    
                                    } )
                                }else {
                                    var r = await e[msg.f].apply(e,msg.args);
                                    let msgout = `{op:f,id:${msg.id},ret:${JSOX.stringify(r)}}`;
                                    e.thread.worker.stdin.write(msgout);
                                }
                            } else if( msg.op == 'e' ) {
                                var o = Entity.makeEntity( msg.o );
                                if( o ) {
                                    var eParts = msg.e.split('.');
                                    var f = o;
                                    for( let i = 0; i < eParts.length; i++ ) f = f[eParts[i]];
                                    if( !f )
                                        console.log( "f:", o, msg.e  )
                                    var r = await f.apply(o, msg.args);
                                    //console.log( "And then r = ",r);
                                    let msgout = `{op:e,id:${msg.id},ret:${JSOX.stringify(r)}}`;
                                    e.thread.worker.stdin.write(msgout);
                                }
                            } else if( msg.op == 'g' ) {
                                var r = e[msg.g];
                                let msgout = `{op:g,id:${msg.id},ret:${JSOX.stringify(r)}}`;
                                e.thread.worker.stdin.write(msgout);
                                //e[msg.f].call(e,msg.args);
                            } else if( msg.op == 'h' ) {
                                var o = Entity.makeEntity(msg.o);
                                var r = o[msg.h];
                                let msgout = `{op:h,id:${msg.id},ret:${JSOX.stringify(r)}}`;
                                e.thread.worker.stdin.write(msgout);
                                //e[msg.f].call(e,msg.args);
                            } else if( msg.op == 'run' ) {
                                var id = pendingRuns.findIndex( pend=>pend.id===msg.id);
                                _debug_commands && console.log( "Replying with run result:", id, msg );
                                if( id >= 0 ){
                                    pendingRuns[id].runResult( msg.ret );
                                    pendingRuns.splice(id,1);
                                }
                            } else if( msg.op[0] == '~' ) {
                                console.log( "not an RPC...");
                            }else {
                                //e.creator.push();
                            }
                        } catch(err) {
                            if( msg ) {
                            let msgout = `{op:'error',id:${msg.id},cmd:${JSOX.stringify(msg.op)},error:${JSOX.stringify(err.message)}, stack:${JSOX.stringify(err.stack)}}`;
                            console.log( "Throw error result to thread:", msgout );
                            e.thread.worker.stdin.write(msgout);
                            } else {
                                e.thread.worker.stdin.write(util.format( "WHAT?", err ));

                            }
                        }
                    }catch(err){
                        console.log( e.name, ":Thread Output:", string, err );
                    }
                else {
                    console.log( e.name, ":##:", string );

                }
            }  )( chunk.toString('utf8') );
            }
        );

        //worker.stdout.connectOutput( sandbox.io.commmand );
        //worker.on('message', resolve);
        thread.worker.on('error', (error)=>{
            console.log( "Error from thread:", error );
        });
        thread.worker.on('exit', (code) => {
            if (code !== 0);
            //reject(new Error(`Worker stopped with exit code ${code}`));
        });
    }else {
        console.trace( "This would have to call the main scheduler to create a thread... ");
    }
    return Promise.resolve( thread );
}

exports.WakeEntity = WakeEntity;