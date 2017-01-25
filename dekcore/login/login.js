"use strict";

// basically just show a form that has usernmae, password, and a return button.

var DOM_text;
var display;
var buttonStates = {};



var ws = new WebSocket( `wss://${location.host}/auth?user="ya?"` );
function applyWsEvents(ws) {

ws.onopen= ()=>{ ws.send( "Connected" ); };
ws.onmessage= (msg)=>{ 
	if( msg.data.startsWith( "redirect" ) ) {
        	var parts = msg.split( " " );
                ws = new WebSocket( `wss://${parts[1]}/${parts[2]}` );
                applyWsEvents( ws );
        }
        else
		console.log( "received a message: ", msg ); };
}
applyWsEvents( ws );

window.onload = ()=> {


	DOM_text = document.createElement("div");
	DOM_text.innerHTML = "Loading... 0%";
	DOM_text.style.background = "rgba(255,255,255,0.5)";
	DOM_text.style.color = "#000000";
	document.body.appendChild( DOM_text );


	display = document.createElement( "div" );
	display.style.position = "absolute";
	display.style.width = "100%";
	display.style.height = "100%";
        document.body.appendChild( display );

buttonStates.up=newImage("login/button_Up.png");
buttonStates.down=newImage("login/button_Down.png");
buttonStates.roll=newImage("login/button_Rollover.png");

}

function wrap( x, w, h, left, top ) {
  var c =  document.createElement( "div" );
	c = document.createElement( "div" );
	c.style.display = "inline-block"
	c.style.margin = 0;
	c.style.position = "absolute";
	c.style.width = w + "px";
	c.style.height = h + "px";
	c.style.left = left;
	c.style.top = top;
	c.width = w ;
	c.height = h;
        c.inner = x;
        x.style.width="100%";
        x.style.height="100%";
	c.appendChild( x );

	display.appendChild( c );
        return c;
  }
  



var requiredImages = [];
var maxRequired = 0;


function newImage(src) {  var i = new Image(); i.src = src; 
console.log( "src is ", src );
	requiredImages.push( i ); 
	maxRequired++;
	i.onload = ()=>{ 
			requiredImages.pop( i ); 
                        var val = (100 - 100*requiredImages.length / maxRequired );
			DOM_text.innerHTML = "Loading... " + val;
                        if( val == 100 ) DOM_text.style.visibility = "hidden";
			if( requiredImages == 0 ) doWork(); };
	return i;}
	


function MakeStyle( name, normal, pressed, rollover ) {
	var style = { 
		normalLens : normal.src
		, pressedLens : pressed.src
		, hoverLens : rollover.src
	}
	console.log( style.normalLens );
	styles[name]= style;
	return style;
}

var styles = [];
function getStyle( name ) {
	return styles[name];
}

function MakeButton( style, w, h ) {
	var button = { style : style 
			, pressed : new Image()
			, depressed : new Image()
			, rollover : new Image()
			, text : document.createElement( "div" )
			, highlight : false
			, isDown : false
			, setText : ( newText ) => {
				button.text.innerHTML = newText;
			}
			, element : null
			, setPressed : ()=> {
				button.element.replaceChild( button.pressed, button.element.childNodes[0] ); 
				button.isDown = true;
			}
			, setDepressed : ()=> {
				button.element.replaceChild( button.depressed, button.element.childNodes[0] ); 
				button.isDown = false;
			}
			, setHighlight: ( enable )=> {
				button.element.replaceChild( button.rollover, button.element.childNodes[0] ); 
			}
		};
		console.log( style.pressedLens );
                
	button.pressed.src =style.pressedLens;
	button.pressed.draggable = false;

	button.depressed.src = style.normalLens;
	button.rollover.src = style.hoverLens;
	
	button.element = document.createElement( "div" );
	button.element.style.display = "inline-block"
	button.element.style.margin = 0;
	button.element.style.position = "relative";
	button.element.style.width = w + "px";
	button.element.style.height = h + "px";
        /// width and height don't exist now....
	//button.element.width = w ;
	//button.element.height = h;
	
	button.element.onmousedown = ()=>{ 
		button.setPressed();
	}
	button.element.onmouseup = ()=>{ 
        	if( button.isDown ) {
			button.setDepressed();
                        if( button.onclick )
	                        button.onclick();
                }
	};
	button.element.onmouseleave = ()=>{ 
		button.setDepressed();
	};
	button.element.onmouseenter = ()=>{ 
        	button.setHighlight();
        }
	
	
	var child = button.rollover;
	child.style.position = "absolute";
	child.style.width = "100%";
	child.style.height = "100%";
	child.style.top = 0;
	child.style.left = 0;
	child.style.z_index = 0;

	 child = button.depressed;
	child.style.position = "absolute";
	child.style.width = "100%";
	child.style.height = "100%";
	child.style.top = 0;
	child.style.left = 0;
	child.style.zIndex = 2;
	
	child = button.pressed;
	child.style.position = "absolute";
	child.style.width = "100%";
	child.style.height = "100%";
	child.style.top = 0;
	child.style.left = 0;
	child.style.zIndex = 2;
	
	button.text.innerHTML = "Text TwoLines";
	button.text.style.unselectable = "on";
	button.text.style.webkitUserSelect = "false";
	button.text.onselectstart = ()=>{ return false; }
	button.text.style.border=0;
        
	child = button.text;
	child.style.color = "black";
	child.style.textAlign = "center";
	child.style.position = "absolute";
	child.style.fontSize = "xx-large";
	child.style.top = "50%";
	child.style.left = "50%";
	child.style.transform = 'translate(-50%,-50% )';
	child.style.zIndex = 3;

	button.element.appendChild( button.depressed);
	button.element.appendChild( button.text );

	return button;	
}


function doWork() {
	var style = MakeStyle( "login", buttonStates.up, buttonStates.down, buttonStates.roll );

  var user = wrap( document.createElement( "input" ), 350, 50, "25%", "25%" );
	user.inner.style.fontSize = "xx-large";
  var pass = wrap( document.createElement( "input" ), 350, 50, "25%", "50%" );
	pass.inner.style.fontSize = "xx-large";
        pass.inner.type = "password";
  var button;
  var login = wrap( (button = MakeButton( style, 150, 20 )).element, 250, 50, "25%","75%" );
  button.text.innerHTML = "Login";
  button.onclick = ()=>{
  	ws.send( `{"op":"login","user":"${user.inner.value}","password":"${pass.inner.value}"}` );
  }
   user.inner.focus();

}


