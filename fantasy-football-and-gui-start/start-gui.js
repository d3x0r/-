"use strict";

var requiredImages = [];
var maxRequired = 0;

	var DOM_text = document.createElement("div");
	DOM_text.innerHTML = "Loading... 0%";
	DOM_text.style.background = "rgba(255,255,255,0.5)";
	DOM_text.style.color = "#000000";
	document.body.appendChild( DOM_text );

function newImage(src) {  var i = new Image(); i.src = src; 
	requiredImages.push( i ); 
	maxRequired++;
	i.onload = ()=>{ 
			requiredImages.pop( i ); 
			DOM_text.innerHTML = "Loading... " + (100 - 100*requiredImages.length / maxRequired );
			if( requiredImages == 0 ) doWork(); };
	return i;}
	

var colorLayer = newImage("images/colorLayer.png");
//colorLayer.onload = ()=>{ doWork(); }
var defaultLens = newImage("images/defaultLens.png");

var pressedLens = newImage("images/pressedLens.png");
pressedLens.draggable = false;

function MultiShade( image, r, g, b ) {
	var canvas = document.createElement('canvas');
	canvas.width = image.width;
	console.log( canvas.width );
	canvas.height = image.height;
	console.log( canvas.height );
	var context = canvas.getContext('2d');
	context.drawImage(image, 0, 0 );
	var imageData = context.getImageData(0, 0, image.width, image.height);
	var i,j;
	var rr = r & 0xFF;
	var rg = ( r & 0xFF00 ) >> 8;
	var rb = ( r & 0xFF0000 ) >> 16;
	var gr = g & 0xFF;
	var gg = ( g & 0xFF00 ) >> 8;
	var gb = ( g & 0xFF0000 ) >> 16;
	var br = b & 0xFF;
	var bg = ( b & 0xFF00 ) >> 8;
	var bb = ( b & 0xFF0000 ) >> 16;
	for (j=0; j<imageData.width; j++)
    {
      for (i=0; i<imageData.height; i++)
      {
         var index=(i*4)*imageData.width+(j*4);
         var red=imageData.data[index] + 1;
         var green=imageData.data[index+1]+ 1;
         var blue=imageData.data[index+2]+ 1;
         //var alpha=imageData.data[index+3]+ 1;
		 red = ( ( red *  rr ) 
					+ ( blue *  br) 
					+ ( green *  gr) ) >> 8;
		if( red > 255 ) red = 255;
		green = ( ( ( red *rg) ) 
				   + ( ( blue*bg ) ) 
				   + ( ( green *gg ) )
					) >> 8 ;				   
		if( green > 255 ) green = 255;
		blue =  ( ( red *rb ) 
				   + ( blue* bb ) 
				   + ( green *gb ) ) >> 8 
					 ;				   
		if( blue > 255 ) blue = 255;
		
   	    imageData.data[index]=red;
         imageData.data[index+1]=green;
         imageData.data[index+2]=blue;
         //imageData.data[index+3]=alpha;
       }
     }
	 context.putImageData( imageData, 0, 0 );
	//return context.createImageData(image.width, image.height);
	return canvas.toDataURL();
}

function MakeStyle( name, normal, pressed, mask, c, hc ) {
	var style = { 
		normalMask : MultiShade( mask, c.r, c.g, c.b )
		, highlightMask : MultiShade( mask, hc.r, hc.g, hc.b )
		, normalLens : normal.src
		, pressedLens : pressed.src
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
			, background : new Image()
			, highlight_background : new Image()
			, text : document.createElement( "div" )
			, highlight : false
			, isDown : false
			, draw : ()=>{ 
			}
			, setText : ( newText ) => {
				button.text.innerHTML = newText;
			}
			, element : null
			, setPressed : ()=> {
				button.element.replaceChild( button.pressed, button.element.childNodes[1] ); 
				button.isDown = true;
			}
			, setDepressed : ()=> {
				button.element.replaceChild( button.depressed, button.element.childNodes[1] ); 
				button.isDown = false;
			}
			, setHighlight: ( enable )=> {
				if( enable )
					button.element.replaceChild( button.highlight_background, button.element.childNodes[0] ); 
				else
					button.element.replaceChild( button.background, button.element.childNodes[0] ); 
				button.highlight = enable;
			}
		};
		console.log( style.pressedLens );
	button.pressed.src =style.pressedLens;
	button.pressed.draggable = false;

	button.depressed.src = style.normalLens;
	button.background.src = style.normalMask;
	button.highlight_background.src = style.highlightMask;
	
	button.element = document.createElement( "div" );
	button.element.style.display = "inline-block"
	button.element.style.margin = 0;
	button.element.style.position = "relative";
	button.element.style.width = w + "px";
	button.element.style.height = h + "px";
	button.element.width = w ;
	button.element.height = h;
	
	button.element.onmousedown = ()=>{ 
		button.setPressed();
	}
	button.element.onmouseup = ()=>{ 
		button.setDepressed();
	};
	button.element.onmouseleave = ()=>{ 
		button.setDepressed();
	};
	//button.element.onmouseenter = ()=>{ button.element.replaceChild( pressedLens, button.element.childNodes[1] ) }
	
	
	var child = button.background;
	child.style.position = "absolute";
	child.style.width = "100%";
	child.style.height = "100%";
	child.style.top = 0;
	child.style.left = 0;
	child.style.z_index = 0;

	var child = button.highlight_background;
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
	
	//var text = document.createTextNode( "Text" );
	button.text = document.createElement( "div" );
	button.text.innerHTML = "Text TwoLines";
	button.text.style.unselectable = "on";
	button.text.style.webkitUserSelect = "false";
	button.text.onselectstart = ()=>{ return false; }
	button.text.style.border=0;
	child = button.text;
	child.style.color = "white";
	child.style.textAlign = "center";
	child.style.position = "absolute";
	child.style.fontSize = "xx-large";
	child.style.top = "50%";
	child.style.left = "50%";
	child.style.transform = 'translate(-50%,-50% )';
	child.style.zIndex = 1;

	button.element.appendChild( button.background );
	button.element.appendChild( button.depressed);
	button.element.appendChild( button.text );

	return button;	
}


function doWork() {

	console.log( colorLayer + " keys : " + Object.keys( Image.prototype ) );

	var redStyle = MakeStyle( "red utility", defaultLens, pressedLens, colorLayer
					, { r : 0, g: 0xFF000000, b: 0xFF0000E0 }
					, { r : 0, g: 0xFF00E000, b: 0xFF0000E0 } 	);
	
	var button2 = MakeButton( redStyle, 250, 320 );
	button2.setHighlight( true );
	document.body.appendChild( button2.element );

	var i;
	for(	i = 0; i < 20;i++ ) {
		var button3 = MakeButton( redStyle, 250, 150 );
		button3.setText( i );
		document.body.appendChild( button3.element );
	}
}

