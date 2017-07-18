
var sack = require( "./sack_psi_module.js" );
// this has to be loaded in order to get the Intershell export... so...
//sack.System.load( "intershell.core" );

var button = sack.Intershell.Button( "JS Button1" );
console.log( "button is", button, Object.getPrototypeOf( button ) );
button.setCreate( (button)=> { 
       // button.setText( "Some Caption; general." );
       // button.setStyle( "bicolor-square" );
        
        
	console.log( "button create called." ); 
        return { self : button }; 
    } )
button.setClick( (state)=> { 
     	console.log( "button has been clicked" );
        return true; 
} )
    


console.log( "..." );
var control = sack.Intershell.Control( "JS Control" );
console.log( "...", control, Object.getPrototypeOf( control ) );
control.setCreate( (control)=> { 
	console.log( "control create called." ); 
        
        
        return {state:true}; 
        
});
        console.log( "..." );
        control.registration.setDraw( (image,state)=> { 
        	console.log( "control wants to be drawn" ); 
                return true; 
        } )
        control.registration.setMouse( (event,state)=> { 
        	console.log( "control mouse", event.x, event.y, event.b ); 
                return true; 
        } )
        console.log( "..." );
        control.registration.setKey( (key,state)=> { 
        	console.log( "control mouse", event.x, event.y, event.b ); 
        	return true; 
        } )
        control.setLoad( (configHandler)=> { 
        	console.log( "control reload setup" ); 
                configHandler.addMethod( "some text match %w With Substs"
                	, ( a )=>{
                        	console.log( "Load handler called with", a );
                        } );
        } )
        control.setSave( (out, state)=> { 
        	console.log( "save control information" ); 
        	out.write( "some text match Watermelon With Substs\n" );
        } )


console.log( "..." );
sack.Intershell.setLoad( (configHandler)=>{ 
	/* setup global load */ 
} );
sack.Intershell.setSave( (out)=>{ 
	/* save information to global */ 
} );

//sack.Intershell.setPageChange( ()=>{ /* page has been changed */ } );

sack.Intershell.start();

console.log( "done" );
