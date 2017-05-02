"use strict"



var idGen = ()=>global.idGen( );


var DB = exports = module.exports = {};

var vfs = require( 'sack.vfs');

if( !("udb" in config) ) {
	config.udb = { runkey: idGen() };
	config.commit();
}

DB.data = vfs.Volume( null, "./data.fs", config.udb.runkey, me );
console.log( "vol is:", DB.data );
var db = DB.db = DB.data.Sqlite( "core.db" );  

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

db.makeTable( "create table user ( user_id char PRIMARY KEY"
	+", name char"
	+", email char"
	+", passHash char"
	+")" 
        );
db.makeTable( "create table services ( service_id char PRIMARY KEY"
	+", name char" );
	/*
db.makeTable( "create table userPerm ( user_perm_id char PRIMARY KEY"
	+", user_id char"
	+", perm_id char"
	+", CONSTRAINT a FOREIGN KEY( user_id ) REFERENCES user(user_id)"
	+", CONSTRAINT b FOREIGN KEY( perm_id ) REFERENCES permission(perm_id))" );
*/
db.makeTable( "create table subscriptions ( sub_id char PRIMARY KEY"
	+", user_id char"
	+", service_id char"
	+", CONSTRAINT a FOREIGN KEY( user_id ) REFERENCES user(user_id)"
	+", CONSTRAINT b FOREIGN KEY( service_id ) REFERENCES services(service_id))" );

db.makeTable( "create table userLogin ( user_login_id char PRIMARY KEY"
	+", user_id char"
	+", loggedOut int default '0'"
	+", login TIMESTAMP DEFAULT CURRENT_TIMESTAMP "
	+", address char"
	+", client_id char"
	+", INDEX userkey(client_id,address,loggedOut)"
	+", CONSTRAINT a FOREIGN KEY( user_id ) REFERENCES user(user_id))" );
//console.log( db.do( "select * from userLogin" ) );

var services = db.do( 'select * from services')
//console.log( "permissions:", permissions )

if( services.length === 0 ) {
	var userId;
	db.do( `insert into user (user_id,name,email,passHash)values("${userId=idGen()}","root","root@d3x0r.chatment.karaway.net",encrypt("changeme"))`)
	var core_id;	                                                       	
	db.do( `insert into services(service_id,name)values ("${core_id=idGen()}","c0r3")` );
	services = db.do( 'select * from services');
	
	console.log( "doing insert into subscriptions.... sohould get values back??")
	db.do( `insert into subscriptions (sub_id,user_id,service_id) values ('${idGen()}','${userId}','${core_id}')` )

}
services.forEach( p=>(services[p.name]=p) );
//console.log( "permissions:", permissions )

function dontLoadAll() 
{
	users = db.do( 'select decrypt(passHash)password,* from user' );
	users.forEach( user=>{
		user.services = db.do( "select * from subscriptions where user_id='"+user.user_id+"'" );
		user.services.forEach(  up=>{ 
			var s = services.find( p=>{ return (p.service_id===up.service_id )});
			if( s ) 
				up.name=s.name 
			else {
				up.name = "Unknown";
				console.log( "Failed to find ", up, "in", services );
				throw new Error( "Database is corrupt" );
			}
		} );
	})

}
//console.log( "permissions is: ", permissions );

DB.createUser = createUser;
DB.updateUser = updateUser;
DB.authUser = authUser;

function createUser( ) {
	var userId;
	db.do( `insert into user (user_id)values("${userId=idGen()}")`)
	return userId;
}

function updateUser( userId, username, email, password ) {
	var userId;
	db.do( `update user set user='${db.escape(username)}',email='${db.escape(email)}',password=encrypt("${password}" where user_id='${userId}'`);
	return userId;
}


function checkUserName( username ) {
	return db.do( `select count(*) from user where name='${db.escape(username)}'` ) === 0;
}

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
	var login = db.do( `select sha2('RandomPaddingHere'||user_login_id)key,user_login_id id from userLogin WHERE address="${remote}" AND loggedOut=0 AND DATETIME(login)>${config.login.maxLoginLength} AND client_id="${clientkey}"`)
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

DB.connect = (gun)=>{
	console.log( "Update gun databases?? passed a gun instance to do SOMETHING with...")
}

