"use strict"

const entity_ = entity;

var gunWs = null;
var gunWsConn = null;



function hash(v) {
		console.log( "hash", v );
  var shasum = crypto.createHash('sha1');
	shasum.update(v);
	return shasum.digest('hex');
}

/* this should already be resolved somehow?" */

var DB = exports = module.exports = {};

var vfs = await require( 'sack.vfs');

async function startup() {

if( !( "svcDb" in config ) ) {
	config.svcDb = { vol : await entity_.idGen() };
}

var opdb = disk.Sqlite( `option.db` );
if( !opdb ) 
	opdb = disk.Sqlite( "svcdb.db" );
console.log( "vfs?", opdb );
var vol = opdb.op( "vol", await entity_.idGen() );
vol = config.svcDb.vol;
console.log( "service servicedb do vol:", vol );
//DB.data = disk.Volume( vol, vol/*, me*/ );
if( DB.data ) {

io.addProtocol( "serviceAuth", setupServiceAuth );

	console.log( "Data is:", Object.keys( DB.data ));
	var db = DB.db = DB.data.Sqlite( `services.db` );

db.do( 'PRAGMA foreign_keys=ON' );

db.makeTable( "create table serviceLogin ( service_login_id char PRIMARY KEY"
	+", name char"
	+", authorized int default '0'"
	+", registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP "
	+", address char"
	+", client_id char"
	+", INDEX servicekey(client_id)"  );

function setupServiceAuth( ws ) {
    ws.on( "message", async (msg)=>{
		if( msg.op === "serviceLogin" ) {
			//console.log( "from who? ", connection.remoteAddress );
			var a;
			a = msg.id; 
			if( !a ) a = msg.key;
			console.log( "... get service" );
			connection.login = db.getServiceLogin( connection.remoteAddress, a );
			//console.log( "login is", connection.login )
			if( connection.login ) {
				connection.login.connection = connection;
				console.log( "got back a service....")
				//connection.login.connection = connection;
				Object.defineProperty( connection.login, "connection", { enumerable:false, value:connection } )
				db.updateServiceLogin( connection.login );
			}
			if( connection.login && 
				connection.login.authorized ) {
				connection.send( `{"op":"setClientKey","key":"${connection.login.cid}"}`);
			} else
				connection.send( `{"op":"noLogin"}`);
		}
		else if( msg.op === "userLogin" ) {
			console.log( "USER LOGIN" );
			connection.login = db.loginUser( msg.username, msg.password, msg.require, connection.remoteAddress, connection.clientId, (oldLogin)=>{
				if( oldLogin.connection ) {
					oldLogin.connection.send( `{"op":"confirmLogout"}`); // reset client, login failed.
					return true;
				}
				return false;
			} );

			//console.log( "login result is:", connection.login );
			if( !connection.login )
				connection.send( `{"op":"newLogin"}`); // reset client, login failed.
			else {
				connection.send( `{"op":"setLogin","key":"${connection.login.key}"}`)
				connection.send( `{"op":"setClientKey","key":"${connection.login.cid}"}`)
			}
		}
		else if( msg.op === "getClientKey" ) {
			var client_id = await entity_.idGen();
			if( "name" in msg ) {
				connection.login = db.createServiceLogin( msg.name, connection.remoteAddress, client_id );
			}
			connection.send( `{"op":"setClientKey","key":"${client_id}"}`)
			console.log( "sending a proper key...", client_id )
		}
		else if( msg.op === "logout" ) {
			db.logout( connection.login.key )
		}
	});
}

//openGunWebSock();


DB.connect = (gun)=>{
	console.log( "Update gun databases!!!!!")
	var orgDef = gun.get( "orgDef" );
	//sites.forEach( )
	var siteDef = gun.get( "siteDef" );
	sites.forEach( s=>{ 
		console.log( "site:", s );
		var gunSite = gun.get( "siteDef:"+s.site_id );

		var o = {};
		gunSite.put( o[s.site_id] = { id:s.site_id,name:s.localName,address:s.address } );
		console.log( o );
		siteDef.put( o ); 
	} )
}



//--------------- Service Login/Authorization -------------------------------------


DB.loginService = async (client_id,username,address,oldcid, confirm )=>{
	var result = null;
	//console.log( "LOGIN USER", user );
	var service = serviceLogins.get( client_id );
	if( !service ) {
		var newClientId = await entity_.idGen();

		// might not have reloaded it, because it wasn't authorized yet...
		// but it could already exist.
		db.do( `delete from serviceLogin where service_login_id=${client_id}`)
		
		db.do( "insert into userLogin(service_login_id,name,address,client_id)values(?,?,?)", user.user_id,address,newClientId );
		//console.log( "inserted into thing.")
		//console.log( "resulting with a NEW SERVICE LOGIN HERE")
		result = { key:client_id
				, id:client_id
				, cid:newClientId
				, name: username
				, address: address
		};
		var o = {};
		o[client_id] = { name:result.name};
		//console.log( "ADD SERVICEDEF:", o )
		gunDb.get( "serviceDef" ).put( o );
		serviceLogins.set( address, result );
		serviceLogins.set( user.login.key, result );
		serviceLogins.set( user.login.cid, result );
	}
	else {
			if( confirm )
				if( confirm( service ) ) {
						// confirmation has been sent; the user appeared to still be alive...
						return;
					}
	}
	return result;
}


DB.getServiceLogin = ( remote, clientkey )=>{
	//console.log( 'logins', logins );
	var login = null;
	login = serviceLogins.get( clientkey );
	//console.log( "userLogins:", db.do( `select * from userLogin` ) );
	//console.log( "service login is : ", login, "for", remote, clientkey );
	if( !login ) {
		login = db.do( 'select service_login_id key,name,authorized,client_id from serviceLogin WHERE address=? AND service_login_id=?', remote, clientKey )
		console.log( 'logins is ....', login)
		if( login.length === 1 ) {
			
		console.log( "resulting with a NEW SERVICE LOGIN HERE")
			var result = { name: login[0].name,
					key:login[0].key,
					cid:login[0].client_id,
					address:remote,
					authorized:login[0].authorized,
				};
			//serviceLogins.set( remote, result );
			serviceLogins.set( result.key, result );
			serviceLogins.set( result.cid, result );
			return result;
		}
		else {
			if( login.length === 0 ) {
				console.log( "Create a login for this guy?")
			}
			else 
				console.log( "too many logins?", login )
		}
	}
	return login;
}


DB.updateServiceLogin = ( login )=>{
	//console.log( "userLogins:", db.do( `select * from userLogin` ) );
	var cid = idGen();
	var test = db.do( `update serviceLogin set client_id="${cid}" where client_id="${login.cid}"`)
	serviceLogins.delete( login.cid );
	//console.trace( "update login and someone will send this?", cid )
	login.cid = cid;
	serviceLogins.set( login.cid, login )
	return cid;
}


DB.createServiceLogin = ( name, address, client_id )=>{
	//console.log( "userLogins:", db.do( `select * from userLogin` ) );
	var newClientId = idGen();
	db.do( `delete from serviceLogin where service_login_id='${client_id}'`)
	db.do( `insert into serviceLogin(service_login_id,name,address,client_id)values('${client_id}','${name}','${address}','${newClientId}')`);
	console.log( 'resulting with a NEW SERVICE LOGIN HERE')
	var login = { name: name,
				key:client_id,
				cid:newClientId,
				address:address,
				authorized:false,
			};
	var o = {};
	o[login.key] = { name:result.name};
	//console.log( "ADD SERVICEDEF:", o )
	gunDb.get( "serviceDef" ).put( o );
			
	serviceLogins.set( login.key, login )
	return login;
}

DB.authorizeService = ( id ) => {
	var service = serviceLogins.get( id );
	//console.log( "Service Logins", serviceLogins )
	if( service ) {
		console.log( "service?", service );
		if( !Number(service.authorized) ) {
			console.log( "authorizing service." );
			service.authorized = true;
			{
				var cid = idGen();
				serviceLogins.delete( service.cid );
				//console.trace( "update login and someone will send this?", cid )
				service.cid = cid;
				serviceLogins.set( service.cid, service )
			}
				// this service has a connection?
				if( service.connection )
					service.connection.send( '{"op":"authorized","id":"' + cid + '"}')
				else	console.log( 'but connection is null?')
			db.do( `update serviceLogin set authorized=1,client_id='${cid}' where service_login_id='${id}'`);
			var o = {};
			o[service.key] = service;
			console.log( "UPDATE SERVICEDEF:", o )
			gunDb.get( "serviceDef" ).put( o );
		}
	}
	else
		console.log( "Failed to getservice?", service, id, serviceLogins );
}


DB.banService = ( id ) => {
	var service = serviceLogins.get( id );
	if( service ) {
		console.log( "got service:", service)
		if( Number(service.authorized) ) {
			console.log( "authorizing service." );
			service.authorized = false;
			{
				var cid = idGen();
				serviceLogins.delete( service.cid );
				console.trace( "(actually, this should not go back to the client; he's banned....and a current service request should fail) update login and someone will send this?", cid )
				service.cid = cid;
				serviceLogins.set( service.cid, service )
			}
			if( "connection" in service ) {
					console.log( "service has a connection..." );
			// this service has a connection?
				if( service.connection ) 
					service.connection.send( '{"op":"banned"}')
				else	
					console.log( "but the connection was null?" );
			}
			db.do( `update serviceLogin set authorized=0,client_id='${cid}' where service_login_id='${id}'`);
			var o = {};
			o[service.key] = service;
			console.log( "UPDATE SERVICEDEF:", o )
			gunDb.get( "serviceDef" ).put( o );
		}
	}
	else
		console.log( "Failed to getservice?", service, id, serviceLogins );
}

}

}
startup();