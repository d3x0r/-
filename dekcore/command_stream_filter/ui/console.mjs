
import {popups} from "./popups.mjs";


const l = {
	ws : null, 
};

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

	vcon.output = document.createElement( "div" );
	vcon.output.className = "consoleOutputContent";
	root.appendChild( vcon.output);

	vcon.input = document.createElement( "SPAN" );
	vcon.input.setAttribute( "contentEditable", true );
	vcon.input.className = "consoleinputContent";
	
	vcon.input.placeHolder = "<input text here>";
	vcon.input.addEventListener( "keydown", (evt)=>{
		console.log( evt );
		if( evt.key === 'Enter' && ( evt.ctrlKey || evt.altKey ) ) {
			evt.preventDefault();
			
			sendCommand();
		}
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
		l.ws.send( JSON.stringify( { op:"write", data:cmd } ) );
		vcon.input.textContent = '';
		vcon.input.focus();
	}

}

const remoteConsole = createConsole();

remoteConsole.write( "Welcome to the virtual object playground...\n" );
