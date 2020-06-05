"use strict";


(async function() {

var idGen = ()=>global.idGen( );


var DB = exports = module.exports = {};
const sack = require( 'sack.vfs');
const disk = sack.Volume();
const storage = sack.ObjectStorage( "userdatabase.~os" );
const fileRoot = await storage.getRoot();
const bloomHash = require( "./bloomNHash.js" );
let  userAccounts = null;

// revive "bnh"
bloomHash.hook( storage );


if( "undefined" === typeof config )
	var config = {
		commit() {
			console.log( "SAVE CONFIG" );
			configFile.write( config );
		}
	};


function InitAccounts() {
	userAccounts = bloomHash();
	userAccounts.store().then( (id)=>{
		config.userAccounts = userAccounts;
		console.log( "USER ACCOUNTS SHOULD BE SAVED....", id );
		config.commit(); // just store direct referece?
		// debug - make some accounts.
		asdf();
	} );
}

const configFile = await fileRoot.open( "config.jsox" ).catch( ()=>{ 
	const file = fileRoot.create( "config.jsox" )
	InitAccounts();
	return file;
} ).then( (file)=>( file.read().then(
		(data)=>{
			if( data.userAccounts ) {
				storage.map( data ).then( (data)=>{
					config.userAccounts = data.userAccounts;
					//Object.assign( config, data);
					if( config.userAccounts ) {
						// it has to delay (potentially)
						config.userAccounts.get( 'd3x0r' ).then( (val)=>{
							console.log( "WHAT IF I JUST GO AHEAD AND USED IT?", val );
						} );
					} else
						InitAccounts();
				} );
			} else
				InitAccounts();
		}),  file ) ) ;


// create some fake user accounts
function asdf() {

	let uzr = {	account:"d3x0r", password:"password", email:"email@nowhere.net"   };
	storage.put( uzr );

	userAccounts.set( "d3x0r", uzr );

	for( var n = 0; n < 20; n++ ) {
		uzr = {	account:"user"+n, password:"pass"+n, email:"email"+n   };
		storage.put( uzr );
		userAccounts.set( uzr.account, uzr ); // set implicitly puts
	}


}

function setup() {

	return;


	var logins = new Map(); // cache, for login timers, close notifications to services...


	var userMap = new Map(); // cache some users...
	var curPage = 0;
	var userPages = [ [] ];

	function pageUser( user ) {
		userPages[curPage].push( user );
		if( userPages[curPage].length < 1 ) {
			
		}
	}

	function User( name, email, pass ) {
		if( name && email && pass ) {
			if( !(this instanceof "User" ) ) return new User( name, email, pass );
			this.name= name;
			this.email=email;
			this.pass=pass;
			const now = new Date();
			this.access = new Access( null, now.setDay( now.getDay()+30 ), true );
			storage.put( this ).then( (id)=>{
				// do I care? Yes, add to userpages...
				
			} );
		} else {
			this.name = null;
			this.email = null;
			this.pass = null;
			// content gets filled in later...
		}
	}

	storage.addEncoders( [ { tag:"u", p:User, f:null } ] );
	storage.addDecoders( [ { tag:"u", p:User, f:null } ] );


	function Service( name  ) {
		if( name ) {
			if( !(this instanceof "Service" ) ) return new Service( name );
			this.name= name;
			storage.put( this ).then( (id)=>{
				// do I care? Yes, add to userpages...
				
			} );
		} else {
			this.name = null;
			// content gets filled in later...
		}
	}


	function Access( a, until, status ) {
		if( status && until ) {
			this.priorAccess = null;
			this.status = status;
			this.until = until ;
			storage.put( this );
			return;
		}
		else if( a instanceof Access ) {
			this.priorAccess = a;
			this.status = status;
			this.until = until ;
			storage.put( this );
		} else {
			this.priorAccess = null;
			this.status = 0;
			this.until = null;
		}
	}
	Access.prototype.new = function(until, status) {
		new Accesss( this, status );
	}

	function Login( address ) {
		if( address ) {
			this.login = new Date(); // now.
			this.address = address;
			storage.put( this );
		}else {
			this.login = null;
			this.address = null;
		}
	}



DB.createUser = createUser;
DB.updateUser = updateUser;
DB.authUser = authUser;

function createUser( ) {
}

function createUser( username, email, password ) {
	if( !email) email = "DoNotCall@localhost";
	if( !password ) password = true;
	if( !username ) throw new Error( "Must at least specify a username!" );	
	return new User();
}


function checkUserName( username ) {
	const existing = userMap.get( username );
	if( !existing ) {
		
	}

	return db.do( `select count(*) from user where name='${db.escape(username)}'` ) === 0;
}



DB.loginUser = (username,pass,req,address,oldcid, sendOk )=>{
	var result = null;
	//console.log( "LOGIN USER", user );
	var user = users.find( u=>u.email===username );
	if( user ) {
		var user = db.do( `select 1 from user where passhash=encrypt('${db.escape(pass)}' and user_id='${user.user_id}'`);
		if( user.length === 0 )
			return false;
	}
	else {
		var user = db.do( `select user_id,email from user where passhash=encrypt('${db.escape(pass)}' and email='${db.escape(username)}'`);
		if( user.length === 0 ) {
			return false;
		}
		user = user[0];
		// cache this user.
		users.push( user );
	}



	{
		var fail1 = false;
		if( req.find( r=>( r in services )?!user.services.find( up=>services[r].service_id===up.service_id ):(fail1=true) ) ) {
			if( fail1 )
				console.log( "requested service didn't exist... no user can match" )
			console.log( "service search failure...", req, user.services );
			return false
		}
	}

		if( user.login ) {
			// there is already a login; a confirmation?
			if( user.login.address !== address ){
				// conflict of logins....
			}else {
				// migth still be a conflict of logins.
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
	if( sendOk ) sendOk( user.login.key );

	return true;

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

}

})() // end async function wrapper; and run the function