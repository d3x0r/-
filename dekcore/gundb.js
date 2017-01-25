
"use strict";

var Gun = require( 'gun' );
var ID = require( './id_generator.js' );

var gun = Gun( { uuid : ID.generator, file : "guntest.json", peers : [ "ws://localhost:1234" ] } );

// incomplete...
// all the above options need configuration; based on sections of the process apparently
// so they all need to do their own Gun instancing.
exports.db = 

