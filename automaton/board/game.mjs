
import Brain from "./brain/brain.mjs";
import {BrainBoard} from "./board/brainshell.mjs"

import * as switcher from "./switcher.mjs";
import * as testPanel from "./testPanel.mjs";
import * as analyzer from "./analyzer.mjs";
import * as shapes from "./board/shapes.mjs";

const journal = [ 
	{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">1</SPAN>
		<BR>
        	<CENTER>Observations<BR>
                on<BR>Certain Properties<BR>
                of<BR>
                Components<BR>
                of<BR>
                Synthetic Brains<BR>
                <BR><BR><BR>
                [Click on right side of page<BR>
		to go to next page]<BR>
          ` }
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">1</SPAN>
		<BR>
        	I have returned to the lab to continue<BR>
                my experiments on the brain components<BR>
                <BR>
                They are constructing a bug in the<BR>
                workshop.  Once it is completed I will be<BR>
                able to use my knowledge of synthetic<br>
                brains to control it.<BR>
                <BR>
                I plan to do a series of experiemnts.<BR>
                Each will involve creating a brain to<BR>
                perform a specific function.  The brains<BR>
                will be built on the brain board<BR>
                <BR>
                [Nav instructuions to previous page]<BR>
                [nav instructions to exit]
        `}
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">1</SPAN>
		<BR>
        	Monitoring Equpment<BR>
                <BR>
                The brain will be used to control lights in<BR>
                response to inputs from switches.<BR>
                <BR>
                THe input from the switches and the<BR>
                output to the lights will be monitored by<BR>
                a Logic Analyzer.  It shows the level of the<BR>
                output in blue.<BR>
                <BR>
                It can be preprogrammed with the<BR>
                expected output (shown in gold during<BR>
                a test) and will signal if the actal output<BR>
                is wrong.<BR>
         `
          , activate : ()=>{
          	//showAnalyzer();
                // add input
                // add output
          }
         }
	

        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">1</SPAN>
		<BR>
        	The logic analyzer and siwtches are run<BR>
                by control boxes on the shelf [above].<BR>
                <BR>
                Flip the switch to "Run" to start things<BR>
                running.<BR>
                <BR>
                Press the "Reset" Button to clear the<BR>
                screen and return things to their original<BR>
                position.<BR>
                <BR>
                TO test a brain, press the "Test" Button<BR>
                then flip the switch to "Run".  If the<BR>
                brain has done what it should when the<BR>
                timer reaches zero, the experiment is a<BR>
                success.<BR>
         `}
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">1</SPAN>
		<BR>
        	Signals and Lines<BR>
                I have discovered that bug brains<BR>
                operate on signals which range from<BR>
                0(off) to 100(on).<BR>
                <BR>
                The signals enter the brain through the<BR>
                input nodes, travel along lines and exit<BR>
                through output nodes.<BR>
                <BR>
                Input Node - Line - Output Node<BR>
                <DIV ID="jim1"> </DIV><BR>
                A line is made by grabbing the edge of a<BR>
                node and dragging it out.  Drop the line<BR>
                on the center of the target node.<BR>
                
         `
         , inserts: { 
                jim1:shapes.makeLightOutput()
        }
	, activate : setupLightOutput
        }
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
        	Experiment 1: The Start<BR>
                I have connected the input node to an<BR>
                automatic switch.  The output node<BR>
                goes to the light.  To confirm my theory<BR>
                on the previous page, I will attempt to<BR>
                make a brain where the light will com<BR>
                on when the switch is on.<BR>
                <BR>
                <SPAN ID="jim1"></SPAN><SPAN style="line-height:400%;vertical-align:top">Input from switch</SPAN><BR>
                <SPAN ID="jim2"></SPAN><SPAN style="line-height:400%;vertical-align:top">Output to light</SPAN><BR>
                <BR>
                [Build a brain on the Brain Board]<BR>
                [To test, press Test and switch to Run]<BR>
                [Go to the next page when successful]<BR>
         `
         , inserts: { 
                jim1:shapes.makeButtonInput()
                , jim2:shapes.makeLightOutput()
         }
         , locked : true
         }
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
		A Success!!!!!<BR>
		<BR>
		They have started work on the bug in the<BR>
		workshop.  I had beter hurry up and<BR>
		complete these experiments.<BR>
		<BR>
		There seems to be a space for connecting<BR>
		up to 8 lines to the input node.  In<BR>
		theory then I should be able to drive<BR>
		more than one light from the same input.<BR>
		I'll have to test this.<BR>
		<BR>
		<BR>
		<BR>
		<BR>
         `}
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
		Experiment 2: Two Lights<BR>
		I have connected the input node to an<BR>
		automatic switch.  There are two output<BR>
		nodes - each goes to a light.  I will<BR>
		attempt to make a brain where both<BR>
		lights come on when the switch is on.<BR>
		<BR>
		<BR>
                <DIV ID="jim1"></DIV>Input from switch<BR>
                <DIV ID="jim2"></DIV>Output to lights 1 and 2<BR>
         `
         , inserts: { 
                jim1:shapes.makeButtonInput()
                , jim2:shapes.makeLightOutput()
         }
	 , locked:true
	}
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
		Two in a row!!<BR>
		<BR>
		Much excitement.  Having a party<BR>
		to celebrate.  Maybe I could set<BR>
		up some lights???<BR>
		<BR>
		Might as well do it as an<BR>
		experiment...<BR>
		<BR>
		<BR>
		<BR>
		<BR>
		<BR>
         `}
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
		Experiment 3: Disco<BR>
		I have set up a second faster automatic<BR>
		switch and there are now four lights.<BR>
		I want lights 1 and 3 to swtich slowly<BR>
		and lights 2 and 4 to switch quickly.<BR>
		<BR>
		<DIV ID="jim1"></DIV> Input from 1 and 2<BR>
		<DIV ID="jim2"></DIV> output to lights 1,2,3 and 4.<BR>
		[Lines can be removed by grabbing<BR>
		them in one of the 8 grid squares<BR>
		that surround the node then dragging<BR>
		them away and dropping them]<BR>
         `
         , inserts: { 
                jim1:shapes.makeSliderInput()
                , jim2:shapes.makeLightOutput()
         }
	 , locked:true
	}
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
                Neurons<BR>
                The large green spheres are neurons.<BR>
                Neurons are the thinking part of a brain.<BR>
                these seem to be simplified versions of<BR>
                real neurons.  Neurons in general have a<BR>
                threshold.  If the input to the neuron is <BR>
                below the threshold the neuron is off<BR>
                (output 0).  If the input to the neuron<BR>
                 is at or above the threshold the neuron is<BR>
                 on (output 100).<BR>
                 <BR>
                 If this is true for these neurons the I<BR>
                 could make a brain which switches on a<BR>
                 light when the input is above some value.<BR>
                <BR>
                
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 4: Neuron Threshold<BR>
                The input now comes from a slider.<BR>
                The slider produces a variable signal in<BR>
                the range from 0 to 100.  I want the light to<BR>
                switch on when the signal is 80 or above.<BR>
                <BR>
                <DIV ID="jim1"></DIV> Input from slider : 0 to 100
                <BR>
                <DIV ID="jim2"></DIV> Output to light.<BR>
                <BR>
                [Click waste bin to clear the brain]<BR>
                [Click larg egreen button to add neuron]<BR>
                [Right click on neuron to set threshold]<BR>
                [See Manual (blue book above) for help<BR>
                with connection neurons]
         `
         , inserts: { 
                jim1:shapes.makeSliderInput()
                , jim2:shapes.makeLightOutput()
         }
         , locked:true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                I have noticed that music equipment<BR>
                uses a seris of lights to indicate sound<BR>
                volume.  When the volume gets larger<BR>
                thre are more lights lit.<BR>
                <BR>
                It should be possible to duplicate this<BR>
                using several neurons.<BR>
                <BR>
                [On the Logic Analyzer, the blue line<BR>
                shows the output and the gold line shows<BR>
                the expected output.  The blue line should<BR>
                overlay the gold line.  If you can see a gold<BR>
                line the otuput is wrong and the test <BR>
                will fail]
         `}
        ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 5: Light Scale<BR>
                The input comes from the slider.<BR>
                There are four lights that should be lit<BR>
                at equally spaced intervals to show the<BR>
                value of the input.  The more light son,<BR>
                the higher the input.<BR>
                <BR>
                <DIV ID="jim1"></DIV> Input from slider: 0 to 100<BR>
                <BR>
                <DIV ID="jim2"></DIV>Output to lights 1,2,3 and 4<BR>
                <BR>
                <BR>
                <BR>
                <BR>
         `
         , inserts: { 
                jim1:shapes.makeSliderInput()
                , jim2:shapes.makeLightOutput()
         }
         , locked:true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Synapses<BR>
                The input to a neuron comes through a<BR>
                synapse (shown as a blue or red blob<BR>
                on the neuron).  Each synapse has a<BR>
                weight between -100 and 100.  This is<BR>
                the percent of the signal the synapse<BR>
                passes through to the neuron.<BR>
                <BR>
                If there is mroe than one input to a<BR>
                neuron, then the input signal is the sum<BR>
                of each input signal times the weight of<BR>
                its synapse.  If this sum exceeds the<BR>
                threshold the neuron switches on.<BR>
                <BR>
                [Right click on a synapse to set the weight]<BR>
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Computing with Neurons<BR>
                By setting the synapse weights and the<BR>
                neuron threshold it should be possible<BR>
                to perform logic operation with<BR>
                neurons.<BR>
                <BR>
                These logic operations are the building<BR>
                blocks for digital computers. In<BR>
                computers, signals are either 0 or 1.<BR>
                The equivalent signals in Bug Brain are<BR>
                0 (light off) and 100(light on).<BR>
                <BR>
                <BR>
                <BR>
                <BR>
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 6: Or<BR>
                The light should go on if switch 1 OR<BR>
                switch 2 is on (or both are on).<BR>
                <BR>
                <BR>
                <IMG></IMG>Input from switches 1 and 2<BR>
                <BR>
                <IMG></IMG>Output to light<BR>
                <BR>
         `
         , locked:true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 7: And<BR>
                The light should go on if switch 1 AND<BR>
                switch 2 are on.<BR>
                <BR>
                <BR>
                <IMG></IMG>Input from switches 1 and 2<BR>
                <BR>
                <IMG></IMG>Output to light<BR>
                <BR>
         `
         , locked:true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 8: Inhibition <BR>
                Synapses can have negative weights.<BR>
                A negative input is subtracted from<BR>
                the input sum, so these synapses<BR>
                inhibit the neuron.<BR>
                <BR>
                In this experiment the light should<BR>
                be on when switch 2 is on and<BR>
                switch 1 is off.<BR>
                <BR>
                <BR>
                <IMG></IMG>Input from switches 1 and 2<BR>
                <BR>
                <IMG></IMG>Output to light<BR>
                <BR>
         `
         , locked:true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
                Experiment 9: Inverter <BR>
                There is a single input and output. The<BR>
                light should go on if the switch is NOT<BR>
                on.<BR>
                <BR>
                <BR>
                <IMG></IMG>Input from switch<BR>
                <BR>
                <IMG></IMG>Output to light<BR>
                <BR>
         `
         , locked:true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Exclusive Or (Xor)<BR>
                The output is on if one or other of the<BR>
                inputs is on but not if both are on.<BR>
                <BR>
                This is a function with a bit of history.<BR>
                Minsky and Papert showed that a single<BR>
                neuron could not do it.  They are<BR>
                generally credited with stpping<BR>
                anyone working on neuron networks<BR>
                during the 1970's.  Interest returned in<BR>
                the 1980's with the introduction of the<BR>
                idea of multiple layers of neurons.<BR>
                <BR>
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 10: Xor<BR>
                The light should be on if one of the<BR>
                switches is on but not if both are on.<BR>
                <BR>
                <BR>
                <IMG></IMG>Input from switch<BR>
                <BR>
                <IMG></IMG>Output to light<BR>
                <BR>
         `
         , locked : true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Success<BR>
                <BR>
                The lady bug is complete.<BR>
                It is time to leave the lab<BR>
                and go into the real world.<BR>
                <BR>
                <BR>
                <BR>
                <BR>
                <BR>
                <BR>
                <BR>
         `
         , locked : true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
         `}
         ,{ HTML : `
         `}
        ,{ HTML : `
         `}
        ,{ HTML : `
         `}
        
        ];

const journal2 = [ 
        { HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
                <CENTER>
                Observations<BR>
                on<BR>
                the Application<BR>
                of<BR>
                Synthetic Brains<BR>
                to<BR>
                the Survival and Feeding<BR>
                of<BR>
                Cocinella Septumpunctata<BR>
                <BR>
                <BR>
                <BR>
           `
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                We have set up an observation post in<BR>
                a forest clearing.  The Lady Bug is<BR>
                visible on a branch of a tree below us.<BR>
                <BR>
                Three aphids are also on the branch.<BR>
                The Lady Bug will eat the aphids if it<BR>
                comes across them.  The goal is to build<BR>
                a brain to get the Lady Bug to the<BR>
                aphids while staying on the branch.<BR>
                <BR>
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 1: Full Steam Ahead<BR>
                The bug can tell how wide the branch is<BR>
                in front of it.  The input varies between<BR>
                0 (no branch) to 100 (full branch).  The<BR>
                output causes the bug to move forward.<BR>
                <BR>
                <BR>
                <IMG></IMG>Input : branch width<BR>
                <BR>
                <IMG></IMG>Output : go forward<BR>
                <BR>
           `
           , locked : true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 2: Not so fast<BR>
                The input and output are the same but<BR>
                the branch has been trimmed.<BR>
                <BR>
                <BR>
                <IMG></IMG>Input : branch width<BR>
                <BR>
                <IMG></IMG>Output : go forward<BR>
                <BR>
           `
           , locked : true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 3: Eye in the Sky<BR>
                The Lady Bug now has a primitive form<BR>
                of eye.  It can only detect the<BR>
                difference between dark (0) and <BR>
                light(100), but this might e useful.<BR>
                <BR>
                <BR>
                <IMG></IMG>Input : branch width<BR>
           `
           , locked : true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
                <BR>
                Experiment 4: A Turn for the Better<BR>
                THe Lady Bug can now turn to the left<BR>
                or right and detect when it bumps its<BR>
                nose.
                <BR>
                <BR>
                <IMG></IMG>Input : bump nose<BR>
                <BR>
                <IMG></IMG>Output : turn left<BR>
                <BR>
                <IMG></IMG>Output : turn right<BR>
           `
           , locked : true
        }
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
         `}
         ,{ HTML : `
		<SPAN ID="pageNum" style="float:right;margin-right:10">6</SPAN>
		<BR>
           `
           , locked : true
        }

];


var gameState = {
	journalState : 0,
	progressLocked : false,
}

var neuronTable = setupNeuronTable( document.getElementById("statusTable"))

var boardFrame = document.getElementById( "boardFrame" );
var brain = Brain();

function brainTicker() {
        brain.step();
        setTimeout( brainTicker, 1 );
}
brainTicker();

var brainBoard = new BrainBoard( brain, boardFrame );

brainBoard.addEventListener( "added", (n)=>{
        if( n instanceof brain.Neuron ) {
                neuronTable.addNeuron( n );
        }
        if( n instanceof brain.Synapse )  {
                neuronTable.addSynapse(n);
        }
})

var notebookPanel = document.getElementById( "notebookPanel" );
notebookPanel.addEventListener( "click", (evt)=>{
		if( evt.offsetX > 100 )
			setPage( gameState.journalState+1 );
		else if( gameState.journalState )
			setPage( gameState.journalState-1 );
	} );
notebookPanel.innerHTML = journal[gameState.journalState].HTML;

var activators = [];

function testSwitch() {
	var newDiv = document.createElement( "div" );
        newDiv.style.display = "inline-block";
        var tmp;
	newDiv.appendChild( tmp = switcher.animator(0.75) );
        activators.push( tmp );
	newDiv.appendChild( tmp = switcher.animator(0.223) );
        activators.push( tmp );
	document.body.appendChild( newDiv );
}

function testTestPanel() {
	var newDiv = document.createElement( "div" );
	newDiv.style.height = 120;
	newDiv.style.width = 500;
	newDiv.style.position = "relative";
        newDiv.style.display = "inline-block";
	var svg;

	newDiv.appendChild( svg = testPanel.speaker() );
svg.style.height = "100%";
svg.style.width = "15%";
  svg.setAttribute( "viewBox", "0 0 130 170")
svg.setAttribute( "preserveAspectRatio", "xMaxYMax" );

        newDiv.appendChild( svg = testPanel.testButton() );
svg.style.height = "100%";
svg.style.width = "25%";
  svg.setAttribute( "viewBox", "0 100 200 50")
svg.setAttribute( "preserveAspectRatio", "xMaxYMax" );

        newDiv.appendChild( svg = testPanel.runStop() );
svg.style.height = "100%";
svg.style.width = "25%";
  svg.setAttribute( "viewBox", "0 100 200 50")
svg.setAttribute( "preserveAspectRatio", "xMaxYMax" );

        newDiv.appendChild( svg = analyzer.makeAnalyzer( (n)=>{
        	if( n > 4 ) {
                	return 0;
                }
                else {
                	if( n < activators.length ) 
                        	return activators[n].getValue() * 100;
                        return 0;
                }
        }) );

        svg.style.height = "100%";
        svg.style.width = "30%";
        svg.setAttribute( "viewBox", "0 100 430 170")
        svg.setAttribute( "preserveAspectRatio", "xMaxYMax" );

        newDiv.appendChild( shapes.makeSlider() );
	//newDiv.appendChild( switcher.animator(4) );
	document.body.appendChild( newDiv );
}

function setupToolPanel() {
        var tooldiv = document.getElementById("boardToolsFrame" );
        var tool;
         tooldiv.appendChild( tool = shapes.makeNeuron() );
         tool.addEventListener( "click", ()=>{
                 neuronTable.addNeuron( "a" )
         })
         tooldiv.appendChild( shapes.makeNode() );
         tooldiv.appendChild( shapes.makeTrash() );
         tooldiv.appendChild( shapes.makePowerOutput() );

         tooldiv.appendChild( shapes.makeButtonInput() );
         tooldiv.appendChild( shapes.makeLightOutput() );
         tooldiv.appendChild( shapes.makeSliderInput() );
        
}

setupToolPanel();

testTestPanel();
testSwitch();

function fixupImages() {
        journal.forEach( page=>{

                notebookPanel.innerHTML = page.HTML;
                var pageNum = notebookPanel.querySelector(`[id="pageNum"]`)
                if( pageNum ) {
                        pageNum.textContent = '' + (gameState.journalState + 1);
                        if( page.inserts ) {
                                var IDs = Object.keys( page.inserts );
                                IDs.forEach( id =>{
                                        var img;
                                        img = notebookPanel.querySelector(`[id="${id}"]`);
                                        if( img )
                                        img.appendChild( page.inserts[id] );        
                                })
                        }

                }
                page.HTML = notebookPanel.innerHTML;

        })
}

fixupImages();
setPage( 0 )

//------------ SET PAGE ROUTINE ------------------------------

function setPage( newPage )
{
	if( gameState.progressLocked ) {
		if( newPage > gameState.journalState ) {
		 	return;
		}
	}
	gameState.journalState = newPage;

	gameState.progressLocked = journal[gameState.journalState].locked || false;

	notebookPanel.innerHTML = journal[gameState.journalState].HTML;
	var pageNum = notebookPanel.querySelector(`[id="pageNum"]`)
	if( pageNum ) {
                pageNum.textContent = '' + (gameState.journalState + 1);


        }
	
}

//------------ PAGE ACTIVATION ROUTINES ------------------------------

function setupLightOutput() {
	
}


function setupNeuronTable( table ) {
        var statuses = {
                table : table,
                clear() {
                        while(this.table.hasChildNodes())
                        {
                                this.table.removeChild(this.table.firstChild);
                        }
                },
                addNeuron( n ) {
                        var newRow = this.table.insertRow();
                        var newRow2 = this.table.insertRow();
                        neuron( newRow, newRow2, n );
                },
                addSynapse( n ) {
                        var newRow = this.table.insertRow();
                        var newRow2 = this.table.insertRow();
                        synapse( newRow, newRow2, n );
                }
        }
        statuses.clear();
        return statuses;

        function neuron( row, row2, n ) {
                var underName = row2.insertCell();
                var data1 = row.insertCell();
                data1.innerText = n.type;
                var utilCell = row2.insertCell();
                utilCell.colSpan=2;
                var utilSlider = document.createElement( "input" )
                utilSlider.type = "range";
                utilSlider.min = 0;
                utilSlider.max = 100;
                utilCell.appendChild( utilSlider );
                utilSlider.addEventListener( "input", ()=>{
                        n.threshold = utilSlider.value;
                })

                var data2 = row.insertCell();
                data2.innerText = "123";
                var data3 = row.insertCell();
                data3.innerText = "bbb";
                var thisN = n;
                function neuronUpdateTick() {
                        data2.innerText = thisN.threshold;
                        var val = thisN.value.toFixed(3);
                        //val = val - (val % 0.001)
                        data3.innerText = val;
                        setTimeout( neuronUpdateTick, 250 );
                }
                neuronUpdateTick();
        }

        function synapse( row, row2, n ) {
                var underName = row2.insertCell();
                var data1 = row.insertCell();
                data1.innerText = "synapse";
                var utilCell = row2.insertCell();
                utilCell.colSpan=2;
                var utilSlider = document.createElement( "input" )
                utilSlider.type = "range";
                utilSlider.min = -100;
                utilSlider.max = 100;
                utilCell.appendChild( utilSlider );
                utilSlider.addEventListener( "input", ()=>{
                        n.gain = utilSlider.value/100;
                })

                var data2 = row.insertCell();
                data2.innerText = "123";
                var data3 = row.insertCell();
                data3.innerText = "bbb";
                var thisN = n;
                function neuronUpdateTick() {
                        data2.innerText = thisN.gain;
                        var val = thisN.value.toFixed(3);
                        //val = val - (val % 0.001)
                        data3.innerText = val;
                        setTimeout( neuronUpdateTick, 250 );
                }
                neuronUpdateTick();
        }

}

        