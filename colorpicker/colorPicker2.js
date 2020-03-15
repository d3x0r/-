
var colorMatrix = document.getElementById( "colorMatrix" );
var ctxMatrix = colorMatrix.getContext( "2d" );
var levelSlider = document.getElementById( "topLevel" );



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

function setColor(red,green,blue ) {
	
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
	var h = (blue * nScale * 360 / 255)|0;
	var s = 100 - (red * nScale * 100 / 255)|0;
	var l = (green * nScale * 100 / 255)|0;
//	console.log( "HSL:", h,s,l);
                	ctx.fillStyle=`hsl(${h},${s}%,${l}%)`;

}

function UpdateImage( nGreen )
{
	var red, blue, green=0;

	ctxMatrix.clearRect( 0, 0, colorMatrix.width, colorMatrix.height );

	for( green = 0; green < nGreen/nScale; green++ )
	{
		blue = 0;
		for( red = 0; red < 256/nScale; red++ )
		{
			setColor(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctx.fillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );
			//plot( pImage, xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , COLOR );
		}
		red = (255/nScale)|0;
		for( blue = 0; blue < 256/nScale; blue++ )
		{
                	setColor(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctx.fillRect( xbias+red+(red&1) + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
			//plot( pImage, xbias+red+(red&1) + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , COLOR );
		}
	}

	for( blue = 0; blue <= 255/nScale; blue++ )
	{
		for( red = 0; red <= 255/nScale; red++ )
		{
                	setColor(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctx.fillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1)  , 1, 1 );                        
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
                        ctx.fillRect( xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
			//plot( pImage, xbias+red + blue+(blue&1), ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , COLOR );
		}
		red = 0;
		for( blue = 0; blue < 256/nScale; blue++ )
		{
                	setColor(red,green,blue);
                	//ctx.fillStyle=`rgb(${clamp(255-red*nScale)},${clamp(255-green*nScale)},${clamp(blue*nScale)})`;
                        ctx.fillRect( xbias+red + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , 1, 1 );                        
			//plot( pImage, xbias+red + blue, ybias+(green + 128/nScale) - (red>>1) + (blue>>1) , COLOR );
		}
	}
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
