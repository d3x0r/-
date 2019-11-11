
import {popups} from "./popups.mjs";

import {JSOX} from "./jsox.mjs";

const l = {
	ws : null, 
	commandHistory : null,
	commandIndex : 0,
};

var history = localStorage.getItem( "Command History" );
l.commandHistory = history &&JSOX.parse( history ) || [];


function openSocket() {


  var ws = new WebSocket("ws://"+location.host+"/", "EntityControl");
  
  ws.onopen = function() {
    // Web Socket is connected. You can send data by send() method.
    //ws.send("message to send"); 
	l.ws = ws;
	ws.send( '{ op: "hello" }' );
  };
  ws.onmessage = function (evt) { 
  	const msg_ = JSON.parse( evt.data );
        if( !ws.processMessage || !ws.processMessage( msg_ ) )
	        processMessage( msg_ );
  };
  ws.onclose = function() { 
	l.ws = null;
	while( remoteConsole.output.childNodes[0] != remoteConsole.input )
		remoteConsole.output.childNodes[0].remove();

	setTimeout( openSocket, 5000 ); // 5 second delay.
  	// websocket is closed. 
  };


}


openSocket();

function processMessage( msg ) {
	if( msg.op === "write" ) {
		remoteConsole.write( msg.data );
	}
	
}

function createConsole() {
	
	var vcon = {
		root:null,
		output:null,
		input:null,
		write(buf){
			var newspan = document.createElement( "span" );
			newspan.className = "outputSpan";
			newspan.textContent = buf;
			this.output.insertBefore( newspan, this.input );

			this.output.scrollTop = this.output.scrollHeight;

			//var newspanbr = document.createElement( "br" );
			//this.output.insertBefore( newspanbr, this.input );
		},
	};
	var root = document.body;
	var firstKey = true;

	vcon.output = document.createElement( "div" );
	vcon.output.className = "consoleOutputContent";
	root.appendChild( vcon.output);

	vcon.input = document.createElement( "SPAN" );
	vcon.input.setAttribute( "contentEditable", true );
	vcon.input.className = "consoleinputContent";
	
	vcon.input.placeHolder = "<input text here>";


function setCaretToEnd(target/*: HTMLDivElement*/) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(target);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
  target.focus();
  range.detach(); // optimization

  // set scroll to the end if multiline
  target.scrollTop = target.scrollHeight; 
}

	vcon.input.addEventListener( "keydown", (evt)=>{
		console.log( evt );
		if( evt.key === 'Enter' && ( evt.ctrlKey || evt.altKey ) ) {
			evt.preventDefault();			
			sendCommand();
			return;
		} else if( evt.key === "ArrowUp" ) {
			if( firstKey ) l.commandIndex = 0;
			if( l.commandIndex < (l.commandHistory.length-1) ) {
				evt.preventDefault();			
				l.commandIndex++;
				vcon.input.textContent = l.commandHistory[l.commandHistory.length-l.commandIndex].command;

				evt.preventDefault();			
				//vcon.input.focus();
                                setCaretToEnd( vcon.input );
				
			}
		} else if( evt.key === "ArrowDown" ) {
			if( l.commandIndex > 0 ) {
				if( !firstKey )
					l.commandIndex--;
				if( l.commandIndex )
					vcon.input.textContent = l.commandHistory[l.commandHistory.length-l.commandIndex].command;
				else
					vcon.input.textContent = "";
				
				evt.preventDefault();			
				//vcon.input.focus();
                                setCaretToEnd( vcon.input );
			}
		}
		firstKey = false;


	} );

	vcon.output.appendChild( vcon.input );

	var inputSend = document.createElement( "INPUT" );
	inputSend.setAttribute( "type", "button" );
	inputSend.className = "consoleinputSender";
	inputSend.value = "Send Command";
	inputSend.addEventListener( "click", (evt)=>{
		evt.preventDefault();
		sendCommand();		
	} );

	vcon.output.appendChild( inputSend );

	vcon.input.focus();
	return vcon;


	function sendCommand() {
		var cmd = vcon.input.textContent;
			//var newspanbr = document.createElement( "br" );
			//vcon.output.insertBefore( newspanbr, vcon.input );
		l.commandHistory.push( { command:cmd } );
		firstKey = true;
		
		localStorage.setItem( "Command History", JSOX.stringify( l.commandHistory ) );
		l.ws.send( JSON.stringify( { op:"write", data:cmd } ) );
		vcon.input.textContent = '';
		vcon.input.focus();
	}

}

const remoteConsole = createConsole();

remoteConsole.write( "Welcome to the virtual object playground...\n" );
