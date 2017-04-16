"use strict"

var crypto = require('crypto')
var idGen = require( '../util/id_generator.js' ).generator;

function hash(v) {
	console.log( "hash", v );
  var shasum = crypto.createHash('sha1');
	shasum.update(v);
	return shasum.digest('hex');
}

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
db.makeTable( "create table permission ( perm_id INTEGER PRIMARY KEY AUTOINCREMENT"
	+", name char" );
db.makeTable( "create table userPerm ( user_perm_id INTEGER PRIMARY KEY AUTOINCREMENT"
	+", user_id int"
	+", perm_id int"
	+", CONSTRAINT a FOREIGN KEY( user_id ) REFERENCES user(user_id)"
	+", CONSTRAINT b FOREIGN KEY( perm_id ) REFERENCES permission(perm_id))" );

db.makeTable( "create table userLogin ( user_login_id INTEGER PRIMARY KEY AUTOINCREMENT"
	+", user_id int"
	+", loggedOut int default '0'"
	+", login TIMESTAMP DEFAULT CURRENT_TIMESTAMP "
	+", address char"
	+", client_id char"
	+", INDEX userkey(client_id,address,loggedOut)"
	+", CONSTRAINT a FOREIGN KEY( user_id ) REFERENCES user(user_id))" );
//console.log( db.do( "select * from userLogin" ) );

permissions = db.do( 'select * from permission')
//console.log( "permissions:", permissions )

if( permissions.length === 0 ) {
	db.do( 'insert into user (name,email,passHash)values("rootke",encrypt("password"))')
	var userId = db.do( "select last_insert_rowid() id" );
	db.do( 'insert into permission(name)values ("manager users"),("login allowed"),("create site"),("create user"),("login")' );
	permissions = db.do( 'select * from permission' );
	var vals = ""
	permissions.forEach( (perm)=>{ vals += `${vals.length?",":""}(${userId[0].id},${perm.perm_id})` })
	db.do( "insert into userPerm (user_id,perm_id) values" + vals )
}
permissions.forEach( p=>(permissions[p.name]=p) );
//console.log( "permissions:", permissions )


{
	users = db.do( 'select decrypt(passHash)password,* from user' );
	users.forEach( user=>{
		user.permissions = db.do( 'select * from userPerm where user_id='+user.user_id );
		user.permissions.forEach( up=>up.name=permissions.find( p=>{ return (p.perm_id===up.perm_id )}).name );
	})

	//console.log( 'users: ', users );
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
			if( req.find( r=>( r in permissions ) ) ) console.log( "SOKSDF" );
			var fail1 = false;
			if( req.find( r=>( r in permissions )?!user.permissions.find( up=>permissions[r].perm_id===up.perm_id ):(fail1=true) ) ) {
				if( fail1 )
					console.log( "requested permission didn't exist... no user can match" )
				console.log( "token search failure...", req, user.permissions );
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
			var newClientId = idGen();

			db.do( `update userLogin set loggedOut=1 where user_id=${user.user_id}`)
			
			db.do( `insert into userLogin(user_id,address,client_id)values(${user.user_id},"${address}","${newClientId}")`)
			var r = db.do( `select sha1(last_insert_rowid())n,last_insert_rowid()m ` );
			console.log( "inserted into thing.")
			result = user.login = { key:r[0].n, id:r[0].m, cid:newClientId };
			logins.set( user.login.key, createSite( user.login ) );
			return true;
		}
		return false;
	});

	if( !user ) console.log( "Bad User" );
	else {

	}
	return result;
}

DB.getLogin = ( remote, clientkey )=>{
	//console.log( "userLogins:", db.do( `select * from userLogin` ) );
	var login = db.do( `select sha1(user_login_id)key,user_login_id id from userLogin WHERE address="${remote}" AND loggedOut=0 AND DATETIME(login)>${config.gameConfig.maxLoginLength} AND client_id="${clientkey}"`)
	if( login.length === 1 ) {
		return {key:login[0].key,id:login[0].id,cid:clientkey};
	}
	else 
		console.log( "too many logins?  too few?", login )
	return null;
}

DB.updateLogin = ( login )=>{
	//console.log( "userLogins:", db.do( `select * from userLogin` ) );
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
	db.do( `update userLogin set loggedOut=1 where user_login_id=${login.login.id}`)
}

DB.getLogin = (key)=>{
	return logins.get( key );
}

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

