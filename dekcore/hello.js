
//console.log( document, " ", Object.keys( document ) )

window.onload = ()=> {
    //document.body.on( "load", ()=> {
    label = document.createElement( "div" );
    label.style.position = "absolute";
    label.style.left = "0%";
    label.style.fontSize = "48px";
    label.style.textAlign = "center";
    label.style.width = "100%";
    label.innerHTML = "Hello";
    label.style.top = "47%";
    label.zIndex = 3;
    console.log( document.body )
    document.body.style.background = "rgba(0,0,0,0.5)";
    document.body.appendChild( label );
    //});
};

var more_script = require( "test.js" );




function require( name ) { _require( name, (response)=>{
	    var f = eval( response );    
	} ) 
};

function _require(theUrl, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}
