
var psi = {
	Display : function() {
        	if( new.target )
                	var display = new.target;
                else var display = {};
                
                display.element = document.createElement( "div" );
                display.element.style.position = "absolute";
                display.element.style.width = "100%";
                display.element.style.height = "100%";
                
                display.Control = ( type, x,y,w,h)=>{
			if( typeof a === "string" ) {
        			if( a === "button" ) {
		                	return Button( display, b, undefined, w, h );
                		}
		        }
                	return _Control( display, x, y, w, h );
                };
                display.show = ()=>display.element.parent?document.body.appendChild( display.element ):display.element.style.visiblity="visible";
                display.hide = display.element.style.visibility = "hidden";
                
        }
}

var fakex = 0, fakey = 0;
function _Control( display, x,y,w,h ) {
        var control;
      	if( new.target ) control = new.target;
        else control = {};

        console.log( "this is canvas" );
        var control.element = document.createElement( "canvas" );
        button.element.style.position="absolute";
        if( typeof x  === "number" || typeof x === "string" ) {
	        button.element.style.left = x;
	        button.element.style.top = y;
	        button.element.style.width = w;
        	button.element.style.height = h;
        }else {
                button.element.style.top =  (fakex * 5)+ "%";
                button.element.style.left =  (fakex * 5)+ "%";
	        button.element.style.width = "25%";
        	button.element.style.height = "10%";
                if( ++fakex > 14 ) {
                	fakex = 0;
                        if( ++fakey > 18 ) fakey = 0; 
                }
         }
         
         
        display.element.appendChild( control.element );
        
	return control;
}

var Button = (display, text,click,w,h)=>{ 
      	if( new.target ) var button = new.target;
        else var button = {};
        button.element = document.createElement( "button" );
        button.element.style.position="absolute";
        button.element.style.width = w|| "25%";
        button.element.style.width = h|| "10%";
                
        button.element.addEventListener( "click", click );
        
        display.element.appendChild( button.element );
	return button;
}
