/*

stle classes
    frameContainer - the outer frame
    frameCaption - the top caption of the frame
    frameContent - the container of the frame's future content.
    frameClose - style of the upper close Item.
    captionButton - this is a button appearin in the caption (close)
    

var popup = popups.create( "caption" );
popup.show();
popup.hide();
popup.caption = "New Caption";
popup.divContent  // insert frame content here

*/


const popups = {
	create : createPopup,
	simpleForm : createSimpleForm,
	simpleNotice : createSimpleNotice,
}

var popupTracker;

function addCaptionHandler( c, popup_ ) {
	var popup = popup_;
	if( !popup )
	 	popup = createPopup( null, c );


	var mouseState = {
		frame:c.parentNode,
		x:0,y:0,
		dragging:false
	};

	function mouseHandler(c,state) {

		popup.divFrame.addEventListener( "mousedown", (evt)=>{
			popupTracker.raise( popup );
		} );
		
		var added = false;
		function mm(evt){
			evt.preventDefault();
			if( state.dragging ) {
				var pRect = state.frame.getBoundingClientRect();
				var x = evt.clientX - pRect.left;
				var y = evt.clientY - pRect.top;
				var x = evt.x - pRect.left;
				var y = evt.y - pRect.top;
				state.frame.style.left =parseInt(state.frame.style.left) + (x-state.x);
				state.frame.style.top= parseInt(state.frame.style.top) +(y-state.y);
				localStorage.setItem( state.frame.id + "/x", popup.divFrame.style.left );
				localStorage.setItem( state.frame.id + "/y", popup.divFrame.style.top );
			}
		}
		function md(evt){
			evt.preventDefault();
			var pRect = state.frame.getBoundingClientRect();
			popupTracker.raise( popup );
			state.x = evt.clientX-pRect.left;
			state.y = evt.clientY-pRect.top;
			state.x = evt.x-pRect.left;
			state.y = evt.y-pRect.top;
			state.dragging = true;
			if( !added ) {	
				added = true;
				document.body.addEventListener( "mousemove", mm );
				document.body.addEventListener( "mouseup", mu );
			}
		}
		function mu(evt){
			evt.preventDefault();
			state.dragging = false;
			added = false;
			document.body.removeEventListener( "mousemove", mm );
			document.body.removeEventListener( "mouseup", mu );
		}

		c.addEventListener( "mousedown", md );
		c.addEventListener( "mouseup", mu );
		c.addEventListener( "mousemove", mm );
	}
	mouseHandler(c, mouseState );

}

function initPopupTracker() {
	var tracker = {
		popups : [],
		raise( popup ) {
			var top = tracker.popups.length;
			var n;
			var from = Number(popup.divFrame.style.zIndex);
			if( from === top ) return;

			for( n = 0; n < tracker.popups.length; n++ ) {
				if( n == popup.index )
					popup.divFrame.style.zIndex = top;
				else {
					var thisZ = Number(tracker.popups[n].divFrame.style.zIndex);
					if( thisZ > from )
						tracker.popups[n].divFrame.style.zIndex = Number(tracker.popups[n].divFrame.style.zIndex) - 1;
				}
			}
		},
		find( id ) {
			return this.popups.find( popup=>popup.divFrame.id === id );
		},
		addPopup(popup) {
			popup.index = tracker.popups.length;
			popup.divFrame.style.zIndex = popup.index+1;
			tracker.popups.push( popup );
			popup.raise = function() {
				tracker.raise( popup)
			}
		}
	}
	return tracker;
}
popupTracker = initPopupTracker();


function createPopup( caption ) {
	const popupEvents = {
		close : [],
		show : [],
	};
	const  popup = {
		divFrame : document.createElement( "div" ),
		divCaption : document.createElement( "div" ),
                divContent : document.createElement( "div" ),
                divClose : document.createElement( "div" ),
		set caption(val) {
			popup.divCaption.innerText = val;
		},
		center() {
			var myRect = popup.divFrame.getBoundingClientRect();
			var pageRect = popup.divFrame.parentElement.getBoundingClientRect();
			popup.divFrame.style.left = (pageRect.width-myRect.width)/2;
			popup.divFrame.style.top = (pageRect.height-myRect.height)/2;
		},
		over( e ){
			var target = e.getBoundingClientRect();
			popup.divFrame.style.left = target.left;
			popup.divFrame.style.top = target.top;
		},
		on(event,cb) {
			if( cb && "function" === typeof cb )
				if( popupEvents[event] )
					popupEvents[event].push(cb);
				else
					popupEvents[event] = [cb];
			else {
				var cbList;
				if( cbList = popupEvents[event]  ) {
					cbList.forEach( cbEvent=>cbEvent( cb ));
				}
			}
		},
		hide() {
			this.divFrame.style.display = "none";
		},
		show() {
			this.divFrame.style.display = "unset";
			popup.on( "show", true );
		},
	}
	{
		popup.divFrame.className = "frameContainer";
		popup.divFrame.style.top = 0;
		popup.divFrame.style.left = 0;

		popup.divClose.className = "frameClose captionButton";
		popup.divClose.textContent = "X";
		popup.divClose.addEventListener( "click", (evt)=>{
			evt.preventDefault();
			popup.on( "close", true );
			popup.hide();
		})
		
		popup.divContent.className = "frameContent";
		popup.divCaption.className = "frameCaption";
                
		if( caption )
			popup.divCaption.textContent = caption;
        	popup.divCaption.appendChild( popup.divClose );
		popup.divFrame.appendChild( popup.divCaption );
		popup.divFrame.appendChild( popup.divContent );
                
		addCaptionHandler( popup.divCaption, popup );
		document.body.appendChild( popup.divFrame );
	}
	popupTracker.addPopup( popup );
	return popup;
}

function createSimpleForm( title, question, defaultValue, ok, cancelCb ) {
	const popup = popups.create( title );
	popup.on( "show", ()=>{
		if( "function" === typeof defaultValue ){
			input.value = defaultValue();
		}
		else
			input.value = defaultValue;
		input.focus();
		input.select();
	})
	popup.on( "close", ()=>{
		// aborted...
		cancel && cancel();
	});

	var form = document.createElement( "form" );
	form.className = "frameForm";
	form.setAttribute( "action", "none" );
	form.addEventListener( "submit", (evt)=>{
		evt.preventDefault();
		popup.hide();
		ok && ok(input.value);
	} );	
	form.addEventListener( "reset", (evt)=>{
		evt.preventDefault();
		popup.hide();
	} );	

	var text = document.createElement( "SPAN" );
	text.textContent = question;
	var input = document.createElement( "INPUT" );
	input.className = "popupInputField";
	input.setAttribute( "size", 45 );
	input.value = defaultValue;

	var okay = document.createElement( "BUTTON" );
	okay.className = "popupOkay";
	okay.textContent = "Okay";
	okay.setAttribute( "name", "submit" );
	okay.addEventListener( "click", (evt)=>{
		evt.preventDefault();
		popup.hide();
		ok && ok( input.value );
	})

	var cancel = document.createElement( "BUTTON" );
	cancel.className = "popupCancel";
	cancel.textContent = "Cancel";
	cancel.setAttribute( "type", "reset" );
	cancel.addEventListener( "click", (evt)=>{
		evt.preventDefault();
		popup.hide();
		cancelCb && cancelCb( );
	})

	popup.divFrame.addEventListener( "keydown", (e)=>{
		if(e.keyCode==27){
			e.preventDefault();
			popup.hide();
			cancelCb && cancelCb( );
		}
	})
	popup.divContent.appendChild( form );
	form.appendChild( text );
	form.appendChild( document.createElement( "br" ) );
	form.appendChild( input );
	form.appendChild( document.createElement( "br" ) );
	form.appendChild( document.createElement( "br" ) );
	form.appendChild( cancel );
	form.appendChild( okay );
	
	popup.center();
	popup.hide();
	return popup;
}

function createSimpleNotice( title, question, ok ) {
	const popup = popups.create( title );
	const show_ = popup.show.bind(popup);
	popup.show = function( caption, content ) {
		if( caption && content ) {
			popup.divCaption.textContent = caption;
			text.textContent = content;
		}
		else if( caption )
			text.textContent = caption;
		show_();
	}
	popup.on( "show", ()=>{
		okay.focus();
	})
	popup.on( "close", ()=>{
		// aborted...
		cancel && cancel();
	});

	var form = document.createElement( "form" );
	form.className = "frameForm";
	form.setAttribute( "action", "none" );
	form.addEventListener( "submit", (evt)=>{
		evt.preventDefault();
		popup.hide();
		//console.log( "SUBMIT?", input.value );
	} );	
	form.addEventListener( "reset", (evt)=>{
		evt.preventDefault();
		popup.hide();
	} );	

	var text = document.createElement( "SPAN" );
	text.textContent = question;

	var okay = document.createElement( "BUTTON" );
	okay.className = "popupOkay";
	okay.textContent = "Okay";
	okay.setAttribute( "name", "submit" );
	okay.addEventListener( "click", (evt)=>{
		evt.preventDefault();
		popup.hide();
		ok && ok( );
	})

	popup.divFrame.addEventListener( "keydown", (e)=>{
		if(e.keyCode==27){
			e.preventDefault();
			popup.hide();
			ok && ok( );
		}
	})
	popup.divContent.appendChild( form );
	form.appendChild( text );
	form.appendChild( document.createElement( "br" ) );
	form.appendChild( document.createElement( "br" ) );
	form.appendChild( okay );
	
	popup.center();
	popup.hide();
	return popup;
}


export {popups};
