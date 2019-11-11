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
        list : createList,
        makeCheckbox : makeCheckbox,
        makeNameInput : makeNameInput,
        makeTextInput : makeTextInput,
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



function createList( parentList, toString ) {
	var selected = null;
	var groups = [];
	var itemOpens = false;
	var groupList = {
		divTable:parentList.parent,		

		push(group, toString_, opens) {
			var itemList = this.divTable.childNodes;
			var nextItem = null;
			for( nextItem of itemList) {
				if( nextItem.textContent > toString(group) ) 
					break;
				nextItem = null;
			}
			
			var newLi = document.createElement( "LI" );
			newLi.className = "listItem"
			
			this.divTable.insertBefore( newLi, nextItem );//) appendChild( newLi );
			newLi.addEventListener( "click", (e)=>{
				e.preventDefault();
				if( selected )
					selected.classList.remove("selected");
				newLi.classList.add( "selected" );
				selected = newLi;
			})

			var newSubList = document.createElement( "UL");
			newSubList.className = "listSubList";
			if( parentList.parentItem )
				parentList.parentItem.enableOpen( parentList.thisItem );
			if( opens ) {
			//	this.enableOpen(newLi);
			}

			var treeLabel = document.createElement( "span" );
			treeLabel.textContent = toString(group);
			treeLabel.className = "listItemLabel";
			newLi.appendChild( treeLabel );

			//var newSubDiv = document.createElement( "DIV");
			newLi.appendChild( newSubList );
			//newSubList.appendChild( newSubDiv);
			var newRow;
			var listParams;
			var subItems = createList( listParams = { thisItem: null, parentItem: this, parent: newSubList }, toString_, true );
			groups.push( newRow={ opens : false, group:group, item: newLi, subItems:subItems, parent:parentList } );
			listParams.thisItem = newRow;
			return newRow;
		},
		enableOpen(item) {
			if( item.opens) return;
			item.opens = true;
				var treeKnob = document.createElement( "span" );
				treeKnob.textContent = "-";
				treeKnob.className = "knobOpen";
				item.item.insertBefore( treeKnob, item.item.childNodes[0] );
				treeKnob.addEventListener( "click", (e)=>{
					e.preventDefault();
					if( treeKnob.className === "knobClosed"){
						treeKnob.className = "knobOpen";
						treeKnob.textContent = "-";
						item.subItems.items.forEach( sub=>{
							sub.item.style.display="";
						})
					}else{
						treeKnob.className = "knobClosed";
						treeKnob.textContent = "+";
						item.subItems.items.forEach( sub=>{
							sub.item.style.display="none";
						})

					}
				})
		},
		enableDrag(type,item,key1,item2,key2) {
			item.item.setAttribute( "draggable", true );
			item.item.addEventListener( "dragstart", (evt)=>{
				//if( evt.dataTransfer.getData("text/plain" ) )
				//	evt.preventDefault();
				if( item2 )
					evt.dataTransfer.setData( "text/" + type, item.group[key1]+","+item2.group[key2])
				else
					evt.dataTransfer.setData( "text/" + type, item.group[key1])
				evt.dataTransfer.setData("text/plain",  evt.dataTransfer.getData("text/plain" ) + JSON.stringify( {type:type,val1:item.group[key1],val2:item2 && item2.group[key2] } ) );
				console.log( "dragstart:", type );
				if( item )
					evt.dataTransfer.setData("text/item", item.group[key1] );
				if( item2 )
					evt.dataTransfer.setData("text/item2", item2.group[key2] );
			})
		},
		enableDrop( type, item, cbDrop ) {
			item.item.addEventListener( "dragover", (evt)=>{
				evt.preventDefault();
				evt.dataTransfer.dropEffect = "move";
				//console.log( "Dragover:", evt.dataTransfer.getData( "text/plain" ), evt );
			})
			item.item.addEventListener( "drop", (evt)=>{
				evt.preventDefault();
				var objType = evt.dataTransfer.getData( "text/plain" );
				JSOX.begin( (event)=>{
					if( type === event.type ){
						//console.log( "drop of:", evt.dataTransfer.getData( "text/plain" ) );
						cbDrop( accruals.all.get( event.val1 ) );
					}
				} ).write( objType );
			})
		},
		update(group) {
			var item = groups.find( group_=>group_.group === group );
			item.textContent = toString( group );
		},
		get items() {
			return groups;
		},
		reset() {
			while( this.divTable.childNodes.length )
				this.divTable.childNodes[0].remove();
		}
	}
	return groupList;
}

function makeCheckbox( form, o, text, field ) 
{
	var textCountIncrement = document.createElement( "SPAN" );
	textCountIncrement.textContent = text;
	var inputCountIncrement = document.createElement( "INPUT" );
	inputCountIncrement.setAttribute( "type", "checkbox");
	inputCountIncrement.className = "checkOption rightJustify";
	inputCountIncrement.checked = o[field];
	//textDefault.

	var binder = document.createElement( "div" );
	binder.className = "fieldUnit";
	binder.addEventListener( "click", (e)=>{ if( e.target===inputCountIncrement) return; e.preventDefault(); inputCountIncrement.checked = !inputCountIncrement.checked; })
	form.appendChild(binder );
	binder.appendChild( textCountIncrement );
	binder.appendChild( inputCountIncrement );
	//form.appendChild( document.createElement( "br" ) );
	return {
		get checked() {
			return inputCountIncrement.checked;
		},
		set checked(val) {
			inputCountIncrement.checked = val;
		},
		get value() { return this.checked; },
		set value(val) { this.checked = val; },
	}
}

function makeTextInput( form, input, text, value, money, percent ){

	var textMinmum = document.createElement( "SPAN" );
	textMinmum.textContent = text;
	var inputMinimum = document.createElement( "INPUT" );
	inputMinimum.className = "textInputOption rightJustify";
	//textDefault.
	if( money ) {
		inputMinimum.value = utils.to$(input[value]);
		inputMinimum.addEventListener( "change", (e)=>{
			var val = utils.toD(inputMinimum.value);
			inputMinimum.value = utils.to$(val);
		})
	} else if( percent ) {
		inputMinimum.value = utils.toP(input[value]);
		inputMinimum.addEventListener( "change", (e)=>{
			var val = utils.fromP(inputMinimum.value);
			inputMinimum.value = utils.toP(val);
		})
	}else {
		inputMinimum.value = input[value];
	}

	var binder = document.createElement( "div" );
	binder.className = "fieldUnit";
	form.appendChild(binder );
	binder.appendChild( textMinmum );
	binder.appendChild( inputMinimum );
	return {
		get value () {
			if( money )
				return utils.toD(inputMinimum.value);
			if( percent ) 
				return utils.fromP(inputMinimum.value);
			return inputMinimum.value;
		},
		set value (val) {
			if( money )
				inputMinimum.value = utils.to$(val);
			else if( percent )
				inputMinimum.value = utils.toP(val);
			else
				inputMinimum.value = val;			
		}
	}
}

function makeNameInput( form, input, text ){
	var binder;
	var textLabel = document.createElement( "SPAN" );
	textLabel.textContent = text;

	var text = document.createElement( "SPAN" );
	text.textContent = input.name;

	var buttonRename = document.createElement( "Button" );
	buttonRename.textContent = "(rename)";
	buttonRename.className="buttonOption rightJustify";

	binder = document.createElement( "div" );
	binder.className = "fieldUnit";
	form.appendChild(binder );
	binder.appendChild( textLabel );
	binder.appendChild( text );
	binder.appendChild( buttonRename );
	//binder.appendChild( document.createElement( "br" ) );
	return {
		get value() {
			return text.textContent;
		}		,
		set value(val) {
			text.textContent = val;
		}
	}
}


export {popups};
