
const _debugPaths = false;
const _debug_commands = false;
const _debug_requires = false;
const _debug_command_input = false;
const _debug_command_post = _debug_commands || false;

const _debug_events = false;
const _debug_event_input = _debug_events || false;
Error.stackTraceLimit = 10;
const util = require('util'); 
const stream = require('stream');
const vm = require('vm' );
const sack = require('sack.vfs');
const path = require('path');
const wt = require( 'worker_threads');
const njs_module = require('module');

const builtinModules = njs_module.builtinModules.slice(0);
builtinModules.require = require;
const disk = sack.Volume();
const JSOX = sack.JSOX;

const coreThreadEventer = wt.parentPort ;

const netRequire = require( "./util/myRequire");


var id = 0;
var eid = 0;
const objects = new Map();

const entity = makeEntity(Λ);
//console.log( "This is logged in the raw startup of the sandbox:", Shell );

const resolvers = {};
const rejectors = {};
const pendingOps = [];

const drivers = [];
var remotes = new WeakMap();
var requireRunReply = [];
var pendingRequire = false;
var codeStack = [];

function emitEvent( event, data ){
    const runcode = `this.emit_( ${JSON.stringify(event)}, ${JSOX.stringify(data) })`
    var res = vm.runInContext(runcode, sandbox , { filename:"Event Dispatch:"+event, lineOffset:0, columnOffset:0, displayErrors:true} );
    return res;
}

function processMessage( msg, stream ) {
    if( "string" === typeof msg ) {
        console.trace( "String input");
    }
    function reply(msg ) {
        if( stream ) 
            process.stdout.write( JSOX.stringify(msg));
        else
            coreThreadEventer.postMessage( msg );
    }
    if( msg.op === "run"){
        var prior_execution = codeStack.find( c=>c.path === msg.file.path );
        if( prior_execution )
            console.log( "Duplicate run of the same code; shouldn't we just return the prior?  I mean sure, maybe the filter of this should be higher?", msg .file, codeStack );
        _debug_commands && console.log( "Run some code...", codeStack, msg.file );
        var res;
        try {
            const code = {file: msg.file, result:null}
            codeStack.push( code );
            console.log( "going to run...");
            var res = vm.runInContext(msg.code, sandbox , { filename:msg.file.src, lineOffset:0, columnOffset:0, displayErrors:true } );
            if( res && ( res instanceof Promise || Promise.resolve(res) === res || ( "undefined" !== typeof res.then ) ) )
                res.then(
                    (realResult)=>{
                        //_debug_commands && 
                        //console.log( "And post result.", pendingRequire, realResult );
                        if( pendingRequire ){
                            code.result = realResult;
                            requireRunReply.push( realResult );
                            reply( {op:"run",ret:0,id:msg.id });
                        }else
                            reply( {op:"run",ret:realResult,id:msg.id });
                    }
                ).catch(err=>{
                    if(err)
                        reply( ( {op:"error"
                                ,file:msg.file.src,error:err.toString()+(err.stack?err.stack.toString():"NoStack"),id:msg.id }));
                    else
                        reply( ( {op:"error",file:msg.file.src,error:"No Error!",id:msg.id }));
                });
            else {

                if( pendingRequire )
                    requireRunReply.push(res);
                console.log( "And post sync result.", res );
                reply( ( {op:"run",ret:res,id:msg.id }));
            }
            //console.log( "Did it?", sandbox );
            return;
        }catch(err) {
            console.log( "Failed:", err, msg.code )
            reply( ( {op:"error",error:err.toString(), stack:err.stack, id:msg.id }));
            return;
        }
    } else if( msg.op === "ing" ) {
        return sandbox.ing( msg.ing, msg.args );
    } else if( msg.op === "On" ) {
        var e = objects.get( msg.on );
        switch( true ){
            case "name" === msg.On:
                e.cache.name = msg.args;
                break;
            case "description" === msg.On:
                e.cache.desc = msg.args;
                break;
        }
    } else if( msg.op === "out" ) {
        if( sandbox.io.output )
            sandbox.io.output( msg.out );
        else
            coreThreadEventer.postMessage( msg );
        //reply(msg.out);
        return;
    } else if( msg.op === "on" ) {
        _debug_event_input && console.log( "emit event:", msg );
    try {

        switch( true ){
            case "name" === msg.on:
                entity.cache.name = msg.args;
                //msg.args = makeEntity( msg.args)
                break;
            case "rebase" === msg.on:
                msg.args = makeEntity( msg.args)
                break;
            case "debase" === msg.on:
                msg.args = makeEntity( msg.args );
                break;
            case "joined" === msg.on:
                msg.args = makeEntity( msg.args );
                break;
            case "parted" === msg.on:
                entity.cache.near.part( msg.args );
                msg.args = makeEntity( msg.args );
                break;
            case "placed" === msg.on:
                entity.cache.near.place( msg.args );
                msg.args = makeEntity( msg.args );
                break;
            case "displaced" === msg.on:
                //msg.args = makeEntity( msg.args );
                break;
            case "stored" === msg.on:
                msg.args = makeEntity( msg.args );
                entity.cache.near.store( msg.args );
                break;
            case "lost" === msg.on:
                msg.args = makeEntity( msg.args );
                entity.cache.near.lose( msg.args );
                break;
            case "attached" === msg.on:
                msg.args = makeEntity( msg.args );
                entity.cache.near.attached( msg.args );
                break;
            case "detached" === msg.on:
                msg.args = makeEntity( msg.args );
                entity.cache.near.detached( msg.args );
                break;
            case "newListener" === msg.on:
                //msg.args = makeEntity( msg.args );
                break;
            }
            return emitEvent( msg.on, msg.args.Λ );
        
        }catch(err) {
            console.log( err );
            return;
        }
    }
    else 
        _debug_commands && console.log( "will it find", msg,"in", pendingOps );

    var responseId = msg.id && pendingOps.findIndex( op=>op.id === msg.id );
    if( responseId >= 0 ) {
        var response = pendingOps[responseId];
        //console.log( "Will splice...", responseId, msg, pendingOps)
        pendingOps.splice( responseId, 1 );
        if( msg.op === 'f' || msg.op === 'g' || msg.op === 'e' || msg.op === 'h' )  {
            //_debug_commands && 
            _debug_commands && reply( util.format("Resolve.", msg, response ) );
            response.resolve( msg.ret );
        } else if( msg.op === 'error' ){
            _debug_commands && reply( util.format("Reject.", msg, response ) );
            response.reject( msg.error );
        }    
    } else {
        if( msg.op !== "run")
            console.log( "didn't find matched response?", msg.op, msg )
    }

}

/*
process.stdin.on('data',(chunk)=>{
    const string = chunk.toString()
    //console.warn( "Sandbox stdin input: ", chunk, string );
    try {
        const msg = JSOX.parse( string );
        _debug_command_input && console.log( "Input Message:", msg );
        processMessage( msg, true );

    } catch( msgParseError ) {
        process.stdout.write( util.format( "Initiial error:", msgParseError ) );
        try {
            var r = vm.runInContext( string, sandbox, {timeout:500, displayErrors:true} );
            console.log( "Result?" );
            if(r ) {
                process.stdout.write( JSOX.stringify( {op:"run",ret:r} ) );
            }
        }catch( sbError ){
            console.log( "VM ERror2:", sbError.toString() );
            process.stdout.write( JSOX.stringify( {op:"error", error:sbError.toString() } ) );
        }
    }
})
*/

function Function() {
    console.log( "Please use other code import methods.");
}
function eval() {
    console.log( "Please use other code import methods.");
}

function makeEntity( Λ){
    if( Λ instanceof Promise ) return Λ.then( Λ=>makeEntity(Λ));
    console.trace( "make entity for:", Λ);
    {
        let tmp = objects.get(Λ);
        if( tmp ) return tmp;
    }
    var nameCache;
    var descCache;
    var nearCache;
    const e = {
        Λ :  Λ
        , post(name,...args) {
            var stack;
            _debug_command_post && console.log( "entity posting:", id, name );
            coreThreadEventer.postMessage( {op:'e',o:Λ,id:id++,e:name,args:args} );
            //process.stdout.write( {op:'e',o:'${Λ}',id:id++,e:name,args:args} );
            return new Promise( (resolve,reject)=>{ _debug_commands && console.log( "pushed pending for that command", id,name );pendingOps.push( { id:id-1, cmd: name, resolve:resolve,reject:reject} )} );
        }
        , postGetter(name) {
            //_debug_command_post && 
            console.trace( "entity get posting:", id, name, Λ );
            coreThreadEventer.postMessage( {op:'h',o:Λ,id:id++,h:name} );
            //process.stdout.write( `{op:'h',o:'${Λ}',id:${id++},h:'${name}'}` );
            return new Promise( (resolve,reject)=>pendingOps.push( { id:id-1,cmd:name, resolve:resolve,reject:reject} ) )
        },
        grab(target) {
            return e.post("grab",target.Λ );
        },
        cache : {
            get name() { return !!nameCache },
            get name() { return !!nameCache },
            near : {  },
        },
        attach(toThing){
            if( "string" !== typeof toThing ) toThing = toThing.Λ;
            return e.post("attach", toThing );
        },
        detach(fromThing){
            if( "string" !== typeof toThing ) toThing = toThing.Λ;
            return e.post("dettach", fromThing );
        },
        get name() {
            if( nameCache ) return Promise.resolve(nameCache);
            return e.postGetter( "name" ).then( name=>nameCache=name );
        },
        get description() {
            if( descCache ) return Promise.resolve(descCache);
            return e.postGetter( "description" ).then(desc=>descCache=desc);
        },
        get contents() { 
            if( nearCache ){
                return Promise.resolve(nearCache.contains);
            }
            return new Promise( res=>{
                this.nearObjects.then(nearCache=>{
                    res( nearCache.contains );
                })
            })
        },
        get container() { return e.postGetter("container").then( (c)=>{
            c.at = makeEntity( c.at );
            c.parent = makeEntity( c.parent );
            for( let path=c.from; path; path=path.from ){
                path.at = makeEntity( path.at );
                path.parent = makeEntity( path.parent );    
            }
            return c;
        }) },
        get within() { return e.postGetter("room") },

        get nearObjects() {
            //try { throw new Error( "GetStack" )}catch(err){
            //    sandbox.console.log( nameCache, "Getting near objects on  an entity", !!nearCache, "\n", err.stack )
           // }
            if( nearCache ) return Promise.resolve( nearCache );
            return this.postGetter("nearObjects").then( result =>{
                nearCache = result;
                //console.log( nameCache, "Got back near objects?", result," and they got cache updated" );

                result.forEach( (type,key)=>{
                    type.forEach( (name,i)=>{
                        //sandbox.console.log( "Re-set entity at:", name, i, type )
                        type.set(i, makeEntity( name ) )
                    } );
                });
                return result;
            })
        },
        async idGen() {
            return e.post("idGen");
        },
        async run(file, code) {
            return e.post( "run", file,code )
        },
        async wake() {
            return e.post( "wake" );
        },
        async require( src ) {
            console.log( " ---- thread side require:", nameCache, src, codeStack );
            
            return e.post( "require", src ).catch(err=>sandbox.io.output(util.format(err)));
        },
        idMan : {
            //sandbox.require( "id_manager_sandbox.js" )
            async ID(a) {
                return e.post( "idMan.ID", a );
            }
        }
    };
    e.cache.near.invalidate=( e )=>( nearCache = null);

    // my room changes...  this shodl clear cache
    e.cache.near.displaced=(( e )=> ( nearCache = null));
    e.cache.near.placed=( (e )=> ( nearCache = null));

    e.cache.near.store=(( e )=> ( !!nearCache )  && nearCache.get("contains").set( e.Λ, e ));
    e.cache.near.lose=(( e )=>{ console.warn("near.lose:", nearCache); /*return;*/( !!nearCache )  && nearCache.get("contains").delete( e.Λ )});

    e.cache.near.joined=(( e )=> ( !!nearCache )  && nearCache.get("near").set( e.Λ, e ));
    e.cache.near.part=( (e )=> ( !!nearCache )  && nearCache.get("near").delete( e.Λ ));
    e.cache.near.attached=(( e )=> ( !!nearCache )  && nearCache.get("holding").set( e.Λ, e ));
    e.cache.near.detached=(( e )=> ( !!nearCache )  && nearCache.get("holding").delete( e.Λ ));
        
    
    objects.set( Λ, e );
    return e;
}

var required = [];
var name = 'Not Initialized';
var description = 'Not Initialized';

var sandbox = vm.createContext( {
    Λ : Λ
    , entity: entity
    , util:util
    , wsThread : sack.WebSocket.Thread
    , waiting : []
    , module : {paths:[codeStack.length?codeStack[codeStack.length-1].file.path:module.path]}
    , Function : Function
    , eval: eval
    , post(name,...args) {
        var stack;
        _debug_command_post && console.log( "thread posting:", id, name );
        coreThreadEventer.postMessage( {op:'f',id:id++,f:name,args:args} );
        //process.stdout.write( `{op:'f',id:${id++},f:'${name}',args:${JSOX.stringify(args)}}` );
        return new Promise( (resolve,reject)=>{
            pendingOps.push( { id:id-1, cmd:name, resolve:resolve,reject:reject} );
        });
        return p;
        /*block*/
    }
    , run( line ){
        try {
        var r = vm.runInContext( line, sandbox );
        if( r ) sandbox.io.output( r.toString() );
        }catch(err) {
            console.log( err );
        }
    }
    , async postGetter(name,...args) {
        _debug_command_post && process.stdout.write( util.format( "Self PostGetter", name ) );
        coreThreadEventer.postMessage( {op:'g',id:id++,g:name} );
        //process.stdout.write( `{op:'g',id:${id++},g:'${name}'}` );
        
            var p = new Promise( (resolv,reject)=>{
            pendingOps.push( { id:id-1, cmd:name, resolve:resolv,reject:reject} );
        })   
        return p;
        /*block*/
    }
    , async require(args) { 
        _debug_requires && console.log( "This is a thread that is doing a require in itself main loop", args);
        if( args === "sack.vfs" ) return sack;
        if( args === "vm" ) return vm;
        if( args === "util" ) return util;
        if( args === "path" ) return path;
        if( args === "stream" ) return stream;
        var builtin = builtinModules.find( m=>args===m);
        if( builtin ){
            if( ['vm','child_process','worker_threads'].find(m=>m===args) ){
                throw new Error( "Module not found:",+ a )
            }
            console.log( "Including native node builtin module:", args );
            return builtinModules.require( args );
        }
        args = sandbox.require.resolve( args );
        if( args.includes( "undefined"))
            console.log( "Failed!", args );
        var prior_execution = codeStack.find( c=>c.file.src === args );
        if( prior_execution ){
            console.log( "Require resoving prior object:", args)
            return prior_execution.result;
        }
        {
            var prior = ( required.find( r=>r.src===args));
            if( prior ) {
                _debug_requires && console.log( "Global Old Require:", args );
                return prior.object;
            }
        }
        //_debug_requires && 
        console.log( "Global New Require:", args );
        pendingRequire = true;
        return  sandbox.post("require",args).then(ex=>{
            _debug_requires && console.log( "Read and run finally resulted, awated on post require" );
            var ex2 = requireRunReply.pop()
            //console.log( "Require finally resulted?",args, ex, ex2 ); 
            required.push( {src:args, object:ex2 });
            return ex2;    
        }).catch( err=>sandbox.io.output("Require failed:", err));
    }
    , process: process
    , Buffer: Buffer
    , async create(a,b,c,d) { 
        return sandbox.post("create",a, b).then(
            (val)=>{ 
                val = makeEntity( val );
                if( "string" === typeof c )  {
                    val.post( "wake" ).then( ()=>{
                        //process.stdout.write( "Got Create result...");
                        //process.stdout.write(util.format("short create:", val) ); 
                        val.post( "postRequire", c ).then( (result)=>{
                            //console.log( "Resolve promise here..");
                            Promise.resolve( val );
                            //if(d)
                             //   d(val );
                        } )
                    });
                }
                else {
                    return Promise.resolve( val );
                }
            }
            );  
    }
    //, look(...args) { process.stdout.write( `{op:'create',args:${JSOX.stringify(args)}}` ) }
    , leave(...args) { return sandbox.post("leave",null,...args);  }
    , enter(...args) { return sandbox.post("enter",null,...args);  }
    , grab(thing){ console.log( "This grabbing something..." ); return sandbox.post("grab",thing.Λ);  }
    , drop(...args) { return sandbox.post("drop",null,...args); }
    , store(...args) { return sandbox.post("store",null,...args); }
    //, crypto: crypto
    //, config(...args) { returnpost("config",...args); })(); }  // sram type config; reloaded at startup; saved on demand
    , global: null
    , scripts : { code: [], index : 0, push(c){ this.index++; this.code.push(c)} }
    , _timers : null
    , _module: {
        filename: "internal"
        , file: "memory://"
        , parent: null
        , paths: [module.path + "/.."]
        , exports: {}
        , loaded: false
        , rawData: ''
        , includes: []
    }
    , get now() { return new Date().toString() }
    , get name() { 
        //console.log( "is entity null", entity );
        return entity.name.then( name=>nameCache = name) }
    , get desc()  { return entity.description }
    , get description()  { return entity.description }
    , get holds()  { return sandbox.postGetter("holding") }
    , get container() { return sandbox.postGetter("container") }
    , get near()  { { return (async () => { 
        var nearList = await sandbox.postGetter("near")
        nearList.forEach( (near,i)=>{
            nearList[i] = makeEntity( near );
        } )
        return nearList;
      })()}}
    , get exits()  { { return (async () => { 
        var nearList = await sandbox.postGetter("exits")
        nearList.forEach( (near,i)=>{
            nearList[i] = makeEntity( near );
        } )
        return nearList;
      })()}}
    , get contains()  { { return (async () => { return await sandbox.postGetter("contains")})()}}
    //, get room() { return o.within; }
    , idGen(cb) {
        console.log( "This ISGEN THEN?")
        return idMan.ID(Λ, Λ.maker, cb);
    }
    , console: {
        log(...args)  { 
            if( sandbox.io.output )
                sandbox.io.output( util.format(...args) + "\n" );
            else 
                process.stdout.write(util.format( "AAAA", ...args ) +"\n" ) 
        },
        warn(...args) { return console.log( ...args)},
        trace: (...args) => console.trace(...args)
    }
    , io: {
        output : null,
        addInterface(name, iName, iface) {
            addDriver( sandbox, name, iName, iface );
        },
        getInterface(object,name) {
            var o = object;
            console.log( "OPEN DRIVER CALLED!")
            var driver = drivers.find(d => (o === d.object) && (d.name === name) );
            if (driver)
                return driver.iface;

            var iface;
            // pre-allocate driver and interface; it's not usable yet, but will be?
            drivers.push({ name: name, iName: null, orig: null, iface: iface={} });
            return iface;
        }
        , send(target, msg) {
            console.log( "Send does not really function yet.....")
            //o.Λ
            //console.log( "entity in this context:", target, msg );
            var o = target;
            if (o)
                sandbox.emit("message", msg)
            //entity.gun.get(target.Λ || target).put({ from: o.Λ, msg: msg });
        }
    }
    , events: {}
    ,  // events_ is the internal mapping of expected parameters from the core into the thread.
    events_: {

    }
    , on(event, callback) {
        sandbox.emit("newListener", event, callback)
        if (!(event in sandbox.events))
            sandbox.events[event] = [callback];
        else
            sandbox.events[event].push(callback);
    }
    , off(event, callback) {
        if (event in sandbox.events) {
            var i = sandbox.events[event].findIndex((cb) => cb === callback);
            if (i >= 0)
                sandbox.events[event].splice(i, 1);
            else
                throw new Error("Event already removed? or not added?", event, callback);
        }
        else
            throw new Error("Event does not exist", event, callback);
        sandbox.emit("removeListener", event, callback)
    }
    , addListener: null
    , emit_( event, args ){
        if( args instanceof Array )
            args.forEach((arg,i)=>args[i] = makeEntity(arg) );
        else
            args = makeEntity(args);
        return this.emit( event, args );
    }
    , emit(event, ...args) {
        _debug_events && console.log( "Emitting event(or would):", event, ...args)
        if (event in sandbox.events) {
            sandbox.events[event].forEach((cb) =>cb(...args));
        }
    }
    , ing( event, ...args ){
        if( event in sandbox.events) {

        }
    }
    , setTimeout(cb,delay) {
        let timerObj = { id: timerId++, cb: cb, next:this._timers, pred:null, dispatched : false, to:null };
        if( this._timers )
            this._timers.pred = timerObj;
        this._timers = timerObj;
        const cmd = `let tmp=_timers;
            while( tmp && tmp.id !== ${timerObj.id})
                tmp = tmp.next;
            if( tmp ) {
                tmp.cb();
                tmp.dispatched = true;
                if( tmp.next ) tmp.next.pred = tmp.pred;
                if( tmp.pred ) tmp.pred.next = tmp.next; else _timers = tmp.next;
            }
        `;
        timerObj.to = setTimeout( ()=>{
            vm.runInContext( cmd, sandbox);
        }, delay );
        //timerObj.to.unref();
        return timerObj;
    }
    , setInterval(cb,delay) {
        let timerObj = { id: timerId++, cb: cb, next:this._timers, pred:null, dispatched : false, to:null };
        if( this._timers )
            this._timers.pred = timerObj;
        this._timers = timerObj;
        const cmd = `let tmp=_timers;
            while( tmp && tmp.id !== ${timerObj.id})
                tmp = tmp.next;
            if( tmp ) {
                tmp.cb();
            }
        `;
        timerObj.to = setInterval( ()=>{
            vm.runInContext( cmd, sandbox);

        }, delay );
        return timerObj;
    }
    , setImmediate(cb) {
        let timerObj = { id: timerId++, cb: cb, next:this._timers, pred:null, dispatched : false, to:null };
        if( this._timers )
            this._timers.pred = timerObj;
        this._timers = timerObj;
        const cmd = `let tmp=_timers;
            while( tmp && tmp.id !== ${timerObj.id})
                tmp = tmp.next;
            if( tmp ) {
                tmp.cb();
                tmp.dispatched = true;
                if( tmp.next ) tmp.next.pred = tmp.pred;
                if( tmp.pred ) tmp.pred.next = tmp.next; else _timers = tmp.next;
            }
        `;
        timerObj.to = setImmediate( ()=>{
            vm.runInContext( cmd, sandbox);

        } );
        return timerObj;
    }
    , async getObjects(me, src, all, callback) {
		// src is a text object
		// this searches for objects around 'me' 
		// given the search criteria.  'all' 
		// includes everything regardless of text.
		// callback is invoked with value,key for each
		// near object.
		var object = src && src[0];
		if( !src ) all = true;
        var name = object && object.text;
		var count = 0;
		//var all = false;
		var run = true;
		var tmp;
		var in_state = false;
		var on_state = false;

		//console.trace( "args", me, "src",src, "all",all, "callback:",callback )
		if (typeof all === 'function') {
			callback = all;
			all = false;
		}

		if (object && name == 'all' && object.next && object.next.text == '.') {
			all = true;
			object = object.next.next;
		}
		if (object && (tmp = Number(name)) && object.next && object.next.text == '.') {
			object = object.next.next;
            name = object.text;
			count = tmp;
		}


		if( src&& src.length > 1  && src[1].text === "in" ) {
			console.warn( "checking 'in'");
			in_state = true;
			src = src.slice(2);
			return getObjects( me, src, all, (o,location,moreargs)=>{
				o = objects.get( o.me );
				console.log( "in Found:", o.name, name );
				o.contents.forEach( async content=>{
                    //if (value === me) return;
                    var cn;
					if (!object || (cn=await content.name) === name ) {
						console.log( "found object", cn )
						if (count) {
							count--;
							return;
						}
						if (run) {
							console.log("and so key is ", location, cn )
							callback(content, location+",contains", src.splice(1) );
							run = all;
						}
					}
				})
			})
		}
		if( src&&src.length > 1  && (src[1].text == "on" || src[1].text == "from" || src[1].text == "of" ) ) {
			on_state = true;
			console.log( "recursing to get on's...")
			src = src.slice(2);
			return getObjects( me, object, all, (o,location,moreargs)=>{
				o = objects.get( o.me );
				console.log( "Found:", o.name, location );
				o.attached_to.forEach( content=>{
					//if (value === me) return;
					if (!object || content.name === name ) {
						console.log( "found object", content.name )
						if (count) {
							count--;
							return;
						}
						if (run) {
							console.log("and so key is ", key, content.name )
							callback(content.sandbox, location+",holding", src.splice(1) );
							run = all;
						}
					}
				})
			})
		}

		//var command = src.break();
		//console.log( "get objects for ", me.name, me.nearObjects )
			var checkList;
            checkList = await me.nearObjects;
            //console.log( "gotting near on :", checkList );
            //checkList = await me.near;

			checkList.forEach(function (value, location) {
				// holding, contains, near
				//console.log("checking key:", run, location, value)
				if( !value ) return;
				if (run) value.forEach(async function (value, member) {

					//console.log( "value in value:", value.name, name );
					if (value === me) return;
					if (!object || (await value.name) === name ) {
						//console.log( "found object", value.name )
						if (count) {
							count--;
							return;
						}
						if (run) {
							//console.log("and so key is ", key, value.name )
							callback(value, location, src &&src.splice(1) );
							run = all;
						}
					}
				});
			})
            callback( null, null, [] );
        }

    , clearTimeout( timerObj ) {
        if( !timerObj.dispatched ) return; // don't remove a timer that's already been dispatched
        if( timerObj.next ) timerObj.next.pred = timerObj.pred;
        if( timerObj.pred ) timerObj.pred.next = timerObj.next; else _timers = timerObj.next;
    }
    , clearImmediate : null
    , clearInterval : null
    , resume( ) {
    }
    , JSOX: JSOX
});



sandbox.clearImmediate = sandbox.clearTimeout;
sandbox.clearInterval = sandbox.clearInterval;

var u8xor = require( "./util/u8xor.js")

sandbox.permissions = {};
sandbox.idGen.u8xor = u8xor;
sandbox.idGen.xor = null;//entity.idMan.xor;
sandbox.config = {};
sandbox.config.run = { Λ : null };

//entity.idMan.ID( entity.idMan.localAuthKey, o.created_by.Λ, (id)=>{ sandbox.config.run.Λ = id.Λ } );
//sandbox.require=  sandboxRequire.bind(sandbox);
sandbox.require.resolve = function(path) {
    //_debug_requires && 
    console.log( "SANDBOX:", sandbox.module.paths, codeStack )
    var tmp = sandbox.module.paths[sandbox.module.paths.length-1] + "/" + path;
    tmp = tmp.replace( /^\.[/\\]/ , '' );
    tmp = tmp.replace( /[/\\]\.[/\\]/ , '/' );
    var newTmp;
	while( ( newTmp = tmp.replace( /[/\\][^/\\]*[/\\]\.\.[/\\]/, '/' ) ) !== tmp ) {
		tmp = newTmp;
	}
    tmp = tmp.replace( /[^/\\]*[/\\]\.\.$/ , '' );
    console.log( "Resolved path:", tmp );
    return tmp;
    //return (async () => { return await e.post("resolve",...args); })(); 
};// sandboxRequireResolve.bind( sandbox );
sandbox.global = sandbox;
sandbox.addListener = sandbox.on;
sandbox.removeListener = sandbox.off;
sandbox.removeAllListeners = (name) => {
    Object.keys(sandbox.events).forEach(event => delete sandbox.events[event]);
};

/* Seal Sandbox */
        ["JSOX","events", "crypto", "_module", "console", "Buffer", "require", "process", "fs", "vm"].forEach(key => {
            if( key in sandbox )
                Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
        });
    


function addDriver( o, name, iName, iface) {
	var driver = drivers.find(d => d.name === name);
	if( driver ) {
		console.log( "have to emit completed...")
	}
	var caller = (driver && driver.iface) || {};
	var keys = Object.keys(iface);
	if( remotes.get(o) ) {
		keys.forEach(key => {
			caller[key] = function (...argsIn) {
				var args = "";
				var last = argsIn[argsIn.length-1];
				argsIn.forEach(arg => {
					if( arg === last ) return; // don't pass the last arg, that's for me.
					if (args.length) args += ",";
					args += JSOX.stringify(arg)
				})
				entity.idMan.ID( o.Λ, me, (id)=>{
					var pending = { id: id, op:"driver", driver:name, data: { type:"driverMethod", method:key, args:args } }
					o.child.send( pending );
					childPendingMessages.set( id, pending )
				} )
			}
		})
	}
	else
		keys.forEach(key => {
			var constPart = `{
				${iName}[${key}](`;
			caller[key] = function (...argsIn) {
				var args = "";
				var last = argsIn[argsIn.length-1];
				argsIn.forEach(arg => {
					if( arg == last ) return; // don't pass the last arg, that's for me.
					if (args.length) args += ",";
					args += JSOX.stringify(arg)
				})
				if( "function" == typeof last ) {
					o.sandbox._driverDb = last;
					args += ",_driverCb)";
				}
				else
					args += JSOX.stringify( last ) + ")";
				// this should not be replayed ever; it's a very dynamic process...
				//scripts.push( { type:"driverMethod", code:constPart + args } );
				vm.runInContext(constPart + args, sandbox)
			}
		})
	console.log( "adding object driver", name)
	drivers.push({ name: name, iName: iName, orig: iface, iface: caller, object:o });
	return driver; // return old driver, not the new one...
}




const volOverride = `(function(vfs, dataRoot) {
	vfs.mkdir = vfs.Volume.mkdir;
	vfs.Volume = (function (orig) {
		// entities that want to use the VFS will have to be relocated to their local path
		return function (name, path, v, a, b) {
			//console.log("what's config?", config);
			if( name === undefined ) 
				return orig();
			var privatePath = dataRoot + "/" + config.run.Λ + "/" + path;
			//console.log("Volume overrride called with : ", name, dataRoot + "/" + config.run.Λ + "/" + path, orig);
			//console.log("Volume overrride called with : ", a, b );
			try {
				return orig(name, privatePath, v, a, b);
			} catch(err) {
				console.log( "limp along?" );
			}
		}
	})(vfs.Volume);
	var tmp = vfs.Sqlite.op;

	vfs.Sqlite = (function(orig) {
		return function (path) {
			//console.log("what's config?", config);
			if( path[0] === "$" ) return orig( path );
			if( path.includes( "." ) ) {
				var privatePath = dataRoot + "/" + config.run.Λ + "/" + path;
				if( dataRoot !== "." ) {
					var zz1 = privatePath.lastIndexOf( "/" );
					var zz2 = privatePath.lastIndexOf( "\\\\" );
					var pathPart = null;
					if( zz1 > zz2 )
						pathPart = privatePath.substr( 0, zz1 )
					else
						pathPart = privatePath.substr( 0, zz2 )
					console.log( "Make directory for sqlite?", pathPart, privatePath )
					vfs.mkdir( pathPart );
				}
				console.log("Sqlite overrride called with : ", dataRoot + "/" + config.run.Λ + "/" + path);
				try {
					return orig( privatePath );
				} catch(err) {
					console.log( "limp along?", err );
				}
			}
			else return orig( path );
		}
	})(vfs.Sqlite);
	vfs.Sqlite.op = tmp;
})`

//process.on("uncaughtException",(e)=>{
//    process.stdout.write( e.toString() );
//})
coreThreadEventer.postMessage({op:'initDone'});
coreThreadEventer.on("message", processMessage );
