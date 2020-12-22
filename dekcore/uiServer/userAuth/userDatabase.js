"use strict";


(async function() {

//var idGen = ()=>global.idGen( );


var DB = exports = module.exports = {};
//const sack = require( 'sack.vfs');
console.log( "Sack:", sack );
const disk = sack.Volume();
const storage = sack.ObjectStorage( "userdatabase.~os" );
const fileRoot = await storage.getRoot();
const bloomHash = await require( "./bloomNHash.js" );
let  userAccounts = null;

doLog( "Bloom hash??!", bloomHash );
// revive "bnh"
bloomHash.hook( storage );


	setup();

async function setup() {


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
	} ).then( (file)=>( file.read().then( storage.map ).then(
		(data)=>{
			if( data && data.userAccounts ) {
				config.userAccounts = data.userAccounts;
				//Object.assign( config, data);
				if( config.userAccounts ) {
					// it has to delay (potentially)
					config.userAccounts.get( 'd3x0r' ).then( (val)=>{
						console.log( "WHAT IF I JUST GO AHEAD AND USED IT?(1)", val );
					} );
					config.userAccounts.get( 'user260' ).then( (val)=>{
						console.log( "WHAT IF I JUST GO AHEAD AND USED IT?(2)", val );
					} );
					config.userAccounts.get( 'user270' ).then( (val)=>{
						console.log( "WHAT IF I JUST GO AHEAD AND USED IT?(2)", val );
					} );
				} else
					InitAccounts();
			} else
				InitAccounts();
		}),  file ) ) ;


	// create some fake user accounts
	function asdf() {

		let uzr;
		var n = 0;
	
		for( var n = 0; n < 280; n++ ) {
			const uzr = new User( "user"+n, "pass"+n, "email"+n );
			userAccounts.set( uzr.account, uzr )
		}

		{
			const uzr = new User( "d3x0r", "password", "email@nowhere.net" );
			userAccounts.set( "d3x0r", uzr );
		}
	}


	DB.createUser = createUser;
	//DB.updateUser = updateUser;
	DB.authUser = authUser;


	const logins = new Map(); // cache, for login timers, close notifications to services...
	const userMap = new Map(); // cache some users...

	return;



	function Profile( user ) {
		this.informations = new Map();
		const now = new Date();
		this.informations.set( "access", new Access( null, now.setDate( now.getDate()+30 ), true ) );
	}

	function User( name, email, pass ) {
		if( name && email && pass ) {
			if( !(this instanceof User ) ) return new User( name, email, pass );
			this.name= name;
			this.email=email;
			this.pass=sack.id( "passwordHash:"+pass, 3 );
			this.uid = null;
			this.profile = new Profile();
			storage.put( this.profile ).then( (id)=>{
				storage.put( this ).then( (id)=>{
					this.uid = id;
					storage.put( this );
					// do I care? Yes, add to userpages...
					config.userAccounts.set( this.name, this );
				} );
			} );
		} else {
			this.name = null;
			this.email = null;
			this.pass = null;
			this.uid = null;
			this.profile = null;
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

	function Login( user, address ) {
		if( user instanceof Login ) {
			this.user = user.user;
			this.login = new Date();
			if( address ) 
				this.address = address;
			else
				this.address = user.address;
			this.prior = user;
			storage.put( this );
		}
		else
			if( address ) {
				this.user = user;
				this.login = new Date(); // now.
				this.address = address;
				this.prior = null;
				storage.put( this );
			}else {
				this.user = null;
				this.login = null;
				this.address = null;
				this.prior = null;
			}
	}
	Login.prototype.chain() = function() {
		return new Login( this )
	}



	function createUser( username, email, password ) {
		if( !email) email = "DoNotCall@localhost";
		if( !password ) password = true;
		if( !username ) throw new Error( "Must at least specify a username!" );	
		return new User( username, email, password );
	}


	function checkUserName( username ) {
		return config.userAccounts.get( username ).then( (account)=>!!account )
	}



	DB.loginUser = (username,pass,address,oldcid )=>config.userAccounts.get( username ).then( (user)=>{
		if( sack.id( pass, 3 ) === user.password ) {
			const history = user.profile.get( "logins" );
			let login;
			if( history )
				login = new Login( history, address );
			else
				login = new Login( user, address );
			user.profile.set( "logins", login );
			storage.put( user.profile );
			return storage.put( history );
		} else {
			return null;
		}
	} );


	DB.updateLogin = ( login )=>{
		var l = logins.get( login );
	
		l.user.profile.set( "logins", new Login( l.user.profile.get( login ) ) )
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


}

})() // end async function wrapper; and run the function
