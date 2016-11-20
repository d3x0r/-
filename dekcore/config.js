"use strict";
const fc = require( './file_cluster.js');
const idGen = require( "./id_generator.js" );
const fs = require( 'fs');
const os = require("os");
//console.log( fc );
var config = module.exports = exports = {
    starts : []
    , start_deferred : false
    , run : {
        Λ : undefined
        , hostname : os.hostname()
        , root : "."
        , debug : true
         , addresses : []  // who I am...
         , friends : []  // discover should use this setting for off-network contact
         , timeOffset : new Date().getTimezoneOffset() * 60000
         , commit : () => {
            saveConfig();
         }
         , toString : ()=>{
             return JSON.stringify( config.run );
         }
    }
}

function saveConfig( callback ) {
    //if( !fs.exists( 'core') )
    //console.log( "store config")
    fc.mkdir( "core", ()=>{
        console.log( "calling store now....")
        fc.store( "core/config.json", config.run, callback );
    });
}

//res.sendfile(localPath);
//res.redirect(externalURL);
//
function loadConfig() {
    fc.reload( "core/config.json",
        function(error, result) {
            //console.log( "loadCOnfig:",error );
            if( !error ) {
                //console.log( "attempt to re-set exports...", result);
                var str = fc.Utf8ArrayToStr( result );
                console.log( "parsing", str );
                var object = JSON.parse( str );
                Object.assign( config.run, object );
                //console.log( "config reload is", config.run.Λ )
                //config.run = object;
                resume();
            }
            else
            {
                console.log( "rebuilding config." )
                if( !config.run.Λ )
                    config.run.Λ =idGen.generator()
                saveConfig( ()=>{console.log( "call resume?" ); resume();} );
            }
        });
}

loadConfig();

exports.start = function(callback) {
    if( config.Λ ){
        if( config.starts.length ) {
            config.starts.forEach( (cb)=>{cb();});
            config.starts = [];
        }
        console.log( "config.start....")
        callback();
    }
    config.starts.push( callback );
}
exports.defer = function() {
    console.log( "config.defer....")
    config.start_deferred = true;
    config.starts_deferred = config.starts;
}

exports.resume = resume;
function resume() {
    console.log( "config.resume....", config.starts )
    while( config.starts.length ) {
         if( config.start_deferred ) break;
         //console.log( "run thing ", config.starts[0].toString())
         var run = config.starts.shift();
         run();
         //config.starts[0]();
         if( config.start_deferred ) {
             console.log( "got deferred...", config.starts)
            config.starts_deferred = config.starts;
            //console.log( "run thing ", config.starts[0].toString())
            break;
        }
     }
     config.starts = null
     if( config.start_deferred )
        config.starts = config.starts_deferred;
        console.log( "clear deferred ")
    config.start_deferred = false;
}
