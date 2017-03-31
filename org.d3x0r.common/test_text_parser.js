"use strict";
var text = require( "./text.js" );
var command = text.Parse( "/create mary had a little lamb, it's fleece was white as snow" );
//var command = text.Parse( "mary had a little lamb, it's fleece was white as snow" );

console.log( "command : ", command)
if( command ) {
		//if( recording ) {
		//}
		//else
		 if( command.text === "/" )
		{
			console.log( "command ", String( command ) );
		        console.log( command.next.text );
			var cmd = command.next.text;
			if( cmd === 'create' ) {
				// do something with the rest of the words...
				// would pass a wordref to this point?
				var x = command.next.next;
				var s = "";
				while( x ) { s += (s.length?" ":"") + x.text; x = x.next;} 
				console.log( s );
			}
			if( cmd === 'Mary' ) {
				console.log( "Marry ");
			}
			if( cmd === 'mary' ) {
				console.log( "Marry ");
			}
		}
		else
		{
			console.log( "send_data '", String(command), "'" );
		}
}
