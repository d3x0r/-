
var colorMatrix = document.getElementById( "colorMatrix" );
var colorMatrixH = document.getElementById( "colorMatrixH" );
var colorMatrixL = document.getElementById( "colorMatrixL" );
var ctxMatrix = colorMatrix.getContext( "2d" );
var ctxMatrixH = colorMatrixH.getContext( "2d" );
var ctxMatrixL = colorMatrixL.getContext( "2d" );

var levelSlider = document.getElementById( "topLevel" );

var colorRect = document.getElementById( "colorRect" );
var colorRectLock = document.getElementById( "colorRectLock" );

function pick(ctx,event) {
  
 var rect = event.target.getBoundingClientRect();
  var x = event.layerX * colorMatrix.width/(rect.right-rect.left);
  var y = event.layerY * colorMatrix.height/(rect.bottom-rect.top) ;
  var pixel = ctx.getImageData(x, y, 1, 1);
  var data = pixel.data;
  var rgba = 'rgba(' + data[0] + ', ' + data[1] +
             ', ' + data[2] + ', ' + (data[3] / 255) + ')';
  colorRect.style.background =  rgba;
  colorRect.textContent = rgba;
}
function pickR(event){ pick( ctxMatrix, event ); }
function pickH(event){ pick( ctxMatrixH, event ); }
function pickL(event){ pick( ctxMatrixL, event ); }

colorMatrix.addEventListener('mousemove', pickR)
colorMatrixH.addEventListener('mousemove', pickH)
colorMatrixL.addEventListener('mousemove', pickL)

function lockPick(event) {
	colorRectLock.style.background = colorRect.style.background;
	colorRectLock.textContent = colorRect.textContent;
}

colorMatrix.addEventListener('mousedown', lockPick)
colorMatrixH.addEventListener('mousedown', lockPick)
colorMatrixL.addEventListener('mousedown', lockPick)

function makePicker() {
	var ctx = ctxMatrix;


	var ppcd = {
        	nGreen : 128,
                alpha : 1.0,
                /*
		PSI_CONTROL frame;
		struct {
			BIT_FIELD bSettingShade : 1;
			BIT_FIELD bMatrixChanged : 1;
		} flags;
		CDATA CurrentColor;
		CDATA Presets[36];
		PSI_CONTROL LastPreset;
		PSI_CONTROL pcZoom;
		PSI_CONTROL psw, pShadeRed, pShadeBlue, pShadeGreen; // shade well data...
		int bSetPreset;
		int ColorDialogDone, ColorDialogOkay;
		Image pColorMatrix; // fixed size image in local memory that is block copied for output.
                */
	};// PICK_COLOR_DATA, *PPICK_COLOR_DATA;


	const nScale = 2


	const xbias = 1
	const ybias =  1
	const xsize = 133
	const ysize = 133

	//#define COLOR Color( (255-red)*nScale, (255-green)*nScale, (blue)*nScale )

levelSlider.addEventListener( "input", (a)=>{
	//console.log( "A:", a );
	//console.log( levelSlider.value );
	UpdateImage( 255-levelSlider.value );
} );

//----------------------------------------------------------------------------

function clamp(r) { return ((r<0)?0:(r>255)?255:r) }


	var data = null;
	var dataH = null;
	var dataL = null;


	var r,g,b;
	var r2,g2,b2;
	var r3,g3,b3;


function setColor(red,green,blue ) {
	             r = clamp(255-red*nScale);g=clamp(255-green*nScale);b=clamp(blue*nScale);
              //  	ctx.fillStyle=`rgb(${r},${g},${b})`;

}

function ctxfillRect(x,y,a,a2) {
	var n = (y * colorMatrix.width + x)*4;
	data[n+0] = r;	
	data[n+1] = g;	
	data[n+2] = b;	
	data[n+3] = 255;	

}

function hslToRgb(h, s, l){
    var r, g, b;
    h=h/360;
    s=s/100;
    l=l/100;
    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function setColorL(red,green,blue ) {

	var h = (blue * nScale * 360 / 255)|0;
	var s = 100-(red * nScale * 100 / 255)|0;
	var l = (green * nScale * 100 / 255)|0;

	var rgb = hslToRgb(h,s,l);
	r2=rgb[0];
	g2=rgb[1];
	b2=rgb[2];
//	console.log( "HSL:", h,s,l);
            //    	ctxMatrixL.fillStyle=`hsl(${h},${s}%,${l}%)`;

}

function ctxMatrixLfillRect(x,y,a,b) {
	var n = (y * colorMatrixL.width + x)*4;
	dataL[n+0] = r2;	
	dataL[n+1] = g2;	
	dataL[n+2] = b2;	
	dataL[n+3] = 255;	

}


function setColorH(red,green,blue ) {
	
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
	var h = (green * nScale * 360 / 255)|0;
	var s = 100-(red * nScale * 100 / 255)|0;
	var l = (blue * nScale * 100 / 255)|0;
//	console.log( "HSL:", h,s,l);
	var rgb = hslToRgb(h,s,l);
	r3=rgb[0];
	g3=rgb[1];
	b3=rgb[2];
          //      	ctxMatrixH.fillStyle=`hsl(${h},${s}%,${l}%)`;

}

function ctxMatrixHfillRect(x,y,a,b) {
	var n = (y * colorMatrixH.width + x)*4;
	dataH[n+0] = r3;	
	dataH[n+1] = g3;	
	dataH[n+2] = b3;	
	dataH[n+3] = 255;	

}



function UpdateImage( nGreen )
{
	var red, blue, green=0;
	
        var myImageData = ctxMatrix.getImageData(0, 0, colorMatrix.width, colorMatrix.height)
        var myImageDataH = ctxMatrixH.getImageData(0, 0, colorMatrix.width, colorMatrix.height)
        var myImageDataL = ctxMatrixL.getImageData(0, 0, colorMatrix.width, colorMatrix.height)

	data = myImageData.data;
	dataH = myImageDataH.data;
	dataL = myImageDataL.data;

	ctxMatrix.clearRect( 0, 0, colorMatrix.width, colorMatrix.height );
	ctxMatrixH.clearRect( 0, 0, colorMatrix.width, colorMatrix.height );
	ctxMatrixL.clearRect( 0, 0, colorMatrix.width, colorMatrix.height );

	for( green = 0; green < nGreen/nScale; green++ )
	{
		blue = 0;
		for( red = 0; red < 256/nScale; red++ )
		{
			setColor(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxfillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );

			setColorH(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixHfillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );

			setColorL(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixLfillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );

			//plot( pImage, xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , COLOR );
		}
		red = (255/nScale)|0;
		for( blue = 0; blue < 256/nScale; blue++ )
		{
                	setColor(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxfillRect( xbias+red+(red&1) + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        

                	setColorH(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixHfillRect( xbias+red+(red&1) + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
                	setColorL(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixLfillRect( xbias+red+(red&1) + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
			//plot( pImage, xbias+red+(red&1) + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , COLOR );
		}
	}

	for( blue = 0; blue <= 255/nScale; blue++ )
	{
		for( red = 0; red <= 255/nScale; red++ )
		{
                	setColor(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxfillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1)  , 1, 1 );                        

                	setColorH(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixHfillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1)  , 1, 1 );                        
                	setColorL(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixLfillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1)  , 1, 1 );                        
			//plot( pImage, xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , COLOR );
		}
	}

	for( ; green <= 255/nScale; green++ )
	{
		blue = (255/nScale)|0;
		for( red = 0; red <= 255/nScale; red++ )
		{
                	setColor(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxfillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        

                	setColorH(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixHfillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
                	setColorL(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixLfillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
			//plot( pImage, xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , COLOR );
		}
		red = 0;
		for( blue = 0; blue < 256/nScale; blue++ )
		{
                	setColor(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxfillRect( xbias+red + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
			//plot( pImage, xbias+red + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , COLOR );
                	setColorH(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixHfillRect( xbias+red + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
                	setColorL(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctxMatrixLfillRect( xbias+red + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
		}
	}

	ctxMatrix.putImageData(myImageData, 0, 0);
	ctxMatrixH.putImageData(myImageDataH, 0, 0);
	ctxMatrixL.putImageData(myImageDataL, 0, 0);
}




function drawMatrix() {
	{
		if( ppcd.flags.bMatrixChanged )
		{
			UpdateImage(  ppcd.nGreen );
			ppcd.flags.bMatrixChanged = 0;
		}
	/*
		BlotImage( GetControlSurface( pc ), ppcd.pColorMatrix, 0, 0 );
		if( GetCheckState( GetControl( ppcd.frame, CHK_ALPHA) ) )
		{
			Image Surface = GetControlSurface( pc );
			ppcd.CurrentColor = SetAlpha( ppcd.CurrentColor, ppcd.Alpha );
			BlatColorAlpha( Surface, 0, 0
							  , Surface.width
							  , Surface.height
							  , ppcd.CurrentColor );
		}
	*/
	}
	return TRUE;

}
	UpdateImage( 128) ;

}

makePicker();
