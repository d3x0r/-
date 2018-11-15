
import {LINK_VIA_START,LINK_VIA_END,Layer,LayerPool,LayerDataPool} from "./layer.mjs";

import * as peices from "./peice.mjs";

const MK_LBUTTON = 1;
const MK_RBUTTON = 2;
const MK_MBUTTON = 4;

// should be 8 pixels on each and every side
// these will be the default color (black?)
const SCREEN_PAD = 8;

// c++ compiler is really kinda fucked isn't it
// this is the next issue in a large chain of them...
//   struct { struct { var a, b; }; var c, d; } cannot be initialized
//   defining a array, and then initializing it later cannot be done.
//   // maybe that's not the real issue.
//extern DIR_DELTA DirDeltaMap[8];

// I really do hate having circular dependancies....

//----------------------------------------------------------------------

function UpdateRegion( x, y, wd, ht ) {
	return {
		x:x, y:y, wd:wd, ht:ht,
		add(x,y,w,h) {
			
			if( this.wd == 0 && this.ht == 0 )
			{
				this.x = x;
				this.y = y;
			}
			if( x < this.x )
			{
				this.wd += this.x - x;
				this.x = x;
			}
			if( y < this.y )
			{
				this.ht += this.y - y;
				this.y = y;
			}
			if( w > this.wd )
				this.wd = w;
			if( h > this.ht )
				this.ht = h;
		},
		flush() {
			//console.log( "Output this region someehow" );
		},
	}
}





export function Board( parent ) {
	if( !(this instanceof Board)) return new Board(parent );

	var canvas = this.canvas = document.createElement( "canvas" );
	canvas.width = 1024;
	canvas.height = 1024;
	canvas.style.width = "100%";
	canvas.style.height = "100%";
	this.ctx = canvas.getContext( "2d" );
	parent.appendChild( canvas );
	var board = this;
	var _buttons = 0;
	function mouseMove( evt ) {
		evt.preventDefault();
		board.mousePos.x = evt.clientX;
		board.mousePos.y = evt.clientY;
		var pRect = parent.getBoundingClientRect();
		
		board.DoMouse( evt.offsetX * canvas.width/pRect.width, evt.offsetY* canvas.height/pRect.height, _buttons );
	}
	function mouseUp( evt ) {
		evt.preventDefault();
		_buttons = evt.buttons;
		board.mousePos.x = evt.clientX;
		board.mousePos.y = evt.clientY;
		var pRect = parent.getBoundingClientRect();
		
		board.DoMouse( evt.offsetX * canvas.width/pRect.width, evt.offsetY* canvas.height/pRect.height, _buttons );
	}
	function mouseDown( evt ) {
		evt.preventDefault();
		_buttons = evt.buttons;
		board.mousePos.x = evt.clientX;
		board.mousePos.y = evt.clientY;
		var pRect = parent.getBoundingClientRect();
		
		board.DoMouse( evt.offsetX * canvas.width/pRect.width, evt.offsetY* canvas.height/pRect.height, _buttons );
	}

	canvas.addEventListener( "mousemove", mouseMove );
	canvas.addEventListener( "mouseup", mouseUp );
	canvas.addEventListener( "mousedown", mouseDown );
	//canvas.oncontextmenu = (event)=>{ event.preventDefault();return false};
	parent.addEventListener( "contextmenu", (event)=>{ 
		event.preventDefault()
		return false;
	}, false );
	document.body.addEventListener( "contextmenu", (event)=>{ 
		event.preventDefault()
		return false;
	}, false );
	canvas.addEventListener( "contextmenu", (event)=>{ 
			event.preventDefault()
			return false;
		}, false );

	this.cellSize = { width: 16, height:16 };

	// original cell width/height
	// cell_width, height are updated to reflect scale
	this._cell_width = 0;
        this._cell_height = 0;

	this.default_peice_instance;
	this.default_peice;
	this.OnClose;
	this.psvClose;


	this.peices = [];
	this.iTimer; // this is the timer used for board refreshes...
	this.update = UpdateRegion();

	this.layerPool = LayerPool();
	this.layerDataPool = LayerDataPool();

	// current layer which has a mouse event dispatched to it.
	this.mouse_current_layer;
	this.route_current_layer;
	this.move_current_layer;
	this.mousePos = { x:0, y:0 };
	this.xStart = 0;
        this.yStart = 0;
        this.wX = 0;
        this.wY = 0;
	this.board_width = 50;
        this.board_height = 50;
	// cached based on current layer definitions...
	// when layers are updated, this is also updated
	// when board is scrolled...
	// it's a fairly tedious process so please keep these
	// updates down to as little as possible...
	// I suppose I should even hook into the update of the layer
	// module to update the current top-level cells on the board.
	// hmm drawing however is bottom-up, and hmm actually this
	// is a mouse phenomenon - display is a different basis.
	this.board = new Array( ((this.board_width+1)|0)*(this.board_height+1)|0 ); //[64*64]; // manually have to compute offset from board_width
	this.board_origin_x = 0;
        this.board_origin_y = 0; // [0][0] == this coordinate.

	this.flags = {
		bSliding : 0,
		bDragging : 0,
		bLockLeft : 0,
		bLockRight : 0,
		bLeft : 0,
		bRight : 0,
		// left changed happend both when a button is clicked
		// and when it is unclicked.
		bLeftChanged : 0,
		bRightChanged : 0,
	} ;

	this.scale = 0;
	this.current_path = {
		 viaset : null,
		 _x :0, _y:0
	} ;



	function Init( board )
	{
		board.peices = [];
		//cell_width = 16;
		//cell_height = 16;
		board.board_origin_x = 0;
		board.board_origin_y = 0;
		board.scale = 0;
		board.default_peice = null;
		board.mouse_current_layer = null;
		board.route_current_layer = null;
		board.move_current_layer = null;
		board.flags.bSliding = 0;
		board.flags.bDragging = 0;
		board.flags.bLockLeft = 0;
		board.flags.bLeftChanged = 0;
		board.flags.bLeft = 0;
		board.flags.bLockRight = 0;
		board.flags.bRightChanged = 0;
		board.flags.bRight = null;
		board.layerPool = LayerPool();
		board.layerDataPool = LayerDataPool();

		board.OnClose = null;
		setTimeout( board.BoardRefresh.bind(board), 1000 );
		}


	//BOARD::BOARD()
	Init( this );
}

		Board.prototype.GetCellSize = function(  )  {
			return this.cellSize;
		},

		Board.prototype.SetScale = function( _scale ) {
			if( _scale < 0 || _scale > 2 )
				return;
			this.cellSize.width = this._cell_width >> _scale;
			this.cellSize.height = this._cell_height >> _scale;
			this.scale = _scale;
		},
		Board.prototype.SetCellSize = function( cx,  cy )
		{
			this.cellSize.width = this._cell_width = cx;
			this.cellSize.height = this._cell_height = cy;
		},
	        
		Board.prototype.DrawLayer = function( layer )
		{
			layer.Draw( this, this.ctx
				, SCREEN_PAD + ( this.board_origin_x + (layer.x) ) * this.cellSize.width
				, SCREEN_PAD + ( this.board_origin_y + (layer.y) ) * this.cellSize.height
				);
			this.update.add( SCREEN_PAD + ( this.board_origin_x + (layer.x) ) * this.cellSize.width
				, SCREEN_PAD + ( this.board_origin_y + (layer.y) ) * this.cellSize.height
				, this.cellSize.width, this.cellSize.height );
		},
		Board.prototype.reset = function( )
		{
			this.layerPool = LayerPool();
			this.layerDataPool = LayerDataPool();
		},


	Board.prototype.GetScale = function(  )
	{
		return this.scale;
	}

	Board.prototype.SetBackground = function( peice )
	{
		this.default_peice = peice;
		this.default_peice_instance = this.default_peice.methods.Create(peice.psvCreate);
		this.rootLayer = new Layer( this, this.default_peice );
		peice.image.addEventListener( "load", ()=>{
			this.BoardRefresh();
		});
	}

	Board.prototype.BeginPath = function( viaset, x, y, psv )
	{
		if( this.mouse_current_layer )
		{
			var pl = new Layer( this, viaset );
			pl.flags.bRoute = true;
			var connect_okay = this.mouse_current_layer
				.peice
				.methods
				.ConnectBegin( this.mouse_current_layer.psvInstance
						  , (this.wX - this.mouse_current_layer.x)
						  , (this.wY - this.mouse_current_layer.y)
						  , viaset
						  , pl.psvInstance );
			if( !connect_okay )
			{
				return false;
			}
			this.mouse_current_layer.Link( pl, LINK_VIA_START
         									, (this.wX - this.mouse_current_layer.x)
         									, (this.wY - this.mouse_current_layer.y) );
			this.route_current_layer = pl;
			// set the via layer type, and direction, and stuff..
			pl.BeginPath( this.wX, this.wY );

			pl.link_top(this.rootLayer);

			// otherwise change mode, now we are working on a new current layer...
			// we're working on dragging the connection, and... stuff...
		}
		//current_path.viaset = viaset;
		//current_path._x = x;
		//current_path._y = y;
		// lay peice does something like uhmm add to layer
		// to this point layers are single image entities...
		//LayPeice( viaset, x, y );
		return true;
	}


	Board.prototype.addLayerPathNode = function( node ) {
		var layers = this.board[node.x + node.y*this.board_width ] ;
		if( layers ) {
			node.isAbove = layers;
			node.isBelow = null;
			layers.isBelow = node;
		} else {
			node.isAbove = null;
			node.isBelow = null;
		}
		this.board[node.x + node.y*this.board_width ] = node;
	}



	Board.prototype.GetLayerAt = function( wX, wY, notlayer )
	{
		var layer = this.rootLayer;
		while( layer )
		{
			var l;
			if( layer !== notlayer )
				if( l = layer.IsLayerAt(wX, wY) )
				{
					//console.log( ("Okay got a layer to return...") );
					return { layer:layer, at:l };
				}
			layer = layer.next;
		};

		return null;
	}

	Board.prototype.GetLayerDataAt = function( wX, wY,  notlayer /*= null*/ )
	{
		var layer = this.GetLayerAt( wX, wY, notlayer );
		if( layer )
			return layer;
		return null;
	}


	// viaset is implied by route_current_layer
	Board.prototype.EndPath = function(  x,  y )
	{
		// really this is lay path also...
		// however, this pays attention to mouse states
		// and data and layers and connections and junk like that
		// at this point I should have
		//   mouse flags.bRight, bLeft
		//   route_current_layer AND mouse_current_layer
		//
		var layer;
		var pld;
		// first layer should result and be me... check it.
		if( layer = this.GetLayerAt( x, y, this.route_current_layer ) )
		{
			if( this.flags.bLeftChanged )
			{
				pld = layer;
				var connect_okay = pld.layer.peice.methods.ConnectEnd( pld.psvInstance
																				  , (this.wX - layer.x)
																				  , (this.wY - layer.y)
																				  , this.route_current_layer.peice
																				  , this.route_current_layer.psvInstance );
				if( connect_okay )
				{
					//DebugBreak();
					console.log( ("Heh guess we should do something when connect succeeds?") );
					// keep route_current_layer;
					layer.Link( this.route_current_layer, LINK_VIA_END, (this.wX-layer.x), (this.wY-layer.y) );
					this.route_current_layer = null;
					return;
				}
				else
				{
					//DebugBreak();
					//delete route_current_layer;
					this.route_current_layer = null;
					return;
				}
			}
		}
		else
		{
         // right click anywhere to end this thing...
			if( this.route_current_layer &&
				this.flags.bRightChanged &&
				!this.flags.bRight )
			{
            //DebugBreak();
				// also have to delete this layer.
				//delete this.route_current_layer;
				this.route_current_layer = null;
				return;
			}
		}
		this.LayPathTo( this.wX, this.wY );
	}

	Board.prototype.UnendPath = function( )
	{
		var disconnect_okay = this.mouse_current_layer
			.peice
			.methods
			.Disconnect( this.mouse_current_layer
								.psvInstance );
							  //, (wX - this.mouse_current_layer.x)
							  //, (this.wY - this.mouse_current_layer.y)
							  //, viaset
							  //, pl.pLayerData.psvInstance );
		if( disconnect_okay )
		{
			this.mouse_current_layer.Unlink();
			this.mouse_current_layer.isolate();
			this.mouse_current_layer.link_top();
			this.route_current_layer = mouse_current_layer;
		}
	}



	Board.prototype.PutPeice = function(  peice, x, y, psv )
	{
		//uintptr_t psv = peice.Create();
		// at some point I have to instance the peice to have a neuron...
		if( !peice ) {
			console.log( ("PEICE IS null!") );
			return;
		}

		var size = peice.getsize( );//&rows, &cols );
		var hot = peice.gethotspot( );
		console.log( ("hotspot offset of created cell is %d,%d so layer covers from %d,%d to %d,%d,")
				 , hot.x, hot.y
				 , x-hot.x, y-hot.y
				 , x-hot.x+size.cols, y-hot.y+size.rows );
		peice.psvCreate = psv; // kinda the wrong place for this but we abused this once upon a time.
		
		var pl = new Layer( this, peice, x, y, size.cols, size.rows, hot.x, hot.y );
		//pl.pLayerData = new(&LayerDataPool) LAYER_DATA(peice);
		// should be portioned...
		pl.link_top(this.rootLayer);

		this.BoardRefresh();
	}


	Board.prototype. BoardRefresh = function(  )  // put current board on screen.
	{
		var x,y;
		//pImage= pDisplay?GetDisplayImage( pDisplay ):pControl?GetControlSurface( pControl ):null;
		const ctx = this.ctx;
		const canvas = this.canvas;
		
		ctx.clearRect( 0, 0, canvas.width, canvas.height );
		// 8 border top, bottom(16),left,right(16)
		{
			var old_width = this.board_width;
			var old_height = this.board_height;
			this.board_width = ( canvas.width - (2*SCREEN_PAD) + ( this.cellSize.width-1) ) / this.cellSize.width;
			this.board_height = ( canvas.height - (2*SCREEN_PAD) + (this.cellSize.height-1) ) / this.cellSize.height;
			if( old_width != this.board_width || old_height != this.board_height )
			{
				this.board = new Array( (this.board_width+1)|0*(this.board_height+1)|0 );
			}
		}
		if( this.default_peice )
		{
			//var rows,cols;
			var size;
			var sx, sy;
			size = this.default_peice.getsize( );

			if( this.board_origin_x >= 0 )
				sx = this.board_origin_x % size.cols;
			else
				sx = -(-this.board_origin_x % size.cols);

			if( sx >= 0 )
				sx -= size.cols;

			if( this.board_origin_y >= 0 )
				sy = this.board_origin_y % size.rows;
			else
				sy = -(-this.board_origin_y % size.rows);

			if( sy >= 0 )
				sy -= size.rows;

			this.update.add( SCREEN_PAD
						  , SCREEN_PAD
						  , (this.board_width+1) * this.cellSize.width, (this.board_height+1) * this.cellSize.height );
			for( x = sx; x < this.board_width; x += size.cols )
				for( y = sy; y < this.board_height; y += size.rows )
				{
					this.default_peice.methods.Draw( this.default_peice, this.default_peice_instance
									 , ctx
									 , x * this.cellSize.width + SCREEN_PAD
									 , y * this.cellSize.height + SCREEN_PAD
									 );
				}
		}

		if( this.rootLayer )
		{			
			var layer = this.rootLayer;
			while( layer && (layer = layer.prior) )
			{
				this.DrawLayer( layer );
			}
		}
		//LayerPool.forall( faisDrawLayer, (uintptr_t)this );
		//ForAllInSet( LAYER, LayerPool, faisDrawLayer, (uintptr_t)this );
		this.update.flush();
	}



	Board.prototype.LayPathTo = function(  wX, wY )
	{
		this.route_current_layer.LayPath( wX, wY );
		this.BoardRefresh();//SmudgeCommon( pControl );
	}



 
	Board.prototype.SCRN_TO_GRID_X = function(x) { return ((x - SCREEN_PAD)/this.cellSize.width - this.board_origin_x ) }
	Board.prototype.SCRN_TO_GRID_Y = function(y) { return ((y - SCREEN_PAD)/this.cellSize.height - this.board_origin_y) }
	Board.prototype.DoMouse = function(  X,  Y,  b )
	{
		//static _left, _right;
	        
		this.wX = this.SCRN_TO_GRID_X( X )|0;
		this.wY = this.SCRN_TO_GRID_Y( Y )|0;
		//console.log( ("mouse at %d,%d"), this.wX, this.wY );
	        
		this.flags.bLeftChanged = this.flags.bLeft ^ ( (b & MK_LBUTTON) != 0 );
		this.flags.bRightChanged = this.flags.bRight ^ ( (b & MK_RBUTTON) != 0 );
		this.flags.bLeft = ( (b & MK_LBUTTON) != 0 );
		this.flags.bRight = ( (b & MK_RBUTTON) != 0 );
	        
		if( this.flags.bRightChanged && !this.flags.bRight )
		{
		   if( !this.route_current_layer )
		   {
				var x = this.wX, y = this.wY;
				console.log( ("right at %d,%d"), this.wX, this.wY );
				pld = this.GetLayerDataAt( x, y );
				if( pld )
				{
					console.log( ("Okay it's on a layer, and it's at %d,%d on the layer"), this.wX, this.wY );
					if( !pld.layer.peice.methods.OnRightClick( pld.layer.psvInstance, this.wX, this.wY ) )
						return; // routine has done something to abort processing...
				}
				else if( this.default_peice )
				{
					if( !this.default_peice.methods.OnRightClick(null,this.wX,this.wY) )
						return; // routine has done something to abort processing...
				}
			}
		}
		else
		{
			//_right = this.flags.bRight;
		}
	        
	        
		if( this.flags.bSliding )
		{
			if( ( this.flags.bLockLeft && this.flags.bLeft ) ||
				( this.flags.bLockRight && this.flags.bRight ) )
			{
					if( this.wX != this.xStart ||
						this.wY != this.yStart )
					{
						//console.log( ("updating board origin by %d,%d"), this.wX-this.xStart, this.wY-this.yStart );
						this.board_origin_x += this.wX - this.xStart;
						this.board_origin_y += this.wY - this.yStart;
						this.wX = this.xStart;
						this.wY = this.yStart;
						this.BoardRefresh()//SmudgeCommon( pControl );
					}
				}
				else
				{
					this.flags.bSliding = false;
					this.flags.bLockLeft = false;
					this.flags.bLockRight = false;
				}
			}
		else if( this.move_current_layer ) // moving a node/neuron/other...
		{
			if( this.flags.bLeft )
			{
				//DebugBreak();
				this.move_current_layer.move( this.wX - this.xStart, this.wY - this.yStart );
				this.xStart = this.wX;
				this.yStart = this.wY;
				this.BoardRefresh()//SmudgeCommon( pControl );
				this.move_current_layer
					.peice
					.methods
					.OnMove( this.move_current_layer
								.psvInstance
							  );
			}
			else
			{
				this.move_current_layer = null;
			}
		}
		else
		{
			if( this.flags.bLeft )  // not drawing, not doing anything...
			{
				// find neuron center...
				// first find something to do in this cell already
				// this is 'move neuron'
				// or disconnect from...
	        
				var x = this.wX, y = this.wY;
				var layer = this.GetLayerAt( x, y, this.route_current_layer );
				//console.log( ("event at %d,%d"), this.wX, this.wY );
				if( this.route_current_layer )
				{
					if( this.flags.bLeftChanged )
					{
						if( !layer )
						{
							// if it was a layer... then lay path to is probably
                          // going to invoke connection procedures.
						  this.default_peice.methods.OnClick(null,this.wX,this.wY);
						}
					}
					this.LayPathTo( this.wX, this.wY );
				}
				else if( layer )
				{
					var pld = layer;
					this.mouse_current_layer = layer.layer;
					//console.log( ("Generate onclick method to peice.") );
					pld.layer.peice.methods.OnClick( pld.layer.psvInstance, layer.at.x, layer.at.y );
					this.mouse_current_layer = null;
				}
				else if( this.default_peice )
				{
					console.log( ("Default peice click.") );
					this.default_peice.methods.OnClick(null,this.wX,this.wY);
				}
			}
			else
			{
				if( this.route_current_layer )
				{
					// ignore current layer, and uhmm
					// get Next layer data... so we have something to connect to...
					// okay end path is where all the smarts of this is...
					// handles mouse changes in state, handles linking to the peice on the board under this route...
					this.EndPath( this.wX, this.wY );
				}
			}
		}
	}


	Board.prototype.LockDrag = function( )
	{
		// this method is for locking the drag on the board...
		// cannot lock if neither button is down...??
		if( this.flags.bLeft || this.flags.bRight )
		{
			this.xStart = this.wX;
			this.yStart = this.wY;
			this.flags.bSliding = true;
			if( this.flags.bLeft )
			{
				this.flags.bLockRight = false;
				this.flags.bLockLeft = true;
			}
			else
			{
				this.flags.bLockRight = true;
				this.flags.bLockLeft = false;
			}
		}
		//Log( ("Based on current OnMouse cell data message, lock that into cursor move...") );
	}
	Board.prototype.LockPeiceDrag = function( )
	{
		// this method is for locking the drag on the board...
		// cannot lock if neither button is down...??
		if( this.flags.bLeft || this.flags.bRight )
		{
			this.xStart = this.wX;
			this.yStart = this.wY;
			this.flags.bDragging = true;
			this.move_current_layer = this.mouse_current_layer;
			if( this.flags.bLeft )
			{
				this.flags.bLockRight = false;
				this.flags.bLockLeft = true;
			}
			else
			{
				this.flags.bLockRight = true;
				this.flags.bLockLeft = false;
			}
		}
		//Log( ("Based on current OnMouse cell data message, lock that into cursor move...") );
	}



	Board.prototype.destroy = function()
	{
		//if( OnClose )
		//	OnClose( psvClose, this );
		//RemoveTimer( iTimer );
		//delete update;
		//DestroyFrame( &pControl );
		canvas.remote();
		
	}

	Board.prototype.GetSize = function(  )
	{
		// result with the current cell size, so we know
		// how much to multiply row/column counters by.
		// X is always passed correctly?
		return { cols: this.board_width, rows: this.board_height };
	}
	


	Board.prototype.CreatePeice = function(  name //= ("A Peice")
								  ,  image //= null
								  ,  rows //= 1
								  ,  cols //= 1
								  ,  hotspot_x
								  ,  hotspot_y
								  ,  methods //= null
								  ,  psv
								  )
	{
		var peice = peices.Peice( this, name, image, rows, cols, hotspot_x, hotspot_y, true, false, methods, psv );
		this.peices.push( peice );
		return peice; // should be able to auto cast this...
	}
	
	Board.prototype.CreateVia = function( name //= ("A Peice")
											 ,  image //= null
											 ,  methods //= null
											 ,  psv
											 )
	{
		var via = peices.Via( this, name, image, methods, psv );
		peices.push( via );
		return via;
	}

	Board.prototype.forEachPeice = function( cb ) {
		peices.forEach( cb );
	}

	Board.prototype.GetPeice = function( peice_name )
	{
		return peices.find( (peice)=>peice.name === peice_name );
	}

