"use strict";

/*
This is to
*/
//var
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
var config = require( '../config.js');
var vm = require( 'vm' );
const fs = require( 'fs' );
const stream = require( 'stream' );
const util = require( 'util' );
const process = require( 'process' );
var all_entities = new WeakMap();
var objects = new Map();

module.exports = exports = Entity

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

function Entity( obj, name, description, callback ){
    if( obj && !obj.Λ ) {
        base_require = require;
        obj = null;
    }
    if( ( !obj || !( all_entities.get(obj) || objects.get(obj.Λ) ) ) && createdVoid ) {
        console.log( "All Entities", all_entities );
        console.log( "Objects", objects );
        console.log( "invalid object is ", obj);
        throw { msg : "Invalid creator object making this one", o: obj };
    }
    if( !config.run.Λ ) {
        console.log( "had to wait for config.run", name, description )
        config.start( ()=>{Entity(obj,name,description, callback)} )
        return;
    }
    if( !obj ) {
        createdVoid = idMan.localAuthKey;
    }
    console.log( `${name}  config.run.Λ`, config.run.Λ)
    var o = {
        Λ : null
        , within : obj
        , attached_to: new Map()//[]
        , contains : new Map()//[]
        , created_by : obj||o
        , loaded : false
        , has_value : false
        , value : null
        , name : name
        , decription : description
        , command : null
        , sandbox : vm.createContext( {
            require : sandboxRequire
            , process : process
            , Buffer : Buffer
            , module : { name: name, parent : null, children : [], root : ".", exports: {} }
            , now : new Date().toString()
            , me : o
            , console : {
                log : function(){
                    console.log.apply( console, arguments)
                }
            }

        })
        ,  get container() { return o.within; }
        , create( value ) {
            var newo = Entity( findContainer( o ) );
            newo.value = value;
        }
        ,get contents() { return o.contains; }
        ,get nearObjects() {
                //console.log( "getting near objects")
            return {holding:o.attached_to
                , contains:o.contains
                , near:( ()=>{
                    var result = new Map();
                    o.within.contains.forEach( (nearby)=>{
                        if( nearby !== o ){
                            result.set(nearby,nearby);
                        }
                    } );
                    o.within.attached_to.forEach( (nearby)=>{
                        result.set(nearby,nearby);
                    } );
                    return result;
                 })() }
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
                            a.attached_to[o.Λ]=o;
                            o.attached_to[a.Λ]=a;
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
                 delete a.attached_to[a.Λ];
                 delete o.attached_to[b.Λ];
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
                    if( a.attached_to.length ) {
                        if( a.attached_to[0].within ) {
                            a.within = null;
                            throw "attempt to debase failed...";
                        }
                        a.attached_to[0].within = a.within;
                        a.within.contains[a.attached_to[0].Λ] = a.attached_to[0];
                        delete a.within.contains[a.Λ];
                        a.within = null;
                    }
                else {
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

                 delete a.within.contains[a.Λ];
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
                o.within.contains[a.Λ] = a;
                a.within = o.within;
            }
            delete o.contains[a.Λ];
             var attachments = []
             var ac = getAttachments( a );
         }

         , store : ( a )=> {
             if( a.within ) {
                 a.within.contains.delete( a.Λ);
                 a.within = o;
                 o.contains.set( a.Λ, a );
             }
             else{ var object
                 object = findContained( a )
                 object.within.contains.delete( a.Λ);
                 //detach( a );
                 object.within = o;
                 o.contains.set( object.Λ, a );
             }
         }
         , toString : ()=>{
             var attached = undefined;
             o.attached_to.forEach( (member)=>{if( attached ) attached += '","'; else attached = ' ["'; attached+= member.Λ})
             if( attached ) attached += '"]';
             else attached = '[]';
             var contained = undefined;
             o.contains.forEach( (member)=>{if( contained ) contained += '","'; else contained = ' ["'; contained+= member.Λ})
             if( contained ) contained += '"]';
             else contained = '[]';
            return '{"' + o.Λ + '":' + ( o.value && o.value.toString() )
               + ',"within":"' +  (o.within && o.within.Λ)
               + ',"attached_to":' + attached
               + ',"contains":'+  contained
               + ',"created_by":"' + o.created_by.Λ
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
    o.sandbox.global = o.sandbox;
    if( o.within )
        o.within.contains.set( o, o )
    console.log( "Attempt to get ID for ", (obj||createdVoid).Λ, config.run  )
    all_entities.set( o, o );
    Object.assign( o, require('events').EventEmitter )

    idMan.ID( obj||createdVoid, config.run, (key)=>{
        //console.log( "object now has an ID", o, key );
        o.Λ = key.Λ;
        o.created_by = obj || o;
        objects.set( key.Λ, o );
        o.attached_to.set( o.Λ, o );
        //o.sandbox["me"] = o;
        Object.defineProperty( o.sandbox, "me", { get:()=>{ return o; } } );
        Object.defineProperty( o.sandbox, "room", { get: ()=>{ return o.container }} )
        if( obj )
            obj.sandbox
        if( !callback )
            ;//throw( "How are ou going to get your object?");
        else callback(o);

    } )

    function sandboxRequire( src ) {
        console.log( "require ", src );
        //console.log( "module", o );
        if( src == 'fs' ) return fs;
        if( src == 'stream' ) return stream;                    
        if( src == 'util' ) return util;
        if( src == 'vm' ) return vm;

        var rootPath = "";
        var p = o.sandbox.module;
        while( p ) {
            rootPath = p.root + "/" + rootPath;
            p = p.parent;
        }
        //console.log( "working root is ", rootPath );
        try {
            var file = fs.readFileSync( o.sandbox.module.root +"/" + src, {encoding:'utf8'} );
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
        else                        
            rootPath = rootPath + src.substr(0,pathSplit );
        //console.log( "set root", rootPath );
        
        var code = `(function(){${file}})()`;
        var oldModule = o.sandbox.module;
        var thisModule = { name : src.substr( pathSplit+1 ), parent : o.sandbox.module, children:[], root : rootPath, exports:{} };
        oldModule.children.push( thisModule );
        o.sandbox.module = thisModule;
        o.sandbox.exports = thisModule.exports;
        vm.runInContext(code, o.sandbox 
            , { filename:src, lineOffset:0, columnOffset:0, displayErrors:true, timeout:100} )
        //console.log( "result exports for ", src
        //               , thisModule.name
        // 		 , thisModule.exports 
        //           );
        o.sandbox.module = oldModule;
        o.sandbox.exports = oldModule.exports;
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
    return false;
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

