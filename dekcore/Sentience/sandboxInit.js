Error.stackTraceLimit = 10;
const util = require('util'); 
const stream = require('stream');
const vm = require('vm' );
const sack = require('sack.vfs');
const path = require('path');
const disk = sack.Volume();
const JSOX = sack.JSOX;


const netRequire = require( "./util/myRequire");


const Shell = require( "./Sentience/shell.js" );

//console.log( "This is logged in the raw startup of the sandbox:", Shell );
const _debugPaths = false;

const resolvers = {};
const rejectors = {};
const pendingOps = [];

const drivers = [];
var remotes = new WeakMap();

process.stdin.on('data',(chunk)=>{
    const string = chunk.toString()
    //console.log( "Sandbox stdin input: ", chunk, string );
    try {
        const msg = JSOX.parse( string );

        if( msg.op == "run"){
            var res =  vm.runInContext(msg.code, sandbox /*, { filename:"", lineOffset:"", columnOffset:"", displayErrors:true, timeout:10} */);
            //console.log( "Did it?", sandbox );
            process.stdout.write( JSOX.stringify( {op:"run",ret:res,id:msg.id }));
            return;
        }     else if( msg.op === 'emit' ){

        }
        console.log( "will it find", msg,"in", pendingOps );

        var responseId = msg.id && pendingOps.findIndex( op=>op.id === msg.id );
        if( responseId >= 0 ) {
            var response = pendingOps[responseId];
            //console.log( "Will splice...", responseId, msg)
            pendingOps.splice( responseId, 1 );
            if( msg.op === 'f' || msg.op === 'g' || msg.op === 'e' || msg.op === 'h' )  {
                process.stdout.write( util.format("Resolve.", msg, response ) );
                if( response.cb )
                    response.cb( msg.ret );
                response.resolve( msg.ret );
            } else if( msg.op === 'error' ){
                response.reject( msg.error );
            }    
        } else {
            console.log( "didn't find matched response?")
        }

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

function Function() {
    console.log( "Please use other code import methods.");
}
function eval() {
    console.log( "Please use other code import methods.");
}

var id = 0;
var eid = 0;

function makeEntity( Λ){
    const e = {
        Λ :  Λ
        , post(name,cb,...args) {
            var stack;
            process.stdout.write( `{op:'e',id:${id++},o:'${Λ}',e:'${name}',args:${JSOX.stringify(args)}}` );
            return new Promise( (resolv,reject)=>{
                pendingOps.push( { id:id-1, cb:cb, resolve:resolv,reject:reject} );
            });
            return p;
            /*block*/
        }
        , async postGetter(name,...args) {
            process.stdout.write( `{op:'h',o:'${Λ}',id:${id++},h:'${name}'}` );
            
                var p = new Promise( (resolv,reject)=>{
                pendingOps.push( { id:id-1, cb: null, resolve:resolv,reject:reject} );
            })   
            return p;
            /*block*/
        },
        get name() {
            return  e.postGetter( "name", Λ );
        },
        get description() {
            return  e.postGetter( "description", Λ );
        },
        run(code) {
            return e.post( "run", null, code )
        }
    };
    return e;
}

var sandbox = vm.createContext( {
    waiting : []
    , post(name,cb,...args) {
        var stack;
        process.stdout.write( `{op:'f',id:${id++},f:'${name}',args:${JSOX.stringify(args)}}` );
        return new Promise( (resolv,reject)=>{
            pendingOps.push( { id:id-1, cb:cb, resolve:resolv,reject:reject} );
            //process.stdout.write( util.format(err) );
        });
        process.stdout.write( util.format( "Something sent... returning promise...",  name ) );
        return p;
        /*block*/
    }
    , async postGetter(name,...args) {
        process.stdout.write( util.format( "PostGetter", name ) );
        process.stdout.write( `{op:'g',id:${id++},g:'${name}'}` );
        
            var p = new Promise( (resolv,reject)=>{
            pendingOps.push( { id:id-1, cb: null, resolve:resolv,reject:reject} );
        })   
        return p;
        /*block*/
    }
    , require(...args) { return (async () => { return await post("require",...args); })(); }
    , process: process
    , Buffer: Buffer
    , create(a,b,c,d) { 
        //try { throw new Error( "Stack" )} catch(err) {
        process.stdout.write( util.format("CREATE ENTITY", a, b, c, d ));
        //}
        {
            process.stdout.write( "Short Create" );
            return sandbox.post("create",(val)=>{ 
                val = makeEntity( val );
                if( "string" === typeof c )  {
                    val.post( "wake", ()=>{
                        process.stdout.write( "Got Create result...");
                        process.stdout.write(util.format("short create:", val) ); 
                        val.post( "postRequire", (result)=>{
                            if(d)
                                d(val );
                        }, c )
                    });
                }
                else
                    c(val);
            },a,b);  
        }
    }
    //, look(...args) { process.stdout.write( `{op:'create',args:${JSOX.stringify(args)}}` ) }
    , leave(...args) { return sandbox.post("leave",null,...args);  }
    , enter(...args) { return sandbox.post("enter",null,...args);  }
    , grab(...args){ return sandbox.post("grab",null,...args);  }
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
    , get me() { return Λ; }
    , get name() { { return (async () => { return await sandbox.postGetter("name")})() }}
    , get desc()  { { return (async () => { return await sandbox.postGetter("description")})()}}
    , get description()  { { return (async () => { return await sandbox.postGetter("description")})()}}
    , get holds()  { { return (async () => { return await sandbox.postGetter("holding")})()}}
    , get near()  { { return (async () => { return await sandbox.postGetter("near")})()}}
    , get contains()  { { return (async () => { return await sandbox.postGetter("contains")})()}}
    //, get room() { return o.within; }
    , idGen(cb) {
        return entity.idMan.ID(o.Λ, o.created_by.Λ, cb);
    }
    , console: {
        log(...args)  { 
             process.stdout.write(util.format( ...args ) ) 
         },
        warn(...args) { return console.log( ...args)},
        trace: (...args) => console.trace(...args)
    }
    , io: {
        addInterface(name, iName, iface) {
            addDriver( sandbox, name, iName, iface );
        },
        getInterface(object,name) {
            var o = objects.get( object );
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
            var o = objects.get(target.Λ || target);
            if (o)
                sandbox.emit("message", msg)
            //entity.gun.get(target.Λ || target).put({ from: o.Λ, msg: msg });
        }
    }
    , events: {}
    , on: (event, callback) => {
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
    , emit(event, ...args) {
        if (event in sandbox.events) {
            sandbox.events[event].find((cb) => cb(...args));
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
    return (async () => { return await post("resolve",...args); })(); 
    
};// sandboxRequireResolve.bind( sandbox );
sandbox.global = sandbox;
sandbox.addListener = sandbox.on;
sandbox.removeListener = sandbox.off;
sandbox.removeAllListeners = (name) => {
    Object.keys(sandbox.events).forEach(event => delete sandbox.events[event]);
};

        ["JSOX","events", "crypto", "_module", "console", "Buffer", "require", "process", "fs", "vm"].forEach(key => {
            if( key in sandbox )
                Object.defineProperty(sandbox, key, { enumerable: false, writable: true, configurable: false });
        });
    

       
        /*
        ((Function,eval,require)=>{

            this.require = require;
            this.eval = eval;
            this.Function = Function;
            Object.defineProperty( this, 'Function', {enumerable:false,configurable:false,value:Function} );
            Object.defineProperty( this, 'eval', {enumerable:false,configurable:false,value:eval} );
            Object.defineProperty( this, 'require', {enumerable:false,configurable:false,value:require} );
            
})(Function,eval,sandboxRequire);
*/

function sandboxRequire(src) {
    const o = sandbox;

    //console.trace( "this is", this, src );
    //var o = makeEntity( this.me );
    //console.trace("sandboxRequire ",  src );
    //console.log( "module", sandbox.module );
    if (src === "entity.js") { console.log( "No such thing - entity.js" ); return ThreadEntity; }
    if (src === "shell.js") return Shell;//exports.Sentience;
    if (src === "text.js") return text;

    if (src == 'ws') {
        return sandboxWS;
    }
    if (src == 'wss') {
        return sandboxWSS;
    }
    if (o.permissions.allow_file_system && src == 'fs') return fs;
    if( src == "stream") return stream;
    if (o.permissions.allow_file_system && src == 'stream') return stream;
    if (src == 'crypto') return crypto;
    if (src == 'util') return util;
    if (src == 'vm') return vm;
    if (src == 'os') return os;
    if (src == 'url') return url;
    if (src == 'tls') return tls;
    if (src == 'https') return https;
    if (src == 'path') return path;
    if( src == 'child_process' ) return cp;
    if( src == 'process' ) return process;
            if( src.substr( src.length-8 ) == "sack-gui" ) return sack;
    //if (src == 'path') return path;

    if (src == 'events') return events;

    if (src == 'sack.vfs') {
        if( !("_vfs" in sandbox ) ) {
            //console.log( "Overriding internal VFS", o.name )
            sandbox._vfs = Object.assign( {}, sack );
            sandbox._vfs.Volume = sandbox._vfs.Volume.bind( {} );
            sandbox._vfs.Sqlite = sandbox._vfs.Sqlite.bind( {} );
            try {
                vm.runInContext( "(" + volOverride + ')(this._vfs,"' +  "." +'")' , sandbox
                    , { filename: "moduleSetup" , lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 1000 })
            } catch( err) {
                console.log( "VM Error:", err );
            }
        }
        return sandbox._vfs;
    }

    //console.log( "blah", sandbox.scripts)
    if( sandbox.scripts.index < sandbox.scripts.code.length ) {
        var cache = sandbox.scripts.code[sandbox.scripts.index];
        //console.log( "cache is?", typeof cache, cache);
        if( cache.source === src ) {
            sandbox.scripts.index++;

            var oldModule = sandbox._module;
            var root = cache.closure.root;
            if( !cache.closure.paths ){
                console.log( "About to log error?" );
                console.log( "Undefined paths:", cache.closure.paths, __dirname , ".");
                cache.closure.paths = [process.cwd()];
            }
            var thisModule = {
                filename: cache.closure.filename
                , src : cache.closure.src
                , source : cache.closure.source
                , file: ""
                , parent: sandbox._module
                , paths: cache.closure.paths
                , exports: {}
                , includes : []
                , loaded: false
            }
            //console.log( "NEW MODULE HERE CHECK PATHS:", cache.closure.paths, cache.closure.filename )

            oldModule.includes.push( thisModule );
            //        { name : src.substr( pathSplit+1 ), parent : sandbox.module, paths:[], root : rootPath, exports:{} };
            //oldModule.children.push( thisModule );
            sandbox._module = thisModule;

            var root = cache.closure.filename;
            try {
                //console.log( "closure recover:", root, cache.closure )
                var file = disk.read(root).toString();
            } catch (err) {
                console.log("File failed... is it a HTTP request?", src, root, err);
                return undefined;
            }
            if( file !== cache.closure.source ) {
                console.log( "updating cached file....", src )
                cache.closure.source = file;
                exports.saveAll();
            }
            var code = ['(function(exports,config,module,resume){'
                , cache.closure.source
                , '})(_module.exports,this.config, _module, true );\n//# sourceURL='
                , root
            ].join("");

            //console.log( "Executing with resume TRUE")
            try {
                vm.runInContext( code, sandbox
                    , { filename: cache.source , lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 1000 })
            } catch( err ) {
                console.log( "VM Error:", err );
            }
            sandbox._module = oldModule;
            //console.log( "active base module is ... ")
            return thisModule.exports;
        }
    }

    var rootPath = "";

    // resolves path according to relative path of parent modules and resolves ".." and "." parts
    var root = netRequire.resolvePath(src, sandbox._module);
    _debugPaths && console.log("src could be", src);
    _debugPaths && console.log("root could be", root);
    _debugPaths && console.log("working root is ", rootPath);
    try {
        var file = disk.read(root);
    } catch (err) {
        console.log("File failed... is it a HTTP request?", err);
        return undefined;
    }
    //console.log( sandbox.module.name, "at", rootPath,"is loading", src );
    //var names = fs.readdirSync( "." );
    //console.log( names );
    var pathSplita = src.lastIndexOf("/");
    var pathSplitb = src.lastIndexOf("\\");
    if (pathSplita > pathSplitb)
        var pathSplit = pathSplita;
    else
        var pathSplit = pathSplitb;

    if (src.startsWith("./"))
        rootPath = rootPath + src.substr(2, pathSplit - 2);
    else if (src.startsWith("../"))
        rootPath = rootPath + src;//src.substr(2,pathSplit-2 );
    else
        rootPath = rootPath + src.substr(0, pathSplit);

    //console.log( "set root", rootPath );

    var code =
        ['(function(exports,config,module,resume){'
            , file
            , '})(_module.exports,this.config, _module, false );\n//# sourceURL='
            , root
        ].join("");

    var oldModule = sandbox._module;
    var thisModule = {
        filename: root
        , src : src
        , source : file
        , file: netRequire.stripPath(root)
        , parent: sandbox._module
        , paths: [netRequire.stripFile(root)]
        , exports: {}
        , includes : []
        , loaded: false

        , toJSON() {
            //console.log( "Saving this...", this );
            return JSOX.stringify( { filename:this.filename, file:this.file, paths:this.paths, src:this.src, source:this.source })
        }
        , toString() {
            return JSOX.stringify( {filename:this.filename
                , src:this.src })
        }
    }
    oldModule.includes.push( thisModule );
    //        { name : src.substr( pathSplit+1 ), parent : sandbox.module, paths:[], root : rootPath, exports:{} };
    //oldModule.children.push( thisModule );
    sandbox._module = thisModule;

    sandbox.scripts.push( { type:"require", source:src, closure: thisModule } );
    try {
        //console.log( "(in thread)run in context");
        vm.runInContext(code, sandbox
            , { filename: src, lineOffset: 0, columnOffset: 0, displayErrors: true, timeout: 5000 })
        //console.log( "Completed entity sandbox require without error?" );
    } catch( err) {
        console.log( "VM Error:", err );
    }
    //console.log( "result exports for ", src
    //               , thisModule.name
    // 		 , thisModule.exports
    //           );
    sandbox._module = oldModule;
    //console.log( "active base module is ... ")
    return thisModule.exports;
}

function sandboxRequireResolve(path){

var o = null;//makeEntity( this.me );
if( !o || !this ) {
    //console.log( "Not in a sandbox, relative to object, so ...", module.path  );
    var tmp = module.path + "/" + path;
    tmp = tmp.replace( /[/\\]\.[/\\]/g , '/' );
    tmp = tmp.replace( /[^/\\]*[/\\]\.\.[/\\]/g , '' );
    tmp = tmp.replace( /[^/\\]*[/\\]\.\.$/g , '' );
    //console.log( "final otuput:", tmp );
    return tmp;
}
console.log( "RESOLVE IS TRYING:", path , sandbox._module.paths, sandbox.name );

var usePath = sandbox._module.paths?sandbox._module.paths[0]+"/":"";
var tmp = usePath + path;
//console.log( "append:", tmp );
tmp = tmp.replace( /[/\\]\.[/\\]/ , '/' );
tmp = tmp.replace( /[^/\\]*[/\\]\.\.[/\\]/g , '' );
tmp = tmp.replace( /[^/\\]*[/\\]\.\.$/g , '' );
//console.log( "final otuput:", tmp );
return tmp;
}
sandboxRequire.resolve = sandboxRequireResolve;



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
