var Gun = require( "gun" );

var gun = new Gun();

	var orgDef = gun.get( "orgDef" );
      	var gunOrg = gun.get( orgkey = "orgDef:1" );
     	gunOrg.put( { id:1,name:"test" } );
      	orgDef.path( 1 ).put( gunOrg );
