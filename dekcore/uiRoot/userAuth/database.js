"use strict"

var IdGen = require( '../util/id_generator.js' );
var idGen = idGen.generator;
var config = require( './config.json' );
var DB = exports = module.exports = {};

var vfs = require( 'sack.vfs');

DB.data = vfs.Volume( "data", "./data.fs", config.run.Λ, idMan.localKey() );
var db = DB.db = vfs.Sqlite( "$sack@data$core.db" );  

var logins = new Map();

function createSite( login ) {
	return { login: login };
}

var orgs = null;
var sites = null;
var charities = null;

var users = null;
var permissions = null;

db.do( 'PRAGMA foreign_keys=ON' );

db.makeTable( "create table user ( user_id INTEGER PRIMARY KEY AUTOINCREMENT"
	+", name char"
	+", email char"
	+", passHash char"
	+")" 
        );
db.makeTable( "create table services ( service_id char PRIMARY KEY"
	+", name char" );
db.makeTable( "create table userPerm ( user_perm_id char PRIMARY KEY"
	+", user_id char"
	+", perm_id char"
	+", CONSTRAINT a FOREIGN KEY( user_id ) REFERENCES user(user_id)"
	+", CONSTRAINT b FOREIGN KEY( perm_id ) REFERENCES permission(perm_id))" );

db.makeTable( "create table userServiceConnections ( user_svc_id char PRIMARY KEY"
	+", user_id char"
	+", svc_id char"
	+", CONSTRAINT a FOREIGN KEY( user_id ) REFERENCES user(user_id)"
	+", CONSTRAINT b FOREIGN KEY( perm_id ) REFERENCES permission(perm_id))" );

db.makeTable( "create table userLogin ( user_login_id char PRIMARY KEY"
	+", user_id char"
	+", loggedOut int default '0'"
	+", login TIMESTAMP DEFAULT CURRENT_TIMESTAMP "
	+", address char"
	+", client_id char"
	+", INDEX userkey(client_id,address,loggedOut)"
	+", CONSTRAINT a FOREIGN KEY( user_id ) REFERENCES user(user_id))" );
//console.log( db.do( "select * from userLogin" ) );

permissions = db.do( 'select * from permission')
//console.log( "permissions:", permissions )

if( service.length === 0 ) {
	var userId;
	db.do( 'insert into user (user_id,name,email,passHash)values("${userId=idGen()}","root","root@d3x0r.chatment.karaway.net",encrypt("changeme"))')
	var core_id;	                                                       	
	db.do( 'insert into service(service_id,name)values ("${core_id=idGen()}","c0r3")' );
	db.do( `insert into subscriptions (user_id,service_id) values (${userId},${core_id})` )

}
permissions.forEach( p=>(permissions[p.name]=p) );
//console.log( "permissions:", permissions )


{
	users = db.do( 'select decrypt(passHash)password,* from user' );
	users.forEach( user=>{
		user.services = db.do( 'select * from subscriptions where user_id='+user.user_id );
		user.services.forEach( up=>up.name=services.find( p=>{ return (p.service_id===up.service_id )}).name );
	})

}
//console.log( "permissions is: ", permissions );

DB.authUser = authUser;

DB.loginUser = (username,pass,req,address,oldcid, confirm )=>{
	var result = null;
	//console.log( "LOGIN USER", user );
	var user = users.find( user=>{
		//console.log( "test user:" , user );
		if( user.name === username  ) {
			if( user.password !== pass ) {
				console.log( "password failure, Duh." );
				return false;
			}
			console.log( "find required tokens for user ");

			// req is requested service?			

			//if( req.find( r=>( r in permissions ) ) ) console.log( "SOKSDF" );
			var fail1 = false;
			if( req.find( r=>( r in services )?!user.services.find( up=>services[r].service_id===up.service_id ):(fail1=true) ) ) {
				if( fail1 )
					console.log( "requested service didn't exist... no user can match" )
				console.log( "service search failure...", req, user.services );
				return false
			}
			if( user.login ) {
				if( confirm )
					if( confirm( user.login ) ) {
						// confirmation has been sent; the user appeared to still be alive...
						return;
					}
					// else the client wasn't actually connected, just log it out.
			}

			db.do( `update userLogin set loggedOut=1 where user_id='${user.user_id}'`)
			var login_id;  // constant key		
			var client_id;  // rotating key
			db.do( `insert into userLogin(login_id,user_id,address,client_id)values('${login_id=idGen()}','${user.user_id}',"${address}",'${client_id=idGen()}')`)
			console.log( "inserted into thing.")
			var hash_id = IdGen.xor( config.run.Λ, login_id );
			result = user.login = { id:login_id, key:hash_id, cid:client_id };

			logins.set( user.login.key, user );
			return true;
		}
		return false;
	});

	if( !user ) console.log( "Bad User" );
	else {

	}
	return result;
}

DB.getLogin = ( service, remote, clientkey )=>{
	//console.log( "userLogins:", db.do( `select * from userLogin` ) );
	var login = db.do( `select sha2('RandomPaddingHere'||user_login_id)key,user_login_id id from userLogin WHERE address="${remote}" AND loggedOut=0 AND DATETIME(login)>${config.gameConfig.maxLoginLength} AND client_id="${clientkey}"`)
	if( login.length === 1 ) {
		return {key:login[0].key,id:login[0].id,cid:clientkey};
	}
	else 
		console.log( "too many logins?  too few?", login )
	return null;
}

DB.updateLogin = ( login )=>{
	var cid = idGen();
	var test = db.do( `update userLogin set client_id="${cid}" where client_id="${login.cid}"`)
	login.cid = cid;
	return cid;
}

function authUser( user, password, token ) {
	return users.find( user=>{
		if( user.name === user && user.password === password  ) {
			if( token.find( t=>!permissions.find( p=>p===t ) ) )
				return false;
			return true;
		}
		return false;
	});
}

DB.logout = (sessionkey)=>{
	var login = logins.get( sessionkey );
	if( login )
		db.do( `update userLogin set loggedOut=1 where user_login_id=${login.login.id}`)
}

DB.getSite = (key)=>{
	return logins.get( key );
}

DB.connect = (gun)=>{
	console.log( "Update gun databases?? passed a gun instance to do SOMETHING with...")
}

