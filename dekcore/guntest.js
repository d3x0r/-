"use strict";

var Gun = require( 'gun' );
var ID = require( './id_generator.js' );

var gun = Gun( { uuid : ID.generator, file : "guntest.json", peers : [ "ws://localhost:1234" ] } );


gun.get( "bacon" ).path("plate").put( "eggs" );
gun.get( "bacon" ).put( {plate : { eggs : true } } );