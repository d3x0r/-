"use strict";
const events =  require('events');
const ee =  events.EventEmitter;
var objects = [];


// Entity events
//  on( 'create', (self)=>{  } )
//  on( 'restore', (self)=>{ } )
//  on( "attachted", ( self,toOther)=>{ })
//  on( "dropped", ( self, old_container )=>{ } )
//  on( "detached", (self, fromOther){ } )
// on( "contained", ( self ){ } )
// on( "relocated", ( self, old_container )=>{ } )
// on( "rebase", ( self )=>{ } )

// onWake after Sentient

// Entity Methods
// Entity( maker ) // returns Entity
// e.create( Object )  // returns new e
//   with maker as object


// e.grab( something[ ,(something)=>{ /*something to run on success*/  }] )
//       if a thing is known, move it to internal storage
//           invoke onrelocated
//
// e.store( something )
// e.store( somthing [,inthing] )
// e.drop( thing )
//   thing has to have been contained in e
//   if thing is attachd to other things,
//        if that thing is the immediate content in e, all objects get moved.
//        if that thing is only attached to the single point, that thing itself wil be detatched
//             and that thing willl be dropped, receiving both detached and reloated events
// returns thing

// e.rebase(a)
//       if a is something that's attached, set that as the 'contained' objects
//          if it's not already the contained object... emit event rebase( a)
//    returns e
// e.debase()
//     if there is something attached to it, mkae that the contained objects
//         if( moved contained ) event rebase( a)
//          if( moved contained ) event newroot(a) to container
//    returns e


//
var idMan = require( '../id_manager.js');
var fc = require( '../file_cluster.js');
console.log( 'to require config?')
var config = require( '../config.js');
var vm = require( 'vm' );
const fs = require( 'fs' );
const vfs = require( 'sack.vfs' );
const stream = require( 'stream' );
const util = require( 'util' );
const process = require( 'process' );
const crypto = require( 'crypto' );
const netRequire = require( '../node/node/myRequire.js' );
var all_entities = new WeakMap();
var objects = new Map();

const _debugPaths = true;
var drivers = [];


var entity = module.exports = exports = {
        create : Entity,
        theVoid : null,
        getObjects : getObjects,
        getEntity : getEntity,
        netRequire : netRequire,
        addProtocol : null, // filled in when this returns
}

//Λ

function EntityExists( key, within ) {
    if( objects.get(key))
        return true;
    if( idMan.Auth( key ) ) {
        fc.restore( within, key, (error, buffer) => {
                if( error )
                        throw error;
                var e = Entity( config.run );
                e.fromString( buffer );
            } )
    }
}

var createdVoid = false;
var base_require;

function sealSandbox( sandbox ) {
    ["events", "crypto", "_module", "console", "Buffer", "require", "process","fs","vm"].forEach( key=>{
        Object.defineProperty( sandbox, key, { enumerable:false, writable:true,configurable:false} );
    })

}

function sealEntity( o ) {
    ["Λ", "container","contents","attach","create"
       , "has_value","loaded"
       ,"attached_to", "created_by",""
        , "assign", "detach","rebase","debase","drop","store","fromString","toString"
            //,"nearObjects"
            ,"sandbox"
        , "EventEmitter","usingDomains","defaultMaxListeners","init","listenerCount","requested"
        , "addListener", "removeListener", "removeAllListeners"
        ].forEach( key=>{
        Object.defineProperty( o, key, { enumerable:false, writable:true,configurable:false} );
    })
}



function Entity( obj, name, description, callback ){
    if( !name && !description ) {
        var all = all_entities.get( obj );
        var named = objects.get( obj );
        obj = named || all || obj;
        return obj;
    }
    if( typeof( obj ) === "string" ){
        //console.log( "resolve obj as entity ID")
        obj = objects.get( obj );
        //console.log( "resolve obj as entity ID", obj)
    }
    if( obj && !obj.Λ ) {
        base_require = require;
        obj = null;
    }
    if( ( !obj || !( all_entities.get(obj) || objects.get(obj.Λ) ) ) && createdVoid ) {
        console.log( "All Entities", all_entities );
        console.log( "Objects", objects );
        console.log( "invalid object is ", obj);
        throw new Error( { msg : "Invalid creator object making this one", o: obj } );
    }
    if( !config.run.Λ ) {
        //console.log( "had to wait for config.run", name, description )
        config.start( ()=>{Entity(obj,name,description, callback)} )
        return;
    }
    if( !obj ) {
        createdVoid = idMan.localAuthKey;
    }
    var o = {
        Λ : null
        , within : obj
        , attached_to: new Map()//[]
        , contains : new Map()//[]
        , created_by : null
        , loaded : false
        , has_value : false
        , value : null
        , name : name
        , decription : description
        , command : null
        , permissions : { allow_file_system : true }
        , sandbox : null
        , get container() { return this.within; }
        , create( name,desc, cb, value ) {
		console.trace( "Who calls create?  We need to return sandbox.entity?" );
            if( typeof desc === 'function' )  {
                cb = desc; desc = null;
            }
            Entity( this, name, desc, (newo)=>{
            	newo.value = value;
            if( typeof cb === 'string' )  {
                newo.sandbox.require( cb ); // load and run script in entity sandbox
                if( value ) value(newo);
            } else
                if( cb ) cb( newo ) // this is a callback that is in a vm already; but executes on this vm instead of the entities?
            } );
        }
        ,look() {
            var done = [];
            console.log( "exec look...")
            getObjects(this, null, true, (o)=>{
                done.push({name:o.name,ref:o.Λ});
                //netRequire.sack.Δ()
            })
            console.log( "err...")
            //while( !done.length )
            //    netRequire.sack.Λ();
            return done;
        }
        ,getObjects : (...args)=>getObjects( o, ...args )
        ,get contents() { return o.contains; }
        ,get nearObjects() {
            //console.log( "getting near objects")
            var near= new Map();
            near.set( "holding", o.attached_to );
                near.set( "contains", o.contains );
                near.set( "near", ( ()=>{
                    var result = new Map();
                    if( o.within ) {
	                    o.within.contains.forEach( (nearby)=>{
        	                if( nearby !== o ){
                	            result.set(nearby,nearby);
                        	}
	                    } );
        	            o.within.attached_to.forEach( (nearby)=>{
                	        result.set(nearby,nearby);
	                    } );
        	            return result;
                    }
                })() );
                //console.log( "near" );
                return near;
             }
        , assign : (object)=>{
            o.value = object;
            if( config.run.debug )
                sanityCheck( object );
        }
        , attach( a, b, isFromAtoB ) {
            var checked ;
            if ( isContainer(a, checked, o).Λ && isContainer(b, checked, o).Λ ) {
                a.within = null;
                if( isFromAtoB === undefined )
                    if( o.Λ !== a.Λ ) {
                        if( a.within ){
                            a.attached_to.set(o.Λ,o);
                            o.attached_to.set(a.Λ,a);
                            o.emit( 'attached', a );
                            a.emit( 'attached', o );
                        }
                    }
                    else {
                        throw "cannot attach to self";
                    }
                else {
                    cosnole.log( "Directional attach - incomplete ")
                    if( isFromAtoB ){

                    }
                }
            }
            else {
                throw "attachment between two differenly owned objects or one's not owned by you";
            }
         }
         , detach( a, b ) {
             if (o.Λ === a.within.Λ === b.within.Λ ) {
                 a.within = null;
                 if( o.Λ !== a.Λ ) {
                    a.attached_to.delete(a.Λ);
                    o.attached_to.delete(b.Λ);
                    o.emit( 'detached', a );
                    a.emit( 'detached', o );
                }
                else {
                    throw ""

                }
             }
          }
          , rebase( a ) {
                if( a.within ) return;
                outer = findContained( a );
                if( outer ) {
                    outer.within.contains.delete( outer.name );
                    outer.within = null;
                }
          }
          , debase( a ) {
                if( a.within )
                    if( a.attached_to.size ) {
                        a.attached_to.forEach( (key,val)=>{
                            if( val.within ){
                                a.within = null;
                                throw "attempt to debase failed...";
                            }
                        })
                        if( a.attached_to[0].within ) {
                            a.within = null;
                            throw "attempt to debase failed...";
                        }
                        try {
                            // just ned to get the first element...
                            // so we throwup here (*puke*)
                            a.attached_to.forEach( (key,val)=>{
                                key.within = a.within;
                                a.within.contains.set( key, val );
                                a.within.contains.delete(a.Λ);
                                throw 0;
                            } )
                        } catch(err){ if( err ) throw err; }
                        a.within = null;
                    }
                else {
                    // already debased (that is, this isn't the thing within)
                    return;
                }
          }
         , drop( a ) {
             var object
             var outer = o.within;
             if( !outer )
                outer = findContained( o );
            if( outer )
             if( a.within ) {

                 a.within.contains.delete(a.Λ);
                 a.within = o.within;
                 o.within.emit( 'contained', a );
             }
             else{
                 if( o.within ) {
                 a.attached_to.forEach( (p)=>{delete p.attached_to[a.Λ] } );
                 a.within = o
             }
                 object = findContained( a )
                 if( object ) { drop( object )
                     delete object.within.contains[object.Λ] ;
                     object.within = o;
                     obj.within.emit( 'contained', a );
                }
                else {
                        a.within = o;
                    }
            }
            if( o.within )
            {
                o.within.contains.set( a.Λ, a );
                a.within = o.within;
            }
             o.contains.delete(a.Λ);
             var attachments = []
             var ac = getAttachments( a );
         }
         , store( a ) {
             if( a.within ) {
		if( a.within !== o ) {
                 a.within.contains.delete( a.Λ);
                 a.within = o;
                 this.contains.set( a.Λ, a );
		    a.emit( "stored", o.sandbox.entity );
                    o.emit( "gained", a.sandbox.entity );
                } // already inside the specified thing.
             }
             else{ var object
                 object = findContained( a )
                 if( object !== o ) {
                     object.within.contains.delete( a.Λ);
                    //detach( a );
                    object.within = o;
                    this.contains.set( object.Λ, a ); 
		    a.sandbox.emit( "stored", object.sandbox.entity );
                    object.sandbox.emit( "gained", a.sandbox.entity );
                 }
             }
         }
         , run( command ) {
            vm.runInContext( command, sandbox, { filename:"run()", lineOffset:"0", columnOffset:"0", displayErrors:true, timeout:10} )             
         }
         , addProtocol(p,cb) {
	        entity.addProtocol( this.Λ + p, cb );
         }
         , toString(){
             var attached = null;
             this.attached_to.forEach( (member)=>{if( attached ) attached += '","'; else attached = ' ["'; attached+= member.Λ})
             if( attached ) attached += '"]';
             else attached = '[]';

             var contained = null;
             this.contains.forEach( (member)=>{if( contained ) contained += '","'; else contained = ' ["'; contained+= member.Λ})
             if( contained ) contained += '"]';
             else contained = '[]';
            return '{"' + this.Λ + '":' + ( this.value && this.value.toString() )
               + ',"within":"' +  (this.within && this.within.Λ)
               + ',"attached_to":' + attached
               + ',"contains":'+  contained
               + ',"created_by":"' + this.created_by.Λ
                + '}';
         }
         // fromString( "[]", )
         , fromString: ( string, callback ) => {
                 let tmp =  JSON.parse( string );
                 for( key in tmp) {
                     if( !idMan.Auth( key ) ) {
                        throw "Unauthorized object"
                        return;
                     tmp.Λ = key;
                     delete tmp[key];
                     break;
                 }
                 o.within = tmp.within || objects.get(tmp.within) || all_objects.get( tmp.within );
                 o.created_by = tmp.created_by || objects[tmp.created_by];
                 tmp.attached_to.forEach( (key)=>{ o.attached_to.push( objects[key] ) })
                 Object.assign( o, tmp );
             }
         }
    }
    o.created_by = obj||o;
    //console.log( "Attempt to get ID for ", (obj||createdVoid).Λ, config.run  )
    all_entities.set( o, o );

    Object.assign( o, ee.prototype );ee.call( o );
    //console.log( "Object should have emitter properties?!", Object.getPrototypeOf( o ) )

    idMan.ID( obj||createdVoid, config.run, (key)=>{
        //console.log( "object now has an ID", o, key );
        o.Λ = key.Λ;

        //console.log( "create sandbox here, after getting ID")
        o.sandbox = vm.createContext( makeSystemSandbox( o.Λ === key.Λ ) );
        o.sandbox.entity = makeEntityInterface(o);
        sealSandbox( o.sandbox );

        if( !callback )
            throw( "How are you going to get your object?");
        else callback(o);

        if( o.within )
            o.within.contains.set( o.Λ, o );
        objects.set( key.Λ, o );
        o.attached_to.set( o.Λ, o );

        sealEntity( o );

        if( !o.within ) o.within = o;

        o.within.sandbox.emit( "created", o );
        o.within.sandbox.emit( "inserted", o );
        o.within.contains.forEach( near=>(near!==o)?near.emit( "joined", o ):0 );
    } )

    function getObjects( me, src, all, callback ){
        var object = src&&src[0];
        var count = 0;
        //var all = false;
        var run = true;
        var tmp;
        //console.trace( "args", me, "src",src, "all",all, "callback:",callback )
        if( typeof all === 'function' ) {
            callback = all;
            all = false;
        }
        if( object && object.text == 'all' && object.next && object.next.text == '.' ) {
            all = true;
            object = object.next.next;
        }
        if( object && ( tmp = Number( object.text ) ) && object.next && object.next.text == '.' ) {
            object = object.next.next;
            count = tmp;
        }
        //var command = src.break();
        //console.log( "get objects for ", me.name, object&&object.text)
        me.nearObjects.forEach( function(value,key){
            console.log( "checking key:", key )
            if( run ) value.forEach( function ( value,member ){
                if( value === me ) return;
                if( !object || value.name === object.text ){
                    //console.log( "found object", value.name )
                    if( count ){
                        count--;
                        return;
                    }
                    if( run ){
                        console.log( "and so key is ", key )
                        callback( value, key );
                    }
                    run = all;
                }
            });
        })
    }

    function makeSystemSandbox( local ) {
        if( config.run.Λ === o.Λ )
            var theVoid = true;
        else
            var theVoid = false;

        if( !local )
        {
            console.log( "hmm... I want this to be because my ID was from someone else...")
        }

        //if( config.run.Λ === o.Λ )
        //    theVoid = true;
        //if( config.run.Λ === o.created_by.Λ )
        //    local = true;

        var sandbox = {
                require : local?sandboxRequire:netRequire.require
                , process : process
                , Buffer : Buffer
                , crypto : crypto
                , _module : { filename: "internal"
                        , file: "memory://"
                        , parent : null
                        , paths : [local?__dirname+"/..":"."]
                        , exports: {}
                        , loaded : false
                        , rawData : ''
                      }
                , get now() { return new Date().toString() }
                , get me() { return o.Λ; }
                //, get room() { return o.within; }
                , idGen(cb) {
                    idMan.ID( o.Λ, o.created_by.Λ, cb );
                }
                , console : {
                    log : (...args)=>console.log( ...args )
                }
                , io : {
                    addProtocol(p,cb) { return o.addProtocol(p,cb);},
                    addDriver(name, iName, iface) {
                        var caller = {};
                        var keys = Object.keys(iface);
                        keys.forEach( key=>{
                            var constPart = `${iName}[${key}](`;
                            caller[key] = function(...argsIn) {
                                var args = "";
                                argsIn.forEach( arg=>{
                                    if( args.length ) args += ",";
                                    args += JSON.stringify( arg )
                                })
                                args += ")";
                                vm.runInContext( constPart + args, sandbox )
                            }
                        })
                        drivers.push( { name: name, iName:iName, orig: iface, iface: caller } );
                    },
                    openDriver(name) {
                        var driver = drivers.find( d=>d.name === name );
                        if( driver )
                            return driver.iface;
                    }
                }
                , events : {}
                , on : ( event, callback ) =>{
                    sandbox.emit( "newListener", event, callback )
                    if( !(event in sandbox.events) )
                        sandbox.events[event] = [callback];
                    else
                        sandbox.events[event].push( callback );
                }
                , off( event, callback ){
                    if( event in sandbox.events ) {
                        var i = sandbox.events[event].findIndex( (cb)=>cb===callback );
                        if( i >= 0 )
                            sandbox.events[event].splice( i, 1 );
                        else
                            throw new Error( "Event already removed? or not added?", event, callback );
                    }
                    else
                        throw new Error( "Event does not exist", event, callback );
                    sandbox.emit( "removeListener", event, callback )
                }
                , addListener : null
                , emit( event, ...args ){
                    if( event in sandbox.events ) {
                        sandbox.events[event].find( (cb)=>cb( ...args) );
                    }
                }
                , send(target, msg ) {
                    //o.Λ
                    //console.log( "entity in this context:", target, msg );
                    var o = objects.get( target.Λ||target );
                    o.emit(  )
                    entity.gun.get( target.Λ||target ).put( { from:o.Λ, msg : msg } );
                }
        };
        sandbox.addListener = sandbox.on;
        sandbox.removeListener = sandbox.off;
        sandbox.removeAllListeners = (name)=>{
            Object.keys( sandbox.events ).forEach( event=>delete sandbox.events[event] );
        };
        return sandbox;
    }

    function firstEvents( sandbox ) {
        sandbox.on( "newListener", (event,cb)=>{
            if( event === "message" ) {
                console.log( "listen for self",o.Λ )
                sandbox.io.gun.map( cb );
                return true;
            }
        });
        return false;
    }

    function makeEntityInterface( o ) {
        var i = {
            get Λ() { return o.Λ; },
            get name() { return o.name; },
            get description() { return o.description; },
            get value() { return o.value; },
            get inventory() {
                var i = { in: [], on:[] };
                //o.getObjects( o, filter, true, (near,where)=>{if( where === "contains" ) result.push( {name:near.name,Λ:near.Λ} ) } );
                o.contains.forEach( ( near )=>{ i.in.push( {name:near.name,Λ:near.Λ} ) } );
                o.attached_to.forEach( ( near )=>{ if( near !== o ) i.on.push( {name:near.name,Λ:near.Λ} ) } );
                return i;
            },
            look() { return o.look(); },
            create(name,desc,callback) { o.create( name, desc,callback ) },
	        store(a) {
                   a = objects.get(a.Λ);
                   o.store(a);
            },
            run(statement) {
                o.run( statement );
            },
            //get value() { return o.value; }
        }
        return i;
    }

    function sandboxRequire( src ) {
        console.log( "sandboxRequire ", src );
        //console.log( "module", o.sandbox.module );
        if( src === "entity.js" ) return exports;
        if( src === "shell.js" ) return exports.Sentience;
        if( src === "text.js" ) return text;

        if( o.permissions.allow_file_system && src == 'fs' ) return fs;
        if( o.permissions.allow_file_system && src == 'stream' ) return stream;
        if( src == 'crypto' ) return crypto;
        if( src == 'util' ) return util;
        if( src == 'vm' ) return vm;
        if( src == 'events' ) return events;
        if( src == 'sack.vfs' ) return vfs;

        var rootPath = "";
        // resolves path according to relative path of parent modules and resolves ".." and "." parts
        var root = netRequire.resolvePath( src, o.sandbox._module );
        _debugPaths && console.log( "src could be", src );
        _debugPaths && console.log( "root could be", root );
        _debugPaths && console.log( "working root is ", rootPath );
        try {
            var file = fs.readFileSync( root, {encoding:'utf8'} );
        }catch(err) {
            console.log( "File failed... is it a HTTP request?", err );
            return undefined;
        }
        //console.log( o.sandbox.module.name, "at", rootPath,"is loading", src );
        //var names = fs.readdirSync( "." );
        //console.log( names );
        var pathSplita = src.lastIndexOf( "/" );
        var pathSplitb = src.lastIndexOf( "\\" );
        if( pathSplita > pathSplitb )
            var pathSplit = pathSplita;
        else
            var pathSplit = pathSplitb;

        if( src.startsWith( "./" ) )
            rootPath = rootPath + src.substr(2,pathSplit-2 );
        else if( src.startsWith( "../" ) )
            rootPath = rootPath + src;//src.substr(2,pathSplit-2 );
        else
            rootPath = rootPath + src.substr(0,pathSplit );
      	
	//console.log( "set root", rootPath );

        var code = 
		['(function(exports,config,module){'
		, file
		, '})(_module.exports,{}, _module );\n//# sourceURL='
		, root
		].join("");
        var oldModule = o.sandbox.module;
        var thisModule =  { filename: root
                        , file: netRequire.stripPath( root )
                        , parent : o.sandbox._module
                        , paths : [netRequire.stripFile( root)]
                        , exports: {}
                        , loaded : false }

//        { name : src.substr( pathSplit+1 ), parent : o.sandbox.module, paths:[], root : rootPath, exports:{} };
        //oldModule.children.push( thisModule );
        o.sandbox._module = thisModule;
        vm.runInContext(code, o.sandbox
            , { filename:src, lineOffset:0, columnOffset:0, displayErrors:true, timeout:1000} )
        //console.log( "result exports for ", src
        //               , thisModule.name
        // 		 , thisModule.exports
        //           );
        o.sandbox._module = oldModule;
        //console.log( "active base module is ... ")
        return thisModule.exports;
    }
}


function findContained( obj, checked ){
    if( obj.within ) return obj;
    if( !checked )
        checked = [];
    for( content in obj.within ) {
        if( checked[content.Λ] )
            break;
        checked[content.Λ] = true;
        if( content.within ) return content;
        var result = findContainer( content, checked );
        if( result ) return result;
    }
    throw "Detached Entity";
}

function findContainer( obj, checked ){
    if( obj.within ) return obj.within;
    if( !checked )
        checked = [];
    for( content in obj.attached_to ) {
        if( checked[content.Λ] ) continue;
        checked[content.Λ] = true;
        if( content.within ) return content.within;
        var result = findContainer( content, checked );
        if( result ) return result;
    }
    throw "Detached Entity";
}

function isContainer( obj, checked, c ){
    if( obj.within ) return ( obj.within.Λ === c.Λ );
    if( !checked ) {
        checked = [];
        return recurse( obj, checked, c );
    } else {
        for( att in checked ) {
            if( att.within.Λ === c.Λ )
                return true;
        }
        return false;
    }

    function recurse ( obj, checked, c ) {
        for( content in obj.attached_to ) {
            if( checked[content.Λ] ) continue;
            checked[content.Λ] = true;
            if( content.within.Λ  == c.Λ ) return true;
            return recurse( content, checked, c  );
        }return false;
    }
}


function getAttachments( obj, checked ){
    if( obj.within ) return obj.within;
    for( content in obj.attached_to ) {
        if( checked[content.Λ] )
            break;
        checked[content.Λ] = content;
        getAttachments( content, checked );
    }
    return checked;
    throw "Detached Object";
}

function getObjects( o, filter, all, callback ) {
    if( typeof all === 'function' ) {
        callback = all;
        all = null;
    }
    o = objects.get(o);
    if( o )
        o.getObjects( filter, all, e=>{callback(e.sandbox)})
}

function getEntity( ref ) {
    var o = objects.get(o);
    if( o ) return o;
    return null;

}

function sanityCheck( object ) {
    var s = JSON.stringify( object );
    var t = object.toString();
    console.log( `json is ${s}`);
    console.log( `toString is ${t}`)
    var os = JSON.parse( s );
    if ( os !== object ) {
        console.log( `did not compare for json conversion.  ${os}  ${object}` );
        console.log( os );
        console.log( object );
    }
}
