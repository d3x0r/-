
var db = {};

module.exports = exports = db;

var config = require( './config.json' );

var vfs = require( 'sack.vfs' );
var idGen = require( "../util/id_generator.js" ).generator;;
//var mssql = require( 'mssql' );
//var connection = new mssql.Connection(config.cred1);

var db = require( "./serverDb.js" );


var inits = [];

inits.push( loadDefaults );
inits.push( init );

function nextInit(){
	// dont' auto loop; some things may be delayed
	if( inits.length ) 
        	inits.shift()();
}

function init(cb) {
	connection.connect( ( err )=> {
        	if( err ) {
                	alert( "Database connection failed." + err );
                	return;
                }
		else nextInit();
	});
}

//--------------------------------------------------
// http/weboscket service.  
//   really at this layer we just get websocket data and close
var server = require( './http2.js' );

var displayBoard = [];  // these are display points - they just update game information
var unitList = [];  // player terminals (these have cards and packs and report winners)


server.startServer( (connection,message)=>{
	console.log( "Received message:", message );
        var msg = JSON.parse( message.utf8Data );
		if( msg.op === "getLogin" ) {
			console.log( "from who? ", connection.remoteAddress );
			var a;
			connection.clientId = msg.id;
			connection.login = db.getLogin( connection.remoteAddress, msg.id );
			if( connection.login ) {
				connection.login.connection = connection;
				db.updateLogin( connection.login );
			}
			if( connection.login )
				connection.send( `{"op":"oldLogin","key":"${connection.login.key}","id":"${connection.login.cid}"}`);
			else
				connection.send( `{"op":"newLogin"}`);
		}
		if( msg.op === "userLogin" ) {
			console.log( "USER LOGIN" );
			connection.login = db.loginUser( msg.username, msg.password, msg.require, connection.remoteAddress, connection.clientId, (oldLogin)=>{
				if( oldLogin.connection ) {
					oldLogin.connection.send( `{"op":"confirmLogout"}`); // reset client, login failed.
					return true;
				}
				return false;
			} );

			console.log( "login result is:", connection.login );
			if( !connection.login )
				connection.send( `{"op":"newLogin"}`); // reset client, login failed.
			else {
				connection.send( `{"op":"setLogin","key":"${connection.login.key}"}`)
				connection.send( `{"op":"setClientKey","key":"${connection.login.cid}"}`)
			}
		}
		if( msg.op === "getClientKey" ) {
			connection.send( `{"op":"setClientKey","key":"${idGen()}"}`)
		}
		if( msg.op === "logout" ) {
			db.logout( connection.login.key )
		}
     },
      (connection)=>{
		  if( connection.login )
		  	connection.login.connection = connection;
		else console.log( 'connection was not fully connected')
      }
)

console.log( "run default Map"); 

var gameState = {
	monitorQueue : [],
        calledBalls : [],
        calledBall : 0,
	gunDb : server.gameGun.get( "gameState" )
}

gameState.gunDb.map( (val,field)=>{ 
	console.log( "got gamestate:", field, val ) 
	if( field === "monitor" ) {
        	if( gameState.monitorQueue.length === 0 )
                	gameState.gunDb.put( { nextcall: val } );
        	gameState.monitorQueue.push( val );
                
        }
	if( field === "call" ) {
        	if( val ) {
	        	var ball = gameState.monitorQueue.shift();
        	        gameState.gunDb.put( { call : false, called : ball } );
                }
        }
} );

//-----------------------------------------------------------------------------------------
db.connect( server.authGun );

function loadDefaults( ) {
	
}

//-----------------------------------------------------------------------------------------


nextInit(); // start everything