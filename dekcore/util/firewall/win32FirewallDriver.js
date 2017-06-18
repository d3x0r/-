const cp = require( 'child_process' );
const config = require( '../../config.js' );


exports.reset = function( ) {
	console.log( "Reset the firewall." );
}


exports.route = function( from, destport, targetPort ) {
	console.log( "Addint a route to the firewall." );
}

exports.removeRule = function( rule ) {
	//if( rule.block ) {
		cp.exec( `netsh advfirewall delete rule name="${rule.rule_id}"`
		       , (error,stdout,stderr)=>{
				   console.log( "netsh add rule result:", error, "\nstdout:", stdout, "\nstderr:", stderr);
			   });
	//}

}

exports.addRule = function( rule ) {
	if( rule.allow ) {
		cp.exec( `netsh interface portproxy add v4tov4 listenport=${rule.source} connectport=${rule.dest_port}`
		       , (error,stdout,stderr)=>{
				   console.log( "netsh add rule result:", error, "\nstdout:", stdout, "\nstderr:", stderr);
			   });
	} else {
		cp.exec( `netsh advfirewall add rule name="${rule.rule_id}" dir='in' action='block' remoteip=${rule.source} localport=${rule.dest_port}`
		       , (error,stdout,stderr)=>{
				   console.log( "netsh add rule result:", error, "\nstdout:", stdout, "\nstderr:", stderr);
			   });

	}
}
