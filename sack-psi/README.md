
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
     var color = new Image.Color( { r:,g:, b: [, a:] ) // if not specified alpha is 255
     var color = new Image.Color( 0xaarrggbb ) // Uint32 number for color
     var color = new Image.Color( 0xRRGGBB ) // number to define color, defaults to alpha 255
     var color = new Image.Color( r, g, b [, a] ) // pass colors as separate values as arguments
     ```

  - colors
    - some predefined color constants
    
  - isRGB
    - returns TRUE if colors are RGBA else is BGRA
    (unimplemented)

  - plot  - set a single pixel
  - plotOver  - draw a pixel over existing image data using alpha information; if alpha is fully opaque, basically is same as plot
  - line - draw a line (x, y, xto, yto, color )
      (todo)(x, y, xto, yto, callback ) - step through a line using the same stepping algorithm and call callback for each point; callback gets parameters (x,y)
  - lineOver - draw a line (x, y, xto, yto, color ) over existing image using alpha to merge colors
  - fill - fill a rectangle (x, y, width, height, color )
  - fillOver - fill a rectangle  over existing image using alpha (x, y, width, height )
  - drawImage - output an image into this image  (image, x, y [ [,x source, ysource], width, height ] [, shade [,shade r, shade b] )
  - drawImageOver - output an image over this image using alpha information in the image to merge (image, x, y [ [,x source, ysource], width, height ] [, shade [,shade r, shade b] )
  - imageSurface
      return value uint8arry that is the (RGBA/BGRA) data of the image.
      
  - 
