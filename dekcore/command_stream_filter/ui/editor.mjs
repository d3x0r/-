

import {CodeMirror} from "./codemirror/lib/codemirror.js";
import cm1 from "./codemirror/addon/scroll/annotatescrollbar.js"

import cm2 from "./codemirror/addon/search/matchesonscrollbar.js"
import cm3 from "./codemirror/addon/search/searchcursor.js"
import cm4 from "./codemirror/addon/search/match-highlighter.js"
import cm5 from "./codemirror/mode/javascript/javascript.js"

import {popups} from "./popups.mjs"


{
	const head = document.head;
	let l = document.createElement( "link" );
	l.rel = "stylesheet";
	l.id = "codeMirrorStyle";
	l.type="text/css";
	l.href="./codemirror/lib/codemirror.css";
	head.appendChild(l);

	l = document.createElement( "link" );
	l.rel = "stylesheet";
	l.id = "codeMirrorStyleTheme";
	l.type="text/css";
	l.href="./codemirror/theme/night.css";
	head.appendChild(l);
l.addEventListener( "load", ()=>{
	makeEditor();
} );

}

/*
<style>
      .CodeMirror {border-top: 1px solid black; border-bottom: 1px solid black;}
      .CodeMirror-focused .cm-matchhighlight {
        background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQI12NgYGBgkKzc8x9CMDAwAAAmhwSbidEoSQAAAABJRU5ErkJggg==);
        background-position: bottom;
        background-repeat: repeat-x;
      }
      .cm-matchhighlight {background-color: lightgreen}
      .CodeMirror-selection-highlight-scrollbar {background-color: green}
</style>

*/

function makeEditor() {

var popup = popups.create( "Code Editor" );

	var newTextArea = document.createElement( "textarea" );
	var newDiv = document.createElement( "div" );
	
	newDiv.className = "fillContent";
	newDiv.appendChild( newTextArea );
	popup.divContent.appendChild( newDiv );

    var editor = CodeMirror.fromTextArea(newTextArea, {
      lineNumbers: true,
      theme: "night",
    mode: "javascript",
    lineNumbers: true,
      extraKeys: {
        "F11": function(cm) {
          cm.setOption("fullScreen", !cm.getOption("fullScreen"));
        },
        "Esc": function(cm) {
          if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
        }
      }
      
    });
	editor.setSize( "40em", "25em" );
	popup.show();
	popup.move( 50, 0 );
}

//makeEditor();


export {makeEditor as editor};