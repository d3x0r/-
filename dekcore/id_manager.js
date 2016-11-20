"use strict";

const fs = require( 'fs');
var config = require( './config.js' );
console.log( "config is ", config.run.root );
const fc = require( config.run.root + '/file_cluster.js')
const Entity = require( config.run.root + '/Entity/entity.js')

var idGen = require( "./id_generator.js").generator;
var key_frags = new Map();
// key_frags[key] = keys
// #1: { }
    //Map.prototype.length = function() { return Object.keys( keys ).length - 5
//}
var keys = new Map();
var mkey;
keys.toString = ()=>{
    var leader = `{"Λ":"${keys.Λ}"
        ,"mkey":"${mkey&&mkey.Λ}"
        ,"keys":`;
    var footer = '}';
    var buffer = null;
    keys.forEach( (key,index,mem)=>{
        if( !buffer ) buffer = '{'; else buffer += '\n,';
        buffer += '"' + key.Λ +'":' +  key.toString()  ;
    });
    if( buffer ) buffer += '}';
    return leader + buffer + footer;
}

function stackTrace() {
    try {
        throw new Error( "stack trace" )
    }catch( err ) {
        console.log( err.stack );
    }
}

function Key(maker_key) {
    //console.log(" Someone making a Key()", maker_key )

    var real_key;
    if( maker_key.Λ ) real_key = keys.get( maker_key.Λ );
    else              real_key = keys.get( maker_key );
    if( real_key )    maker_key = real_key.Λ;

    var key = { maker : maker_key
            , Λ : idGen()
            , authby : null
            , requested : 0  // count
            , trusted : false // boolean
            , invalid : false // fail all auth and do not persist
            , authonly : true // don't send copies to other things
            , created : new Date().getTime()
            , timeOffset : config.run.timeOffset
            , toString : ()=> {
                //console.log( " tostring of ", key);
                if( !mystring ){
                    var _a = key.authby;
                    key.authby = key.authby.Λ;
                    //var _m = key.maker;
                    //key.maker = key.maker.Λ;
                    mystring = JSON.stringify( key );
                    key.authby = _a;
                    //key.maker = _m;
                }
                return mystring;
            }
        };

        var mystring;
        keys[key.Λ] = key;
        //console.log( "generated key ", key.Λ )
        return key;
}

function KeyFrag( fragof ) {
    return {
        Λ : ID( fragof ).Λ
        //_ :
        , keys : []
        , toString : ()=>{
            var mystring;
            if( !mystring )
                mystring = keys.toString();
            return mystring;
        }
    }
}

exports.Auth = ( key ) => {
    if( keys.get(key) )
        return validateKey( key, (k)=>{return k.authby} );
    return false;
}

var local_authkey;
Object.defineProperty( exports, "localAuthKey", { get : function() { 
console.log( "local authkey request..." );
	if( local_authkey ) 
        	return local_authkey; 
        console.log( "create a new local authority" );
	local_authkey = Key( config.run.Λ ) 
	local_authkey.authby = config.run.Λ;
        return local_authkey;
} } );   

Object.defineProperty( exports, "publicAuthKey", { get : function() { 
console.log( "public authkey request..." );
	if( local_authkey ) 
        	return local_authkey; 
        console.log( "create a new public authority" );
        
	//local_authkey = Key( config.run.Λ ) 
	//local_authkey.authby = config.run.Λ;
} } );



exports.ID = ID; function ID( making_key, authority_key, callback )  {
    //stackTrace();
    //console.log( "Making a key...... ")
    //console.log( config.run.Λ );
    //console.log( keys[making_key.Λ] );
    if( !making_key ) throw new Error( "Must specify at least the maker of a key" );
    if( !keys.get( config.run.Λ) ){
        console.log( "waiting for config...")
        config.start( ()=>{ ID( making_key, authority_key, callback ); } );
        return;
    }
    if( !authority_key )
        authority_key = keys.get(config.run.Λ)
    if( !making_key.Λ )
        making_key = keys.get( making_key );
    if( !authority_key.Λ )
        authority_key = keys.get( authority_key );
    else
        authority_key = keys.get( authority_key.Λ );

    console.log( `making_key ${making_key}` );
    console.log( `authority_key ${authority_key}` );
    
    if( making_key === authority_key )
        throw new Error( "Invalid source keys" );

    if( !making_key || !validateKey( making_key, (k)=>{return keys.get( k.maker )} ) )
        if( !authority_key || !validateKey( authority_key, (k)=>{return k.authby} ) ) {
            console.log( "MakingKey",making_key );
            console.log( "AuthorityKey", authority_key );
            throw {msg:"Invalid source key", maker:making_key, auth:authority_key } ;
        }
    var newkey = Key( making_key );
    newkey.authby = authority_key;
    if( making_key === authority_key )
    	newkey.
    keys.set(newkey.Λ, newkey );
        if( authority_key )
            newkey.authby = authority_key
        //console.log( "made a new key", keys );
        if( callback )
            callback( newkey );
        return newkey;
}

function validateKey( key, next, callback ) {
    let ID;
    if( !key ) {
        return false;
    }
    if( key.Λ ) ID = keys.get(key.Λ);
    else ID=keys.get(key);
    //console.log( "validate key ", ID )
    if( ID )
    {
        //console.log( "validate key had a key find", ID)
        if( ID.trusted )
            return true;
        if( ID.key == key )
            return false;
        ID.requested++;
        if( ID.invalid )
            return false;
        if( key === config.run.Λ ) {
            console.log( "validate success because key is config.run")
            return true;
        }
        if( ID.maker === ID.Λ )
            return true;
        return validateKey( next( ID ), next );//.maker ) && validateKey( ID.authby );
    }
    else {
        // requestKey and callback?

        if( callback ) {
            callback( yesno );
        }
        console.log( "no such key" )
        //exports.ID( config.run.Λ );
        //return true;
    }
    return false;
}

function saveKeys(callback) {
    var fileName = "core/id.json"
    fc.store( fileName, keys, callback );
}


function loadKeyFragments( o ) {

        var result;
        console.log( 'loadkeyFragment',  o )
        fc.reloadFrom( o, (error, files)=>{

            if( error ){
                    console.log(" koadfrom directoryerror: " + error)
            }
            else if( files.length === 0 ) {
                console.log( "no files...")
                return;
            }
        //var fileName = fs.;
        console.log( "loading fragments ", files );
        if( !error )
        fc.reload( files, (error, buffer )=> {
            console.log( "reload id : ", error, " ", buffer)
            if( error ) {
                  /* initial run, or the file was invalid*/
                  console.log( "can only load fragments that exist so... ", error );
                }else {
                  var data = fc.Utf8ArrayToStr( buffer );
                  try {
                      //console.log( "about to parse this as json", data );
                      var reloaded_keys = JSON.parse( data );
                      console.log("no error", reloaded_keys);
                      //if( keys.length === 0 )
                  }catch(error) {
                      console.log( data );
                      console.log( "bad keyfrag file", error );
                  }
              }
          });
      });
}

function loadKeys() {
    console.log( "Load Keys")
    var result;
    var fileName = "core/id.json";
    config.defer(); // save any OTHER config things for later...

    /*
     * if every run invalidates keys I created?
    keys.Λ = config.run.Λ;
    var runKey = Key( config.run.Λ );
    runKey.Λ = config.run.Λ;
    keys.set( config.run.Λ, runKey );
    */

    console.log( "fc.reload... ")
    fc.reload( fileName, (error, buffer )=> {
        if( error ) {
            console.log( "Reload failed", error, keys.size )
                //if( keys.size === 1 ) {
                    //let newkey =  idGen.generator();
                    //console.log(  newkey.toString() );
                    console.log( "new id generator id created" );

                    var runKey = Key( config.run.Λ );
                    runKey.trusted = true;
                    keys.Λ = runKey.Λ;//config.run.Λ;
                    keys.set( keys.Λ, runKey );

                    var runKey2 = Key( config.run.Λ );
                    // generated a ID but throw it away; create config.run key record.
                    runKey2.Λ = config.run.Λ;
                    runKey2.authby = runKey;
                    runKey.authby = runKey2;
                    keys.set( config.run.Λ, runKey2 );
                    mkey = runKey2;

/*
                    var newkey = Key(newkey);
                    newkey.trusted = true;
                    newkey.authby = keys.get( config.run.Λ );
                    newkey.maker = newkey.Λ;
                    //newkey.authby.authby = newkey;

                    keys.set( newkey.Λ, newkey );
                    console.log( keys.get(newkey.Λ) )
*/

                //}
                saveKeys();
            }else {
              var data = fc.Utf8ArrayToStr( buffer );
              try {
                  //console.log( "data to parse ", data);
                  var loaded_keys = JSON.parse( data );
                  keys.Λ = loaded_keys.Λ;
                  var keyids;
                  ( keyids = Object.keys( loaded_keys.keys ) ).forEach( (keyid,val)=>{
                      //console.log( "key and val ", key, val );
                      var key;
                      keys.set( keyid, key = loaded_keys.keys[keyid] );
                  } );
                  keyids.forEach( (keyid,val)=>{
                      //console.log( "key and val ", key, val );
                      var key = keys.get( keyid );
                      key.authby = keys.get( key.authby );
                  } );
                  mkey = keys.get( loaded_keys.mkey );

                  //console.log( "new keys after file is ... ", keys );
                  //console.log( "new mkey after file is ... ", mkey );
              }catch(error) {
                  console.log( "bad key file", error );
                  //fs.unlink( fileName );
              }
          }
              //console.log("no error", keys.length());
              //#ifdef IS_VOID
              if( keys.size === 0 )
                {
                    //console.log( Object.keys( keys ).length)
                    //console.log( "NEED  A KEY")
                    var key = Key( config.run.Λ );
                    key.authby = key.Λ;
                    key.trusted = true;
                    console.log( "created root key", key );
                    mkey = key;
                    keys.set( key.Λ,  key );
                    console.log( keys )
                    keys.first = keys[key.Λ];
                    console.log( "new keys after file is ... ", keys );

                    ID( key, config.run.Λ, (runkey)=>{
                        console.log( "created root key", runkey );
                        runkey.authby = key.Λ;
                        //console.log( "throwing away ", runkey.Λ );
                        delete keys[runkey.Λ];
                        keys[config.run.Λ] = runkey;
                        runkey.Λ = config.run.Λ;
                        mkey = key;
                        //console.log( "new keys ", Object.keys(keys) );
                        let frag = key_frags[0];
                        if( !frag ) {
                        // keys is a valid type to pass to create
                        // but is any value.
                            key_frags = Entity( config.run ).create( keys );
                        //key_frags.Λ = Key( config.run.Λ ).Λ;
                        //frag = KeyFrag( config.run.Λ );
                        //frag_ent = Entity( frag  );
                        //frag_ent.value = keys;
                        //key_frags.store( frag_ent );

                        //key_frags.push( frag );
                        //frag.keys = keys;
                            console.log( "Initial Write?")
                            fc.store( config.run, key_frags );
                            saveKeys();
                        }
                    } );
                    //console.log( "fragment keys is a function??", key_frags[0] )
                    //key_frags.keys[frag.Λ] = key.Λ;

                }
                //#endif
                if( keys.size < 100 )
                {
                    //console.log( "manufacture some keys......-----------")
                    //Key( keys. )
                    ID( mkey, mkey.authby, (key)=>{
                        //console.log( "newkey:", key)
                        saveKeys();
                    } )
                }
        config.resume();

      });
}

function saveKeyFragments( ) {
    key_frags.forEach( (a)=>{
            console.log(" doing store IN", key_frags, a  );
            fc.store( key_frags, a );
    } )

}

exports.SetKeys = setKeys;
function setKeys( runkey ) {
    console.log( "O is config.run");
    loadKeyFragments( config.run );
    if( !key_frags || !key_frags.size ) {
        console.log( 'need some keys')
    }
    else {
        if( key_frags.size == 1 )
        {
            console.log( "Key_frags ... these should be on the disk....")
            //console.log( key_frags );
        //key_frags.forEach( (a)=>{
            //    console.log(" doing store IN", key_frags, a  );
                //fc.store( key_frags, a );
        //} )
        //fc.store( key_frags, key_frags.keys );
        }
    else {
        console.log( "recovered key_frags", key_frags.size, " plus one ");
    }
    }
}


//function
console.log( "Schedule loadKeys with config.start")
config.start( loadKeys );
