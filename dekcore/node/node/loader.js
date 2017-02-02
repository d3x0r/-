"use strict";

global.URL = require( './browserURL.js' );

function load()
{ 
   //console.log( global );
   var req = require( './require' );
   global.require( "http://localhost:2880/" );
}

load();
