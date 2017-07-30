
# SACK GUI Addon

   Adds ability to create graphic video output surfaces and deal with images.
   PSI is a legacy name 'Panther's Slick(Slim) Interface' from days gone by.


```
   const psi = require( 'sack-psi' );
```

## Constants
  - button 
     defines button masks that can appear in mouse callbacks.  These values are or'ed together.
     - left - the left mouse button)
     - right - the right mouse button.
     - middle - the middle
     - scroll_down - down 
     - scroll_up
        button : { left : 1, right : 2, middle : 16, scroll_down : 256, scroll_up : 512 },


## Image
### Properties
  - Font
     a type used to track a font for use to output text.
     - usage: 
     	```
        var font = new Image.Font( filename [, w, h [, quality] );
         // filename is a text string referencing the font file to use to render.
         // w, h are optional width and height of the font (must be positive)
         // quality is a number from 0-3 for number of bits to render font... 0=1 bit, 1=2 bit, 2=4bit, 3=8bit
         ```
     - measure
     
  - Color
     - a type the represents a color to be used as a parameter in the below; takes care of issues where colors is RGBA instead of BGRA
     ```
     var color = new psi.Image.Color( { r:,g:, b: [, a:] ) // if not specified alpha is 255
     var color = new psi.Image.Color( 0xaarrggbb ) // Uint32 number for color
     var color = new psi.Image.Color( 0xRRGGBB ) // number to define color, defaults to alpha 255
     var color = new psi.Image.Color( r, g, b [, a] ) // pass colors as separate values as arguments
     ```

  - colors
    - some predefined color constants
    
  - isRGB
    - returns TRUE if colors are RGBA else is BGRA
    (unimplemented)

  Color parameters passed to the following functions can either be a hex number, or a sack.Image.Color object from above.

  - plot(x,y,c)  - set a single pixel 
  - plotOver(x,y,c)  - draw a pixel over existing image data using alpha information; if alpha is fully opaque, basically is same as plot
  - line - draw a line (x, y, xto, yto, color )
      (todo)(x, y, xto, yto, callback ) - step through a line using the same stepping algorithm and call callback for each point; callback gets parameters (x,y)
  - lineOver(x, y, xto, yto, color) - draw a line (x, y, xto, yto, color ) over existing image using alpha to merge colors
  - fill(x, y, width, height, color) - fill a rectangle 
  - fillOver(x, y, width, height, color) - fill a rectangle  over existing image using alpha
  - drawImage - output an image into this image  (image, x, y [ [,x_source, y_source], width, height ] [, shade [,shade r, shade b] )
      multiple combinations of parameters are allowed here...
     - ( image, x, y )  draw the specified image at the specified x, y coordinate
     - ( image, x, y, w, h ) draw a portion of the image at the specified position and specified width and height
     - ( image, x, y, xFrom, yFrom, width, height ) draw a portion of the specified image at the position, offset in the source image by xFrom, yFrom, and for a potion width, height
     - ( image, x, y, w, h, xFrom, yFrom, width, height ) draw a portion of the specified image at the specified position, stretching/shrinking image from specified width, height to the output width, height
     - ( ... , psi.Image.Color ) specify a color to shade the source image by.
     - ( ... , psi.Image.Color, psi.Image.Color, psi.Image.Color ) specify three colors, each are used scaled on Red, Green, Blue component of the source image repspectively.
  - drawImageOver - output an image over this image using alpha information in the image to merge (image, x, y [ [,x source, ysource], width, height ] [, shade [,shade r, shade b] )
     same parameter combinations as drawImage
  - imageSurface
      return value uint8array that is the (RGBA/BGRA) data of the image.
      
  - 

## Renderer
  Class used to output images to a display.  It has an image surface itself used to draw to.  Also is a way to get user input events from 
the display.

```
  var renderer = new psi.Renderer();

```

  - getImage() - returns a sack.Image (do not use?)
  - setDraw(cb) - set a draw callback, callback parameter is the image surface to draw to.
  - setMouse(cb) - set a mouse event callback, callback parameters (x, y, b); x and y position of the event and mouse buttons.
  - setKey(cb) - set a key event callback, callback parameters (key) ; uint32 value of the keys (needs work for use)
  - show() - show the renderer.
  - hide() - hide the renderer.
  - reveal() - alias for show.
  - redraw() - triggers callback for drawing.
  - update( [x,y,w,h] ) - updates the display, or updates a portion of the display.  optional parameters specify the region to update.
  - close() - close the display.  (hide and release internal resources; image from getImage is no longer valid.




## PSI
  Set of classes that provide an interactive GUI.  Internally based on Image and Renderer above.
  (add methods to set/override base colors)

  
  - Registration
     Register a new control type with methods
	```
		var reg = new psi.Registration( controlName ) 
		
     	```
     - setCreate(callback) - required.  no callback parameters.  Return 0/false to fail control creation; return true/non-zero for success.
     - setDraw(callback)  -  no callback parameters.  when the control is needed to draw; return 0 for no draw.
     - setMouse(callback)  - callback parameters (x, y, b )
     - setKey(callback)    - callback parameters( key )
     - setTouch(callback)  - callback parameters( touchEvents )

	``` 
		reg.setCreate( ()=>{ return 1; } )
		reg.setDraw( (x,y,b)=>{ /* mouse move... */ }
	
  - Frame
     Create a form into which controls can be created.

     - Control
         Create a new control within this frame.

  - (should remove)Control


```
	var frame = new psi.Frame( "Test Frame", 256, 256 );
        var button = new frame.Control( "ControlType", x, y, width, height );
	var commonButtons = frame.addCommonButtons( callbackCancel, callbackOk );
        frame.show();
	frame.wait();  // if you want to wait for the frame to close, otherwise launches frame asynchronously

```