/* let's define an appropriate deep default database... */
var dfltSansUsers = {
	1: { 
		name : "org1",
		sites : { 
			1: { 
				name : "site1",
			},
			2: {
				name : "site2",
			},
		}
	},
	3: {
		name : "org3",
		sites : {
			5: {
				name : "site5",
			},
			7: {
				name : "site7",
			}
		}
	}
}

var dflt = {
	1: { 
		name : "org1",
		sites : { 
			1: { 
				name : "site1",
				users : {
					1: {
						name: "alice",
						boss : {}, // ** referenced later to betty; as an object
						siblings : { 
							mark : {} // ** see users org3, site 5
						}
					},
					2: { 
						name: "betty"
					}
				}
			},
			2: {
				name : "site2",
				users : { 
					1 : { 
						name : "charlie",
						boss : {} // ** referenced later to david }
					},
					2: { 
						name : "david"
					}
				}
			},
		}
	},
	3: {
		name : "org3",
		sites : {
			5: {
				name : "site5",
				users : {
					1 : {
						name : "edward"
					},
					2 : {
						name : "frank"
					},
					3 : {
						name : "mark"
					}
				}
			},
			7: {
				name : "site7",
				users : {
					1 : {
						name : "georgia"
					},
					2 : {
						name : "hank"
					}
				}
			}
		}
	}
}
/*
// these relations also exist.
dflt[1].sites[1].users[1].boss = dflt[1].sites[1].users[2];
dflt[1].sites[1].users[1].siblings.mark = dflt[3].sites[5].users[3];
dflt[1].sites[2].users[1].boss = dflt[1].sites[2].users[2];
*/


/* This can be done with...
var drvr = Gun();
drvr.get( "root" );
drvr.put( dflt );

*/

//var Gun = require( "gun" );
var Gun = require( "./evr" );

var gun = Gun();

var root2 = gun.get( "root2" );
root2.put( dflt );

root2.map().path( "sites" ).map().path( "users" ).map().on( showMeTheData );


var root = gun.get( "root" );

root.map( getData );

root.put( dfltSansUsers );

console.log( "data:", root._ )


function getData( val, field, alsoThis ) {
	if( typeof( val ) === "object" ) {
		var _this = gun.get( val )
		_this.map( getData );
		console.trace( "path event:", field, val );
	} else
		console.trace( "field event:", field, val );
}



var alice = gun.get( "alice" ).put( dflt[1].sites[1].users[1] );
var betty = gun.get( "betty" ).put( dflt[1].sites[1].users[2] );
var charlie = gun.get( "charlie" ).put( dflt[1].sites[2].users[1] );
var david = gun.get( "david" ).put( dflt[1].sites[2].users[2] );

var edward = gun.get( "david" ).put( dflt[3].sites[5].users[1] );
var frank = gun.get( "david" ).put( dflt[3].sites[5].users[2] );
var mark = gun.get( "mark" ).put( dflt[3].sites[5].users[3] );

var georgia = gun.get( "david" ).put( dflt[3].sites[7].users[1] );
var hank = gun.get( "hank" ).put( dflt[3].sites[7].users[2] );


root.path( "1.sites.1.users" ).put( { 1: alice } );

root.path( "1.sites.1.users" ).put( { 2: betty } );
root.path( "1.sites.2.users" ).put( { 1: charlie } );
root.path( "1.sites.2.users" ).put( { 2: david } );
root.path( "3.sites.5.users" ).put( { 1: edward } );
root.path( "3.sites.5.users" ).put( { 2: frank } );
root.path( "3.sites.5.users" ).put( { 3: mark } );
root.path( "3.sites.7.users" ).put( { 1: georgia } );
root.path( "3.sites.7.users" ).put( { 2: hank } );

console.log( "data:", root._ )

root.map().path( "sites" ).map().path( "users" ).map().on( showMeTheData );

function showMeTheData( val, field ) {
	console.log( "Data!:", field,"=", val );
}
function showMeTheData1( val, field ) {
	console.log( "Data1:", field,"=", val );
}
function showMeTheData2( val, field ) {
	console.log( "Data2:", field,"=", val );
}
//gun.

console.log( "put default data..." );

var bossref = gun.get( "root" ).path( "1.sites.1.users.2" );
console.log( "got a ref?" );

gun.get( "root" ).path( "1.sites.1.users.1.boss" ).put( bossref );
console.log( "put the ref out?" );
// or
//gun.get( "root" ).path( "1.sites.1.users.1.boss" ).put( bossref );

var bossref = gun.get( "root" ).path( "1.sites.2.users.2" );
gun.get( "root" ).path( "1.sites.2.users.1" ).put( { boss : bossref } );

var bossref = gun.get( "root" ).path( "3.sites.5.users.3" );
gun.get( "root" ).path( "1.sites.1.users.1.siblings" ).put( { mark : bossref } );

