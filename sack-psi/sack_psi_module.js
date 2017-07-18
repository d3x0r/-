
var psi;
try { psi = require( './build/Debug/sack_psi_module.node' ) }
catch( err ) { console.log( err); psi = require( './build/Release/sack_psi_module.node' ) }
var events = require( 'events' );

//console.log( "got", psi );

var PSI = exports = module.exports = {
	
	controlTypes : [ "Frame","Undefined","SubFrame","TextControl","Button",
		"CustomDrawnButton","ImageButton","CheckButton","EditControl",
		"Slider","ListBox","ScrollBar","Gridbox" ,"Console" ,"SheetControl",
		"Combo Box" ],
	Sqlite       : (...args)=>psi.Sqlite(...args),
        Volume       : (...args)=>psi.Volume(...args),
        Intershell   : psi.InterShell,
        Registration : (...args)=>psi.Registration(...args),
	Frame        : (...args)=>psi.Frame(...args),
        Image        : (...args)=>psi.Image(...args),
        Renderer     : (...args)=>{
		var r = psi.Renderer(...args);
		r.on = (event,cb)=>{
			if( event == "draw" )
				r.setDraw( cb );
			else if( event == "mouse" )
				r.setMouse( cb );
		};
		return r;
	},
        button : { left : 1, right : 2, middle : 16, scroll_down : 256, scroll_up : 512 },
}


Object.freeze( PSI.button );
Object.freeze( PSI.controlTypes );
