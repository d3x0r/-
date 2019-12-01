
var config = require ('./config.js');
const certGen = require( "./util/keyMaster/keyService.js" );

config.resume();
certGen.init();

var root = certGen.getRootCert();
console.log( root );
//process.exit()
