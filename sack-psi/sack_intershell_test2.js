
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
var control = sack.Intershell.Custom( "JS Custom Control" );

console.log( "...", control, Object.getPrototypeOf( control ) );

control.setCreate( (control)=> { 
	console.log( "control create called.", control ); 
	var cons = control.parent.Control( "PSI Console" );
        console.log( "create a control?", cons );
        
        return {state:true}; 
        
});



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
