
export function makeAnalyzer( cb ) {
                var newSVG = document.createElementNS( "http://www.w3.org/2000/svg","svg" );

		newSVG.style.width = 420;
		newSVG.style.height = 130;

                var panelFrame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                panelFrame.setAttribute( "x", "0" );
                panelFrame.setAttribute( "y", "0" );
                panelFrame.setAttribute( "width", "420" );
                panelFrame.setAttribute( "height", "210" );
                panelFrame.setAttribute( "stroke", "none" );
                panelFrame.setAttribute( "fill", "#d0c090" );
                newSVG.appendChild( panelFrame );

                
                var panelFrame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                panelFrame.setAttribute( "x", "5" );
                panelFrame.setAttribute( "y", "5" );
                panelFrame.setAttribute( "width", "410" );
                panelFrame.setAttribute( "height", "120" );
                panelFrame.setAttribute( "stroke", "black" );
                panelFrame.setAttribute( "fill", "none" );
                newSVG.appendChild( panelFrame );
                

		var logicJack = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		logicJack.id = "logicJack";
		logicJack.setAttribute( "r", "5" );
		logicJack.setAttribute( "cx", "22" );
		logicJack.setAttribute( "cy", "40" );
                
		logicJack.setAttribute( "fill", "#657210" );
		logicJack.setAttribute( "stroke", "#805040" );
                logicJack.setAttribute( "stroke-width", "2" );
                newSVG.appendChild( logicJack );

		var logicJack = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		logicJack.id = "logicJack";
		logicJack.setAttribute( "r", "5" );
		logicJack.setAttribute( "cx", "22" );
		logicJack.setAttribute( "cy", "60" );
                
		logicJack.setAttribute( "fill", "#657210" );
		logicJack.setAttribute( "stroke", "#805040" );
                logicJack.setAttribute( "stroke-width", "2" );
                newSVG.appendChild( logicJack );

		var logicJack = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		logicJack.id = "logicJack";
		logicJack.setAttribute( "r", "5" );
		logicJack.setAttribute( "cx", "22" );
		logicJack.setAttribute( "cy", "80" );
                
		logicJack.setAttribute( "fill", "#657210" );
		logicJack.setAttribute( "stroke", "#805040" );
                logicJack.setAttribute( "stroke-width", "2" );
                newSVG.appendChild( logicJack );

		var logicJack = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		logicJack.id = "logicJack";
		logicJack.setAttribute( "r", "5" );
		logicJack.setAttribute( "cx", "22" );
		logicJack.setAttribute( "cy", "100" );
                
		logicJack.setAttribute( "fill", "#657210" );
		logicJack.setAttribute( "stroke", "#805040" );
                logicJack.setAttribute( "stroke-width", "2" );
                newSVG.appendChild( logicJack );


                var panelFrame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                panelFrame.setAttribute( "x", "45" );
                panelFrame.setAttribute( "y", "15" );
                panelFrame.setAttribute( "width", "350" );
                panelFrame.setAttribute( "height", "100" );
                panelFrame.setAttribute( "stroke", "white" );
                panelFrame.setAttribute( "fill", "black" );
                panelFrame.setAttribute( "stroke-width", "2" );
                newSVG.appendChild( panelFrame );

                var inputs = [
                	 { history:[], path:document.createElementNS("http://www.w3.org/2000/svg", "path" ) },
                	 { history:[], path:document.createElementNS("http://www.w3.org/2000/svg", "path" ) },
                	 { history:[], path:document.createElementNS("http://www.w3.org/2000/svg", "path" ) },
                	 { history:[], path:document.createElementNS("http://www.w3.org/2000/svg", "path" ) },
                         ]
		var outputs = [
                	 { history:[], path:document.createElementNS("http://www.w3.org/2000/svg", "path" ) },
                	 { history:[], path:document.createElementNS("http://www.w3.org/2000/svg", "path" ) },
                	 { history:[], path:document.createElementNS("http://www.w3.org/2000/svg", "path" ) },
                	 { history:[], path:document.createElementNS("http://www.w3.org/2000/svg", "path" ) },
                	]
		inputs.forEach( (put,n)=>{
                	put.path.setAttribute( "stroke", "red" );
                	newSVG.appendChild( put.path );
                } );
		outputs.forEach( (put,n)=>{
                	put.path.setAttribute( "stroke", "blue" );
                	newSVG.appendChild( put.path );
                } );
                
const lineLeft = 50;
const lineRight = 390;
const lineOne = 20;
const lineLength = 15000; 

                var prior = Date.now();
		function tick() {
			var path;
                        var now = Date.now();
                        var tickTotal;
			inputs.forEach( (put,n)=>{
	                        put.history.push( { del: now-prior, value: cb( n ) } );
                        	path = "M" + lineRight + "," + (lineOne + (n*20)) ;
                                tickTotal = 0;
                                for( var h = put.history.length - 1; h > 0; h-- ) {
                                	if( tickTotal > lineLength ) {
                                        	put.history.splice( 0, h );
                                                break;
                                        }
                                	var hist = put.history[h];
                                        var xPos = lineRight -  ((lineRight-lineLeft)*( (tickTotal+hist.del) / lineLength ))
	                        	path += "L" + xPos + "," + (lineOne + (n*20) + (hist.value / 10)) ;
                                        tickTotal += hist.del;
                                }
        	        	put.path.setAttribute( "d", path  );
	                } );
			outputs.forEach( (put,n)=>{
	                        put.history.push( { del: now-prior, value: cb( 4+n ) } );
                        	path = "M" + lineLeft + "," + (lineOne + 80 + (n*20)) ;
                        	path += "L"+  lineRight + "," + (lineOne+ 80 + (n*20)) ;
        	        	put.path.setAttribute( "d", path  );
	                } );

			prior = now;
                	setTimeout( tick, 100 );
                }
		tick();
                
                return newSVG;

}



