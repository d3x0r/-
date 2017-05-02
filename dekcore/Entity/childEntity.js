


// childEntity
var Entity = require( './Entity.js' );
var config = Entity.config;
config.start();
Entity.idMan.setRunKey( process.argv[2] );

process.on('message', (m) => {
  console.log('CHILD got message:', m);

});

console.log( "and then...", process.argv )

process.send({ op: 'present' });