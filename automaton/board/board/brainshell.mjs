


const  MNU_ADDCOMPONENT = 2048
const  MNU_MAXCOMPONENT = MNU_ADDCOMPONENT + 256


const  MNU_ZOOM       = 1020 // 0, 1, 2 used...
const  MNU_ENDZOOM    = 1030

const  MNU_CLOSE      = 1040

const  MNU_NEURON_DIG = 1013
const  MNU_SIGMOID    = 1012
const  MNU_ADDOSC     = 1011
const  MNU_ADDTICKOSC = 1010
const  MNU_SYNAPSE    = 1009 
const  MNU_NEURON     = 1008
const  MNU_PROPERTIES = 1007
const  MNU_DELETE     = 1006
const  MNU_LOAD       = 1005
const  MNU_SAVE       = 1004        
const  MNU_RESET      = 1003               
const  MNU_RUN        = 1002
const  MNU_ADDNEURON  = 1001

const  MNU_ADD_INPUT_START  = 5000
const  MNU_ADD_OUTPUT_START = 6000
const  MNU_ADD_OUTPUT_LAST  = 6999

const  LST_NEWBOARD = 1000
const   BTN_CREATENAME = 1001

const MF_STRING = 1;
const MF_POPUP = 2;
const MF_SEPARATOR = 4;
//const MF_

/*
PRELOAD( register_control_ids )
{
	SimpleRegisterResource( LST_NEWBOARD, LISTBOX_CONTROL_NAME );
	SimpleRegisterResource( BTN_CREATENAME, NORMAL_BUTTON_NAME );
}
*/
import peices from "./brain.peices.mjs";
import {DirDeltaMap,DefaultMethods,DefaultViaMethods}  from "./peice.mjs";
import { Board } from "./board.mjs";
import * as shapes from "./shapes.mjs";

//typedef class local_tag BRAINBOARD;

function outputInput( ) {
	
	return {
		flags : {
			 bOutput : 0 // else is an input...
		},
		brainboard : null,
		//PBRAIN_STEM pbs;
		brain : null, 
		conn : null, 
		neuron : null,  // this is what we really need... this particular peice's neural peice 
	};
	//typedef struct output_input_type OUTPUT_INPUT;
}


//static class BRAINBOARD *l;

export function BrainBoard( _brain, container ) {
	if( !(this instanceof BrainBoard) ) return new BrainBoard( _brain, container );

	this.flags = {
		bOwnBrain : false // allocated its own brain...
	} ;


	var create_input_type,create_output_type;

	// these are the peice sets which will be loaded
	// from the file at the moemnt...

	
	this.hMenu; 
	this.hMenuComponents;

	// although a PIVIA is-a PIPEICE, a via type peice is required
	// for certain operations such as beginpath.
	// this also results in certain interactions between peice instances
	// (peice methods such as connect, disconnect are performed)

	this.background_methods; // these are created with board ID
	this. neuron_methods;
	this.input_methods;
	this.output_methods;
	this.nerve_methods;

	this.connectors = [];
	this.menus = [];
	this.events = {};
	this.board = new Board( container );

		this.background_methods = BackgroundMethods(this);
		this.neuron_methods     = new NEURON_METHODS(this);
		this.tick_oscillator_methods = new TICK_OSCILLATOR_METHODS(this);
		this.oscillator_methods = new OSCILLATOR_METHODS(this);
		this.input_methods      = new INPUT_METHODS(this);
		this.button_input_methods = new BUTTON_INPUT_METHODS(this);
		this.slider_input_methods = new SLIDER_INPUT_METHODS(this);
		this.light_output_methods = new LIGHT_OUTPUT_METHODS(this);
		this.output_methods     = new OUTPUT_METHODS(this);
		this.nerve_methods      = new NERVE_METHODS(this);
		this.brain = _brain;
		Init( this );

    //---------------------------------------------------
	this.reset = function(){
		//	Init(this) 
		this.board.SetBackground( this.BackgroundPeice );
		this.board.reset();
		this.scale = 0;
	}
	
	this.scale = 0;
		
	function Init( brainshell )
	{
		//brainboard = this;
		//InitCommonControls();
			
		
		brainshell.InputPeice = null;
		brainshell.OutputPeice = null;

		brainshell.lightOutputPeice = brainshell.board.CreatePeice( "light", shapes.makeLightOutput()
			, peices.neuron.cells.width,  peices.neuron.cells.height
			, ((peices.neuron.cells.width-1)/2)|0, ((peices.neuron.cells.height-1)/2)|0
			, brainshell.light_output_methods );

		brainshell.buttonInputPeice = brainshell.board.CreatePeice( "button", shapes.makeButtonInput()
			, peices.neuron.cells.width,  peices.neuron.cells.height
			, ((peices.neuron.cells.width-1)/2)|0, ((peices.neuron.cells.height-1)/2)|0
			, brainshell.button_input_methods );

		brainshell.sliderInputPeice = brainshell.board.CreatePeice( "slider", shapes.makeSliderInput()
			, peices.neuron.cells.width,  peices.neuron.cells.height
			, ((peices.neuron.cells.width-1)/2)|0, ((peices.neuron.cells.height-1)/2)|0
			, brainshell.slider_input_methods );

		brainshell.OscillatorPeice = brainshell.board.CreatePeice( "oscil", shapes.makeNeuron()
			, peices.neuron.cells.width,  peices.neuron.cells.height
			, ((peices.neuron.cells.width-1)/2)|0, ((peices.neuron.cells.height-1)/2)|0
			, brainshell.oscillator_methods );

		brainshell.TickOscillatorPeice = brainshell.board.CreatePeice( "tickosc", shapes.makeNeuron()
			, peices.neuron.cells.width,  peices.neuron.cells.height
			, ((peices.neuron.cells.width-1)/2)|0, ((peices.neuron.cells.height-1)/2)|0
			, brainshell.tick_oscillator_methods );

		brainshell.NeuronPeice = brainshell.board.CreatePeice( "neuron", shapes.makeNeuron()
			, peices.neuron.cells.width,  peices.neuron.cells.height
			, ((peices.neuron.cells.width-1)/2)|0, ((peices.neuron.cells.height-1)/2)|0
			, brainshell.neuron_methods );


		var img = document.createElement( "img" );
		img.src = peices.pathway.image;

		var imgNeg = document.createElement( "img" );
		imgNeg.src = peices.pathway.imageNeg;
		//brainshell.NervePeice = brainshell.board.CreatePeice( "nerve",  img
		//	, 7, 7, 0, 0
		//	, brainshell.nerve_methods );
		brainshell.NervePeice = brainshell.board.CreateVia( "nerve",  img, imgNeg
			, brainshell.nerve_methods );

		brainshell.BackgroundPeice = null;
	        
		//CreateToolbin( board );


		brainshell.board.SetCellSize( 16, 16 );
		if( !brainshell.brain )
		{
			brainshell.flags.bOwnBrain = 1;
			brainshell.brain = new BRAIN();
		}
		else
			brainshell.flags.bOwnBrain = 0;
		
	        
			brainshell.board.SetCellSize( peices.cell.width, peices.cell.height );
	        
		var img = document.createElement( "img" );
		img.src = peices.background.image;
		brainshell.BackgroundPeice = brainshell.board.CreatePeice( "background", img
			,peices.background.cells.width, peices.background.cells.height 
			, ((peices.background.cells.width-1)/2)|0, ((peices.background.cells.height-1)/2)|0
			, brainshell.background_methods
		);
		brainshell.board.SetBackground( brainshell.BackgroundPeice );

	        
		brainshell.connectors = [];
		if( !brainshell.menus.length ) {
				
			InitMenus( brainshell );
		}
		brainshell.DefaultNeuron = brainshell.brain.Neuron();
		brainshell.DefaultSynapse = brainshell.brain.Synapse();

		
	}       

//---------------------------------------------------


	function InitMenus( _this )
	{
		var hMenu = _this.hMenu = createPopup();
		_this.hMenu.appendItem( MF_STRING, MNU_ADDNEURON, ("Add Neuron") );
		_this.hMenu.appendItem( MF_STRING, MNU_ADDOSC, ("Add Oscillator") );
		_this.hMenu.appendItem( MF_STRING, MNU_ADDTICKOSC, ("Add Tick Oscillator") );
           
		_this.hMenu.appendItem( MF_STRING|MF_POPUP, (_this.hMenuComponents=createPopup()), ("Add &Component") );
		{
			var n = 0;
			var idx;
			var pbs;
			_this.brain.brainStems.forEach( (pbs )=>
			{
				BuildBrainstemMenus( _this.hMenuComponents, pbs, _this.menus, _this.connectors, 0 );
			} )
		}
		hMenu.appendItem(  MF_SEPARATOR,0,0 );
		hMenu.appendItem(  MF_STRING, MNU_RESET, ("Reset") );
		hMenu.appendItem(  MF_STRING, MNU_RUN, ("RUN") );
		hMenu.appendItem(  MF_SEPARATOR,0,0 );
		{
			var hPopup;
			hMenu.appendItem( MF_STRING|MF_POPUP, (hPopup = createPopup()), ("Zoom") );
			_this.menus.push( hPopup );
        
			//hPopup = (PMENU)GetPopupData( hMenu, 6 );
			hPopup.appendItem( MF_STRING, MNU_ZOOM + 0, ("x1") );
			hPopup.appendItem( MF_STRING, MNU_ZOOM + 1, ("x2") );
			hPopup.appendItem( MF_STRING, MNU_ZOOM + 2, ("x4") );
		}
        
		hMenu.appendItem( MF_STRING, MNU_NEURON, ("Default Neuron") );
		hMenu.appendItem( MF_STRING, MNU_SYNAPSE, ("Default Synapse") );
		hMenu.appendItem( MF_STRING, MNU_SIGMOID, ("Sigmoid Constant") );
		/*
		hMenu.appendItem( MF_STRING, MNU_SAVE, ("Save...") );
		hMenu.appendItem( MF_STRING, MNU_LOAD, ("Load...") );
		hMenu.appendItem( MF_SEPARATOR,0,0 );
		hMenu.appendItem( MF_STRING, MNU_CLOSE, ("Close") );
        */
	}

}
        
BrainBoard.prototype.select= function( n ) {
	this.board.select( n );
}
             
BrainBoard.prototype.addEventListener = function(name,cb) {
	this.events[name] = cb;
}

BrainBoard.prototype.BuildBrainstemMenus = function (hMenuComponents, pbs, menus, connectors, idx) {
	{
		var n = 0;
		//PBRAIN_STEM pbs;
		this.comp_menu = createPopup();
		var menu;
		//for( pbs = brain.first(); pbs; pbs = brain.next() )
		{
			var idx;
			var connector;
			var module;
			hMenuComponents.appendItem(MF_STRING | MF_POPUP, comp_menu, pbs.name());
			this.menus.push(comp_menu);

			comp_menu.appendItem(MF_STRING | MF_POPUP, menu = CreatePopup(), ("inputs"));
			this.menus.push(menu);


			pbs.Inputs.list.forEach((connector) => {
				connectors.push(connector);
				menu.appendItem(MF_STRING, MNU_ADD_INPUT_START + (connectors.lenght - 1), connector.name());
			});
			comp_menu.appendItem(MF_STRING | MF_POPUP, menu = CreatePopup(), ("outputs"));
			this.menus.push(menu);

			pbs.Outputs.list.forEach((connector) => {
				connectors.push(connector);
				menu.appendItem(MF_STRING, MNU_ADD_OUTPUT_START + (connectors.length - 1), connector.name());
			})
		}
		comp_menu.appendItem(MF_STRING | MF_POPUP, (menu = CreatePopup()), ("module"));
		this.menus.push(menu);

		for (module = pbs.first_module(); module; idx++, module = pbs.next_module()) {
			BuildBrainstemMenus(menu, module, menus, connectors, idx);
			//AppendPopupItem( menu, MF_STRING, MNU_ADD_OUTPUT_START + idx + ( n * 80 ), module.name() );
			//SetLink( &outputs, idx, (POINTER)connector );
		}
		n++;
	}
}


BrainBoard.prototype.RebuildComponentPopups = function(  )
{
	{
		var n = 0;
		var idx;
		var pbs;
		this.hMenuComponents.reset();
		this.brain.brainStems.forEach( ( pbs )=>
		{
			BuildBrainstemMenus( this.hMenuComponents, pbs, this.menus, this.connectors, 0 );
		})
	}
}


/*
#ifdef BUILD_TEST_SHELL
float f_values[10];
CONNECTOR *connectors_in[] = { new connector( ("one"), &f_values[0] )
,new connector( ("two"), &f_values[1] )
,new connector( ("three"), &f_values[2] )
,new connector( ("four"), &f_values[3] )
,new connector( ("five"), &f_values[4] )
,new connector( ("six"), &f_values[5] )
,new connector( ("seven"), &f_values[6] )
,new connector( ("eight"), &f_values[7] )
,new connector( ("nine"), &f_values[8] )
,new connector( ("ten"), &f_values[9] )
};

CONNECTOR *connectors_out[] = { new connector( ("one"), &f_values[0] )
,new connector( ("two"), &f_values[1] )
,new connector( ("three"), &f_values[2] )
,new connector( ("four"), &f_values[3] )
,new connector( ("five"), &f_values[4] )
,new connector( ("six"), &f_values[5] )
,new connector( ("seven"), &f_values[6] )
,new connector( ("eight"), &f_values[7] )
,new connector( ("nine"), &f_values[8] )
,new connector( ("ten"), &f_values[9] )
};

BRAIN_STEM clusters[1] = { BRAIN_STEM( ("Basic Structure")
												 , connectors_in, sizeof(connectors_in)/sizeof(connectors_in[0])
												 , connectors_out, sizeof(connectors_out)/sizeof(connectors_out[0]) ) };

// creates a thread, don't do this.
PBRAIN brains[1];// = { BRAIN( &clusters[0] ) };

SaneWinMain( argc, argv )
{

	brains[0] = new BRAIN( &clusters[0] );
	//SetAllocateLogging( true );
	new BRAINBOARD;
	new BRAINBOARD;
	new BRAINBOARD;
	while( 1 )
		Sleep( 1000 );
   return 0;
}
EndSaneWinMain()
#endif
*/



							//------------------------------------------
/*
static LOGICAL SelectNewFile( HWND hParent, PSTR szFile )
{
   
   OPENFILENAME ofn;		 // common dialog box structurechar szFile[260];		 // buffer for filenameHWND hwnd;				  // owner windowHANDLE hf;				  // file handle// Initialize OPENFILENAMEZeroMemory(&ofn, sizeof(OPENFILENAME));
   szFile[0] = 0;
   memset( &ofn, 0, sizeof( OPENFILENAME ) );
   ofn.lStructSize = sizeof(OPENFILENAME);
   ofn.hwndOwner = hParent;
   ofn.lpstrFile = szFile;
   ofn.nMaxFile = 256;
   ofn.lpstrFilter = ("Bodies\0*.Body\0");
   ofn.nFilterIndex = 1;
   ofn.Flags = OFN_NOTESTFILECREATE
				  | OFN_NOREADONLYRETURN ;// Display the Open dialog box. 

   return GetOpenFileName(&ofn);
}
*/


/*
class IVIA: public IPEICE
{
public:
	//virtual ~IVIA();
	virtual CTEXTSTR name( void )=0;
	virtual Image GetViaStart( int direction, int scale = 0 )=0;// { return null; }
	virtual Image GetViaEnd( int direction, int scale = 0 )=0;//{ return null; }
	// getviafromto will result in start or end if from or to is NOWHERE respectively
	virtual Image GetViaFromTo( int from, int to, int scale = 0 ){ return null; }

	virtual Image GetViaFill1( int *xofs, int *yofs, int direction, int scale = 0 ){ return null; }
	virtual Image GetViaFill2( int *xofs, int *yofs, int direction, int scale = 0 ){ return null; }
	virtual int Move( void ) { return 0; } // Begin, Start
	virtual int Stop( void ) { return 0; } // end
	PVIA_METHODS via_methods;
};
*/

//---------------------------------------------------

function NERVE_METHODS(newbrainboard) {
	if( !(this instanceof NERVE_METHODS) ) return new MERVE_METHODS(newbrainboard);

	//this.methods = 
	this.brainboard = newbrainboard;
	this.synapse = null
};

NERVE_METHODS.prototype = Object.create( DefaultViaMethods.prototype );
NERVE_METHODS.prototype.constructor = NERVE_METHODS;

NERVE_METHODS.prototype.Create = function( psvExtra )
{
	return this.brainboard.brain.dupSynapse( this.brainboard.DefaultSynapse );
}
NERVE_METHODS.prototype.Destroy = function(  psv )
{
	this.brainboard.brain.ReleaseSynapse( psv );
}
NERVE_METHODS.prototype.Disconnect = function(  psv )
{
	this.brainboard.brain.UnLinkSynapseTo( psv );
	return true;
}
NERVE_METHODS.prototype.OnRightClick = function(  psv,  x,  y )
{
	console.log( "Show Synapse in Statuses" );
	//ShowSynapseDialog( (PSYNAPSE)psv );
	return 1;
}

NERVE_METHODS.prototype.DrawCell = function(  peice, psvInstance,  surface,  from, x,  y )
{
	//console.log( ("---------- DRAW NEURON ------------") );

	var synapse = psvInstance;

	//var from = this.master.getcell( cellx, celly );
	if( "range" in this.master.image ) {
		if( synapse.gain >= 0 )
			surface.drawImage( this.master.image.on, from.coords.x, from.coords.y, from.size.width, from.size.height
				, x, y
				, this.brainboard.board.cellSize.width
				, this.brainboard.board.cellSize.height  
			)
		else
			surface.drawImage( this.master.image.off, from.coords.x, from.coords.y, from.size.width, from.size.height
				, x, y
				, this.brainboard.board.cellSize.width
				, this.brainboard.board.cellSize.height  
			)

	} else {
		if( synapse.gain >= 0 )

		surface.drawImage( this.master.image.on, from.coords.x, from.coords.y, from.size.width, from.size.height
			, x, y
			, this.brainboard.board.cellSize.width
			, this.brainboard.board.cellSize.height  
		)
		else
		surface.drawImage( this.master.image.off, from.coords.x, from.coords.y, from.size.width, from.size.height
			, x, y
			, this.brainboard.board.cellSize.width
			, this.brainboard.board.cellSize.height  
		)
	}
//	BlotImageAlpha( surface

}


//---------------------------------------------------

function  INPUT_METHODS(newbrainboard)
{
	if( !(this instanceof INPUT_METHODS) ) return new INPUT_METHODS(newbrainboard);
	this.brainboard = newbrainboard;
	this.level_colors = [];
}

INPUT_METHODS.prototype = Object.create( DefaultMethods.prototype );
INPUT_METHODS.prototype.constructor = INPUT_METHODS;

INPUT_METHODS.prototype.Create = function(  psvExtra )
	{
		//brainboard.create_input_type = (POUTPUT_INPUT)psvExtra;
		//brainboard.create_input_type.flags.bOutput = 0;
		console.log( ("Creating a new input (peice instance)") );
		//this.brainboard.brain.GetInputNeuron( ((POUTPUT_INPUT)psvExtra).pbs, ((POUTPUT_INPUT)psvExtra).conn
		return psvExtra; // still not the real create...  but this is psviNstance...
	}
INPUT_METHODS.prototype.SetColors = function(  c1,  c2,  c3 )
	{
		this.level_colors[0] = c1;
		this.level_colors[1] = c2;
		this.level_colors[2] = c3;
	}
INPUT_METHODS.prototype.Draw = function(  psvInstance,  image,  cell,  x,  y )
	{
		var cPrimary;
		var input = psvInstance;
		var value = input.conn.get();
		console.log( ("input value is %g"), value );
		if( value < 0 )
			cPrimary = ColorAverage( level_colors[1]
										  , level_colors[0]
											, -(value * 1200)|0, 1000 );
		else
			cPrimary = ColorAverage( level_colors[1]
											, level_colors[2]
									  , (value*1200)|0, 1000 );

		BlotImageShaded( image
		               , cell //master.getcell(cellx, celly)
		               , x, y
		               , cPrimary );
	}
INPUT_METHODS.prototype.ConnectEnd = function(  psv_to_instance,  x,  y
									  ,  peice_from,  psv_from_instance )
{
	return false;
}
INPUT_METHODS.prototype.ConnectBegin = function(  psv_to_instance,  x,  y
									  ,  peice_from,  psv_from_instance )
{
	var n;
	//if( peice_from == brainboard.NerveMethods )
	// maybe...
	var synapse = psv_from_instance;
	var neuron = psv_to_instance;
	// validate that peice_from is a nerve_method type
	for( n = 0; n < 8; n++ )
		if( DirDeltaMap[n].x == x && DirDeltaMap[n].y == y )
			break;
	if( n < 8 )
		return this.brainboard.brain.LinkSynapseFrom( synapse, neuron.neuron, n );
	return false;
}
INPUT_METHODS.prototype.OnRightClick = function(  psv,  x,  y )
{
	//ShowInputDialog( (PNEURON)psv );
	return 1;
}

INPUT_METHODS.prototype.OnClick = function(  psv,  x, y )
{
	console.log( ("click on input! at %d,%d"), x, y );
	if( x == 0 && y == 0 )
	{
		// this is implied to be the current peice that
		// has been clicked on...
		// will receive further OnMove events...
		this.brainboard.board.LockPeiceDrag();
		return true;
	}
	else
	{
		if( !brainboard.board.BeginPath( brainboard.NervePeice, brainboard ) )
		{
			// attempt to grab existing path...
			// current position, and current layer
			// will already be known by the grab path method
			//brainboard.board.GrabPath();
		}
	}
	// so far there's nothing on this cell to do....
	return false;
}



function  OUTPUT_METHODS( newbrainboard )
{
	if( !(this instanceof OUTPUT_METHODS) ) return new OUTPUT_METHODS(newbrainboard);
	this.brainboard = newbrainboard; 

	this.level_colors = [ ];
}

OUTPUT_METHODS.prototype = Object.create( DefaultMethods.prototype );
OUTPUT_METHODS.prototype.constructor = OUTPUT_METHODS;

OUTPUT_METHODS.prototype.Create = function(  psvExtra )
{
	//brainboard.create_output_type = (POUTPUT_INPUT)psv;
	//brainboard.create_output_type.flags.bOutput = 1;
	console.log( "Creating a new output (peice instance)" );

	var poi = psvExtra;

	poi.neuron = this.brainboard.brain.GetOutputNeuron( poi.conn );
	//dupNeuron( brainboard.DefaultNeuron ))

	return psvExtra; // still not the real create...  but this is psviNstance...
	//return poi.neuron; // still not the real create...  but this is psviNstance...
	//return (((POUTPUT_INPUT)psvExtra).conn); // still not the real create...  but this is psviNstance...
	//return (brainboard.create_output_type);
}
OUTPUT_METHODS.prototype.Draw = function(  psvInstance,  image,  cell,  x,  y )
{
	var cPrimary;
	var neuron = psvInstance;
	var poi = psvInstance;
	//PANYVALUE output = neuron.Output; //(connector*)psvInstance;
	var value = neuron.get(); //output.get();
	if( value < 0 )
		cPrimary = ColorAverage( this.level_colors[1]
										, this.level_colors[0]
										, (int)-(value * 1200), 1000 );
	else
		cPrimary = ColorAverage( this.level_colors[1]
										, this.level_colors[2]
									, (int)(value*1200), 1000 );

	BlotImageShaded( image
								, cell //master.getcell(cellx, celly)
								, x, y
								, cPrimary );
}

OUTPUT_METHODS.prototype.SetColors = function(  c1,  c2,  c3 )
{
	this.level_colors[0] = c1;
	this.level_colors[1] = c2;
	this.level_colors[2] = c3;
}
OUTPUT_METHODS.prototype.ConnectEnd = function(  psv_to_instance,  x,  y
									  ,  peice_from,  psv_from_instance )
{
	var n;
	var success = false;
	//POUTPUT_INPUT poi = (POUTPUT_INPUT)psv_to_instance;
	//POUTPUT_INPUT poi = (POUTPUT_INPUT);
	//connector *output = (connector*)psv_to_instance;
	//if( peice_from == brainboard.NerveMethods )
	// maybe...
	var synapse = psv_from_instance;
	var neuron = psv_to_instance;
	// validate that peice_from is a nerve_method type
	//poi.
	for( n = 0; n < 8; n++ )
		if( DirDeltaMap[n].x == x && DirDeltaMap[n].y == y )
			break;
	if( n < 8 )
	{
		var success = this.brainboard.brain.LinkSynapseTo( synapse, neuron.neuron, n );
		return success;
	}
	return false;
}
OUTPUT_METHODS.prototype.ConnectBegin = function(  psv_to_instance,  x,  y
									  ,  peice_from,  psv_from_instance )
{
	return false;
}
OUTPUT_METHODS.prototype.OnRightClick = function(  psv,  x,  y )
	{
		//ShowOutputDialog( (PNEURON)psv );
		return 1;
	}
OUTPUT_METHODS.prototype.OnClick = function(  psv,  x,  y )
	{
		console.log( "click on neuron! at %d,%d", x, y );
		if( x == 0 && y == 0 )
		{
			// this is implied to be the current peice that
			// has been clicked on...
			// will receive further OnMove events...
			this.brainboard.board.LockPeiceDrag();
			return true;
		}
		else
		{
			if( !this.brainboard.board.BeginPath( this.brainboard.NervePeice, brainboard ) )
			{
				// attempt to grab existing path...
				// current position, and current layer
				// will already be known by the grab path method
				//brainboard.board.GrabPath();
			}
		}
		// so far there's nothing on this cell to do....
		return false;
	}

//---------------------------------------------------
//---------------------------------------------------
//---------------------------------------------------


function  NEURON_METHODS(newbrainboard)
{
	// these methods are passed a psvInstance
	// which is the current neuron instance these are to wokr on
	// this valud is retrieved and stored (by other portions) by the create() method
	this.brainboard = newbrainboard;

	this.c_input = []; // 0=min,1=mid,2=max
	this.c_threshold = []; // 0=min,1=mid,2=max
	this.connected = [];

}

NEURON_METHODS.prototype = Object.create( DefaultMethods.prototype );
NEURON_METHODS.prototype.constructor = NEURON_METHODS;

NEURON_METHODS.prototype.SetColors = function( bInput,  c1,  c2,  c3 )
	{
		if( bInput )
		{
			this.c_input[0] = c1;
			this.c_input[1] = c2;
			this.c_input[2] = c3;
		}
		else
		{
			this.c_threshold[0] = c1;
			this.c_threshold[1] = c2;
			this.c_threshold[2] = c3;
		}
	}

NEURON_METHODS.prototype.Create = function(  psvExtra )
{
	console.log( "Creating a new neuron (peice instance)");
	return this.brainboard.brain.dupNeuron( this.brainboard.DefaultNeuron );
}

NEURON_METHODS.prototype.Destroy = function(  psv )
{
      this.brainboard.brain.ReleaseNeuron( psv );
}
	

NEURON_METHODS.prototype.DrawCell = function(  peice, psvInstance,  surface,  from, x,  y )
{
	//console.log( ("---------- DRAW NEURON ------------") );

	var cPrimary, cSecondary, cTertiary;
		//var base,range,value,input,threshold;
	var neuron = psvInstance;

	//var from = this.master.getcell( cellx, celly );
	if( "range" in this.master.image ) {
		if( neuron.value )
			surface.drawImage( this.master.image.on, from.coords.x, from.coords.y, from.size.width, from.size.height
				, x, y
				, this.brainboard.board.cellSize.width
				, this.brainboard.board.cellSize.height  
			)
		else
			surface.drawImage( this.master.image.off, from.coords.x, from.coords.y, from.size.width, from.size.height
				, x, y
				, this.brainboard.board.cellSize.width
				, this.brainboard.board.cellSize.height  
			)

	} else {
		if( neuron.value )

		surface.drawImage( this.master.image.on, from.coords.x, from.coords.y, from.size.width, from.size.height
			, x, y
			, this.brainboard.board.cellSize.width
			, this.brainboard.board.cellSize.height  
		)
		else
		surface.drawImage( this.master.image.off, from.coords.x, from.coords.y, from.size.width, from.size.height
			, x, y
			, this.brainboard.board.cellSize.width
			, this.brainboard.board.cellSize.height  
		)
	}
//	BlotImageAlpha( surface

}

NEURON_METHODS.prototype.Update = function(  psv,  cycle )
	{
		console.log( "updating color information for a neuron..." );
	}

NEURON_METHODS.prototype.ConnectEnd = function(  psv_to_instance,  x,  y
									  ,  peice_from,  psv_from_instance )
{
	var n;
	//if( peice_from == brainboard.NerveMethods )
	// maybe...
	var synapse = psv_from_instance;
	var neuron = psv_to_instance;
	// validate that peice_from is a nerve_method type
	for( n = 0; n < 8; n++ )
		if( DirDeltaMap[n].x == x && DirDeltaMap[n].y == y )
			break;
	if( n < 8 )
	{
		var success = this.brainboard.brain.LinkSynapseTo( synapse, neuron, n );
		return success;
	}
	return false;
}

NEURON_METHODS.prototype.ConnectBegin = function(  psv_to_instance,  x,  y
									  ,  peice_from,  psv_from_instance )
{
	var n;
	//if( peice_from == brainboard.NerveMethods )
	// maybe...
	var synapse = psv_from_instance;
	var neuron = psv_to_instance;
			if( this.brainboard.events["added"] )
				this.brainboard.events["added"]( this.brainboard.NervePeice, synapse );
	// validate that peice_from is a nerve_method type
	for( n = 0; n < 8; n++ )
		if( DirDeltaMap[n].x == x && DirDeltaMap[n].y == y )
			break;
	if( n < 8 )
		return this.brainboard.brain.LinkSynapseFrom( synapse, neuron, n );
	return false;
}
NEURON_METHODS.prototype.OnRightClick = function(  psv,  x,  y )
{
	console.log( "Show in info panel?");
	//ShowNeuronDialog( psv );
	return 1;
}

NEURON_METHODS.prototype.OnClick = function(  psv,  x,  y )
{
	if( this.brainboard.events["select"] )
		this.brainboard.events["select"]( psv );
	console.log( ("click on neuron! at %d,%d"), x, y );
	if( x == 0 && y == 0 )
	{
		// this is implied to be the current peice that
		// has been clicked on...
		// will receive further OnMove events...
		this.brainboard.board.LockPeiceDrag();
		return true;
	}
	else
	{
		if( !this.brainboard.board.BeginPath( this.brainboard.NervePeice, this.brainboard ) )
		{
			// attempt to grab existing path...
			// current position, and current layer
			// will already be known by the grab path method
			//brainboard.board.GrabPath();
		}
	}
	// so far there's nothing on this cell to do....
	return false;
}


//---------------------------------------------------

function  LIGHT_OUTPUT_METHODS(newbrainboard)
{
	if( !(this instanceof LIGHT_OUTPUT_METHODS) ) return new LIGHT_OUTPUT_METHODS(newbrainboard);
	NEURON_METHODS.call( this, newbrainboard );
	this.brainboard = newbrainboard;
}

LIGHT_OUTPUT_METHODS.prototype = Object.create( NEURON_METHODS.prototype );
LIGHT_OUTPUT_METHODS.prototype.constructor = BUTTON_INPUT_METHODS;

LIGHT_OUTPUT_METHODS.prototype.Create = function(  psvExtra )
	{
		//brainboard.create_input_type = (POUTPUT_INPUT)psvExtra;
		//brainboard.create_input_type.flags.bOutput = 0;
		console.log( ("Creating a new output (peice instance)") );
		return new this.brainboard.brain.Exporter( this.brainboard.brain, psvExtra );
	}

//---------------------------------------------------

function  BUTTON_INPUT_METHODS(newbrainboard)
{
	if( !(this instanceof BUTTON_INPUT_METHODS) ) return new BUTTON_INPUT_METHODS(newbrainboard);
	NEURON_METHODS.call( this, newbrainboard );
	this.brainboard = newbrainboard;
}

BUTTON_INPUT_METHODS.prototype = Object.create( NEURON_METHODS.prototype );
BUTTON_INPUT_METHODS.prototype.constructor = BUTTON_INPUT_METHODS;

BUTTON_INPUT_METHODS.prototype.Create = function(  psvExtra )
	{
		//brainboard.create_input_type = (POUTPUT_INPUT)psvExtra;
		//brainboard.create_input_type.flags.bOutput = 0;
		console.log( ("Creating a new input (peice instance)") );
		return new this.brainboard.brain.External( this.brainboard.brain, psvExtra );
	}
//---------------------------------------------------

function  SLIDER_INPUT_METHODS(newbrainboard)
{
	if( !(this instanceof SLIDER_INPUT_METHODS) ) return new SLIDER_INPUT_METHODS(newbrainboard);
	NEURON_METHODS.call( this, newbrainboard );
	this.brainboard = newbrainboard;
}

SLIDER_INPUT_METHODS.prototype = Object.create( NEURON_METHODS.prototype );
SLIDER_INPUT_METHODS.prototype.constructor = SLIDER_INPUT_METHODS;

SLIDER_INPUT_METHODS.prototype.Create = function(  psvExtra )
	{
		//brainboard.create_input_type = (POUTPUT_INPUT)psvExtra;
		//brainboard.create_input_type.flags.bOutput = 0;
		console.log( ("Creating a new input (peice instance)") );
		return new this.brainboard.brain.External( this.brainboard.brain, psvExtra );
	}



//---------------------------------------------------

function BackgroundMethods( _brainboard ) {
	if( !(this instanceof BackgroundMethods ) ) return new BackgroundMethods( _brainboard );

	this.brainboard = _brainboard;

	//typedef PEICE_METHODS Parent;

}

BackgroundMethods.prototype = Object.create( DefaultMethods.prototype );
BackgroundMethods.prototype.constructor = BackgroundMethods;


BackgroundMethods.prototype.Create = function() {
			return true;
		}
BackgroundMethods.prototype.Destroy = function() {
		
	}

BackgroundMethods.prototype.Connect  = function (  psvTo
				  , rowto,  colto
				  ,  psvFrom
				  ,  rowfrom,  colfrom )
	{
		return 0;
	}

BackgroundMethods.prototype.Update = function(  psv,  cycle )
	{
	      console.log( ("Update background - nothing to do.") );
		//parent.Update(psv,cycle);
	}

BackgroundMethods.prototype.OnClick = function(  psv,  x,  y )
	{
		this.brainboard.board.LockDrag();
		return true;
	}

BackgroundMethods.prototype.OnRightClick = function(  psv,  x,  y )
	{
		this.brainboard.RebuildComponentPopups(this);

		this.brainboard.hMenu.show( this.brainboard.board, this.brainboard.board.mousePos.x, this.brainboard.board.mousePos.y, (result)=>{
			if( result === undefined ) return; // canceled.
			//DebugBreak();
			const brainboard = this.brainboard;
			if( result >= MNU_ADD_INPUT_START && result < MNU_ADD_OUTPUT_START )
			{
				console.log( ("Put input peice at %d,%d"), x, y );
				var io_thing = new OUPUT_INPUT( brainboard );
				//io_thing.brainboard = brainboard;
				//io_thing.brain = io_thing.brainboard.brain;
				io_thing.conn = brainboard.connectors[ result-MNU_ADD_INPUT_START ];// io_thing.pbs.getinput( (result-MNU_ADD_INPUT_START) %80 );

				io_thing.neuron = io_thing.brain.GetInputNeuron( io_thing.conn );
				//brainboard.create_input_type = GetLink( &brainboard.inputs, result-MNU_ADD_INPUT_START );

				// really this only needs to pass the connector? or do I need to get a Input/Ouptut Neuron?
				brainboard.board.PutPeice( brainboard.InputPeice, x, y, io_thing );
			}
			else if( result >= MNU_ADD_OUTPUT_START && result <= MNU_ADD_OUTPUT_LAST )
			{
				console.log( ("Put output peice at %d,%d"), x, y );
				var io_thing = new OUPUT_INPUT( brainboard );
				//io_thing.brainboard = brainboard;
				//io_thing.brain = io_thing.brainboard.brain;
				io_thing.conn = brainboard.connectors[ result-MNU_ADD_OUTPUT_START ];// io_thing.pbs.getoutput( (result-MNU_ADD_OUTPUT_START)%80 );

				// really this only needs to pass the connector? or do I need to get a Input/Ouptut Neuron?
				brainboard.board.PutPeice( brainboard.OutputPeice, x, y, io_thing );
			}
			else switch( result )
			{
			case MNU_ADDNEURON:
				console.log( ("Put neuron peice at %d,%d"), x, y );
				var newN = brainboard.board.PutPeice( brainboard.NeuronPeice, x, y, 0 );
				if( brainboard.events["added"] )
					brainboard.events["added"](  brainboard.NeuronPeice,newN );
				return true;
			case MNU_ADDOSC:
				console.log( ("Put osc peice at %d,%d"), x, y );
				var newN = brainboard.board.PutPeice( brainboard.OscillatorPeice, x, y, 0 );
				if( brainboard.events["added"] )
					brainboard.events["added"]( brainboard.OscillatorPeice, newN );
				return true;
			case MNU_ADDTICKOSC:
				console.log( ("Put tickosc peice at %d,%d"), x, y );
				var newN = brainboard.board.PutPeice( brainboard.TickOscillatorPeice, x, y, 0 );
				if( brainboard.events["added"] )
					brainboard.events["added"]( brainboard.TickOscillatorPeice,newN );
				return true;
			case MNU_ZOOM:
			case MNU_ZOOM+1:
			case MNU_ZOOM+2:
				brainboard.scale =  result - MNU_ZOOM;
				brainboard.board.SetScale( result - MNU_ZOOM );
				break;
			case MNU_SAVE:
			{
							var name = PickBoardName( null, false );
							if( name )
								brainboard.board.Save( null, name );
			}

				break;
			case MNU_LOAD:
				{
					var name = PickBoardName( null, true );
					if( name )
						brainboard.board.Load( null, name );
				}
				break;
			case MNU_CLOSE:
				//delete brainboard;
				return false;
			}
		} )
		return true;
	},
BackgroundMethods.prototype.OnDoubleClick = function(  psv,  x,  y )
	{
		 result = TrackPopup( brainboard.hMenu, null );
		return true;
	}

//--------------------------- Oscillator Methods ------------------------------

function  OSCILLATOR_METHODS(newbrainboard)
{
	// these methods are passed a psvInstance
	// which is the current neuron instance these are to wokr on
	// this valud is retrieved and stored (by other portions) by the create() method
	this.brainboard = newbrainboard;


}

OSCILLATOR_METHODS.prototype = Object.create( NEURON_METHODS.prototype );
OSCILLATOR_METHODS.prototype.constructor = NEURON_METHODS;

OSCILLATOR_METHODS.prototype.Create = function(  psvExtra )
	{
		console.log( "Creating a new neuron (peice instance)");
		return this.brainboard.brain.Oscillator( );
	}

	
//--------------------------- Tick Oscillator Methods ------------------------------

function TICK_OSCILLATOR_METHODS(newbrainboard)
{
	// these methods are passed a psvInstance
	// which is the current neuron instance these are to wokr on
	// this valud is retrieved and stored (by other portions) by the create() method
	this.brainboard = newbrainboard;


}

TICK_OSCILLATOR_METHODS.prototype = Object.create( NEURON_METHODS.prototype );
TICK_OSCILLATOR_METHODS.prototype.constructor = NEURON_METHODS;

TICK_OSCILLATOR_METHODS.prototype.Create = function(  psvExtra )
{
	console.log( "Creating a new tick Oscillator (peice instance)");
	return new this.brainboard.brain.TickOscillator( this.brainboard.brain, 1000 );
}

	

//--------------------------- Quick Popup Menu System ------------------------------

var mouseCatcher = document.getElementById( "mouseCatcher" );
var topMenu;
mouseCatcher.addEventListener( "click", (evt)=>{
	mouseCatcher.style.visibility = "hidden";
	if( topMenu )
		topMenu.hide( true );
} );
	

function createPopup() {
	var menu = {
		items: [],
		parent : null,
		container : document.createElement( "div" ),
		board : null,
		// hMenu, MF_STRING, MNU_ADDNEURON, ("Add &Neuron") );
		appendItem( _flags, value, text ) {
			if( _flags & MF_SEPARATOR) {
				var newItem = document.createElement( "HR" );
				this.container.appendChild( newItem );

			}else {
				var newItem = document.createElement( "A" );
				var newItemBR = document.createElement( "BR" );
				this.container.appendChild( newItem );
				this.container.appendChild( newItemBR );
				var flags = _flags;
				newItem.value = value;
				newItem.textContent = text;
				newItem.className = "popup";
				if( flags & MF_POPUP ) {
					value.parent = this;
					newItem.addEventListener( "mouseover", (evt)=>{
						var r = newItem.getBoundingClientRect();
						console.log( "Item is clicked show that.", evt.target.value, evt.clientX, evt.clientY );

						newItem.value.show( this.board, evt.clientX, r.top - 10, this.cb );
					} );
					newItem.addEventListener( "mouseout", (evt)=>{
						var r = newItem.getBoundingClientRect();
						console.log( "Item is clicked show that.", evt.target.value, evt.clientX, r.top );
						if( evt.toElement !== newItem.value.container )		
							newItem.value.hide();
					} );
				} else
					newItem.addEventListener( "click", (evt)=>{
						this.cb( evt.target.value );
						console.log( "Item is clicked.", evt.target.value );
						this.hide( true );
					} );
			}
		},
		hide( all ) {
			this.container.style.visibility = "hidden";
			if( this.parent ) {
				if( all )
					this.parent.hide( all );
			} else {
				mouseCatcher.style.visibility = "hide"
			}
		},
		show( board, x, y, cb ) {
			this.board = board;
			this.cb = cb;
			mouseCatcher.style.visibility = "visible"
			this.container.style.visibility = "inherit";
			this.container.style.left = x;
			this.container.style.top = y;
		},
		reset() {
			console.log( "hide everything?" );	
		}
	};
	mouseCatcher.appendChild( menu.container );
	menu.container.className = "popup";
	menu.container.style.zIndex = 50;

	return menu;
}

