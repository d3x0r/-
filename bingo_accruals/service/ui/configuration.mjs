
import {accruals} from "./accruals.mjs"
import {JSOX} from "./jsox.mjs"
import {popups} from "./popups.mjs" 
import {utils} from "./utils.mjs"
//import { link } from "fs";


const l ={
	// these are popup dialog forms.
	newActivity : null,
	newGroup : null,
	newInput : null,


	 activityList :null,
	 groupList :null,
	 inputList :null,

	 inputForms:[],
	 groupForms: [],

	 activities : [],
} ;

function addActivity( activity ){
	let listItem = l.activityList.push( activity, a=>a, true );
		
	let jlist = listItem.subItems.push( "Jackpots", groupToString, false );
	let ilist = listItem.subItems.push( "Inputs", inputToString, false );

	var activityControls = {
		activity:activity,
		jlist : jlist,
		ilist : ilist,
		listItem : listItem,
		addGroup(group) {
			var groupItem = activityControls.jlist.subItems.push( group, groupToString );
			groupItem.subItems.enableDrag("groupRemove", groupItem, "accrual_group_id", listItem, "accrual_activity_id" );
		},
		addInput(input) {
			activityControls.ilist.subItems.push( input, inputToString );
		},
	}
	l.activities.push( activityControls );

	listItem.subItems.enableDrop( "group", listItem, (group)=>{
		accruals.assignActivityGroup( activity, group );
	} );

	const editButton = document.createElement( "input");
	editButton.className = "activityEditButton";
	editButton.setAttribute( "type", "button" );
	editButton.value = "Edit";	
	editButton.addEventListener( "click", (evt)=>{
		evt.preventDefault();

		var activityEditor = popups.simpleForm( "Edit Activity"
			, "Enter activity name..."
			, activity.name
			, (newName)=>{
				if( activity.name !== newName ){
					const update = { accrual_activity_id:activity.accrual_activity_id, name : newName };
					accruals.updateActivity( update );										
				}
			},
			()=>{

			}
		);
		activityEditor.over( editButton );
		activityEditor.show();
		//activityEditor.
		//form.form.show();
	})
	listItem.item.insertBefore( editButton, listItem.item.childNodes[2] );
	

	activity.groups.forEach( activityControls.addGroup )
	activity.inputs.forEach( activityControls.addInput )



}

function addGroup( group ) {
	const listItem = l.groupList.push( group, a=>a, true );
	var act = listItem.subItems.push( "Activities", activityToString, false );
	var inp = listItem.subItems.push( "Inputs", inputToString, false );

	const form = { id:group.accrual_group_id, form:createGroupForm(group), alist:act, ilist:inp, listItem:listItem }
	l.groupForms.push( form );

	listItem.subItems.enableDrag( "group", listItem, "accrual_group_id" );
	listItem.subItems.enableDrop( "input", listItem, (input)=>{
		accruals.assignGroupInput( group, input );
	} );

	const editButton = document.createElement( "input");
	editButton.className = "groupEditButton rightJustify";
	editButton.setAttribute( "type", "button" );
	editButton.value = "Edit";	
	editButton.addEventListener( "click", (evt)=>{
		evt.preventDefault();
		form.form.show();
	})
	listItem.item.insertBefore( editButton, listItem.item.childNodes[2] );


	group.activities.forEach( activity=>{
		var newActivityItem = act.subItems.push( activity, (activity)=>activity.name );
		newActivityItem.subItems.enableDrag("groupRemove2", newActivityItem, "accrual_activity_id", listItem, "accrual_group_id" );

	})
	group.inputs.forEach( input=>{
		var newInputItem = inp.subItems.push( input, (input)=>JSOX.stringify(input.name) );
		newInputItem.subItems.enableDrag("inputRemove2", newInputItem, "accrual_input_group_id", listItem, "accrual_group_id" );
	})
}

function addInput( input ) {
	let listItem = l.inputList.push( input, a=>a,  true );
	var gro = listItem.subItems.push( "Groups", groupToString, false );
	const form = { id:input.accrual_input_group_id, form:createInputForm(input), glist:gro };
	l.inputForms.push( form );

	listItem.subItems.enableDrag( "input", listItem, "accrual_input_group_id" );

	const editButton = document.createElement( "input");
	editButton.className = "inputEditButton rightJustify";
	editButton.setAttribute( "type", "button" );
	editButton.value = "Edit";	
	editButton.addEventListener( "click", (evt)=>{
		evt.preventDefault();
		form.form.show();
	})
	listItem.item.insertBefore( editButton, listItem.item.childNodes[2] );



	/*
	listItem.subItems.push( "Activities", (group)=>group );
	var act = listItem.subItems.push( "Activities", (group)=>group );
	input.activities.forEach( activity=>{
		act.push( activity, (activity)=>activity.name );
	})
	*/
	input.groups.forEach( input=>{
		var newInputItem = gro.subItems.push( input, (input)=>JSOX.stringify(input.name) );
		newInputItem.subItems.enableDrag("inputRemove", newInputItem, "accrual_group_id", listItem, "accrual_input_group_id" );
	})

}

accruals.on( "load", (accruals)=>{
	// accruals loaded, can now load them...
	//console.log( "THis shold be stuff...", accruals);
	l.activityList.reset();
	l.groupList.reset();
	l.inputList.reset();
	l.inputForms.forEach( form=>form.form.hide() );
	l.inputForms.length = 0;
	l.groupForms.forEach( form=>form.form.hide() );
	l.groupForms.length = 0;


	accruals.activities.forEach( addActivity);
	accruals.groups.forEach( addGroup );
	accruals.inputs.forEach( addInput );
} );


accruals.on( "update", ()=>{
} );

accruals.on( "newActivity", addActivity )
accruals.on( "newGroup", addGroup )
accruals.on( "newInput", addInput );

accruals.on( "assignActivityGroup", (activity,group)=>{
	// will already BE assigned, just need to add some list itmes for this relationship.
	var activityControls = l.activities.find( a=>a.activity === activity );
	var groupItem = activityControls.jlist.subItems.push( group, groupToString );
	groupItem.subItems.enableDrag("groupRemove", groupItem, "accrual_group_id", activityControls.listItem, "accrual_activity_id" );

	var form = l.groupForms.find( f=>f.id === group.accrual_group_id );
	var newActivityItem = form.alist.subItems.push( activity, activityToString );

	newActivityItem.subItems.enableDrag("groupRemove2", newActivityItem, "accrual_activity_id" , groupItem, "accrual_group_id");

} );
accruals.on( "unassignActivityGroup", (activity,group)=>{

	var activityControls = l.activities.find( a=>a.activity === activity );
	var groupItemIndex = activityControls.jlist.subItems.items.findIndex( gi=>gi.group===group );
	var groupItem = activityControls.jlist.subItems.items[groupItemIndex];
	activityControls.jlist.subItems.items.splice( groupItemIndex, 1 );
	groupItem.item.remove();

	//activityControls.jlist.subItems.push( group, groupToString );

	var form = l.groupForms.find( f=>f.id === group.accrual_group_id );

	var activityItemIndex = form.alist.subItems.items.findIndex( ai=>ai.group===activity );
	var activityItem = form.alist.subItems.items[activityItemIndex];
	form.alist.subItems.items.splice( activityItemIndex, 1 );
	activityItem.item.remove();
	//form.alist.subItems.push( activity, activityToString );

})
accruals.on( "assignGroupInput", (group,input)=>{
	// will already BE assigned, just need to add some list itmes for this relationship.
	var form = l.groupForms.find( f=>f.id === group.accrual_group_id );
	var inputItem = form.ilist.subItems.push( input, inputToString );
	inputItem.subItems.enableDrag("inputRemove2", inputItem, "accrual_input_group_id", form.listItem, "accrual_group_id" );

	var iform = l.inputForms.find( f=>f.id === input.accrual_input_group_id );
	var newInputItem = iform.glist.subItems.push( group, groupToString );

	newInputItem.subItems.enableDrag("inputRemove", newInputItem, "accrual_group_id", inputItem, "accrual_input_group_id" );

} );

accruals.on( "unassignGroupInput", (group,input)=>{

	var form = l.groupForms.find( a=>a.id === group.accrual_group_id );

	var inputItemIndex = form.ilist.subItems.items.findIndex( ii=>ii.group===input );
	var inputItem = form.ilist.subItems.items[inputItemIndex];
	form.ilist.subItems.items.splice( inputItemIndex, 1 );
	inputItem.item.remove();

	//form.jlist.subItems.push( group, groupToString );

	var inputForm = l.inputForms.find( f=>f.id === input.accrual_input_group_id );

	var groupItemIndex = inputForm.glist.subItems.items.findIndex( ai=>ai.group===group );
	var groupItem = inputForm.glist.subItems.items[groupItemIndex];
	if( groupItem >= 0 ) {
		inputForm.glist.subItems.items.splice( groupItemIndex, 1 );
		groupItem.item.remove();
	}
	//form.alist.subItems.push( activity, activityToString );

})

accruals.on( "assignActivityInput", (activity,input)=>{

	var activityControls = l.activities.find( a=>a.activity === activity );
	var inputItem = activityControls.ilist.subItems.push( input, inputToString );
	inputItem.subItems.enableDrag("inputRemove", inputItem, "accrual_input_group_id", activityControls.listItem, "accrual_activity_id" );

} );

accruals.on( "unassignActivityInput", (activity,input)=>{

	var activityControls = l.activities.find( a=>a.activity === activity );
	var inputItemIndex = activityControls.ilist.subItems.items.findIndex( gi=>gi.group===input );
	if( inputItemIndex >= 0 ) {
		// no item yet?
		var inputItem = activityControls.ilist.subItems.items[inputItemIndex];
		activityControls.ilist.subItems.items.splice( inputItemIndex, 1 );
		inputItem.item.remove();
	}
})


accruals.on( "deleteActivity", (item)=>{
	l.activityList.delete( item );
	var id = l.activityForms.findIndex( form=>form.id===item.accrual_activity_id  );
	l.activityForms[id].hide();
	l.activityForms.splice( id, 1 );
} )
accruals.on( "deleteGroup", (item)=>{
	l.groupyList.delete( item );
	var id = l.groupForms.findIndex( form=>form.id===item.accrual_activity_id  );
	l.groupForms[id].hide();
	l.groupForms.splice( id, 1 );
	
} )
accruals.on( "deleteInput", (item)=>{
	l.inputList.delete( item );
	var id = l.inputForms.findIndex( form=>form.id===item.accrual_activity_id  );
	l.inputForms[id].hide();	
	l.inputForms.splice( id, 1 );
} );

accruals.on( "updateActivity", (item)=>{
	l.activityList.update( item )
	var form = l.inputForms.find( form=>form.id===item.accrual_activity_id );
	if( form )
		form.form.refresh();
	else
		console.log( "Failed to find form to update.") ;
 } );
accruals.on( "updateGroup", (item)=>{
	l.groupList.update( item )
	var form = l.groupForms.find( form=>form.id===item.accrual_group_id );
	if( form )
		form.form.refresh();
	else
		console.log( "Failed to find form to update.") ;
	
} );
accruals.on( "updateInput", (item)=>{
	l.inputList.update( item )
	var form = l.inputForms.find( form=>form.id===item.accrual_input_group_id );
	if( form )
		form.form.refresh();
	else
		console.log( "Failed to find form to update.") ;
	
} );

accruals.load();


function initDialogs() {
	{
		l.newActivity = popups.simpleForm( "Create New Activity"
			, "Enter activity name..."
			, ()=>{
				var n = 1;
				var nextName;
				while( accruals.activity( nextName= "Activity " + n ) )
					n++;
				return nextName;
			}
			, (newName)=>{
				if( accruals.createActivity( newName ) )
					l.notice.show( "Activity already exists:" + newName );
			},
			()=>{

			}
		);
		l.newGroup = popups.simpleForm( "Create New Prize"
			, "Enter prize name:"
			, ()=>{
				var n = 1;
				var nextName;
				while( accruals.group( nextName= "Jackpot " + n ) )
					n++;
				return nextName;
			}
			, (newName)=>{
				if( accruals.createGroup( newName ) )
					l.notice.show( "Prize already exists:" + newName );
			},
			()=>{

			}
		);
		l.newInput = popups.simpleForm( "Create New Input"
			, "Enter input name:"
			, ()=>{
				var n = 1;
				var nextName;
				while( accruals.input( nextName= "Sales " + n ) )
					n++;
				return nextName;
			}
			, (newName)=>{
				if( accruals.createInput( newName ) )
					l.notice.show( "Input already exists:" + newName );
			},
			()=>{

			}
		);
		l.notice = popups.simpleNotice( "Alert!", "To be updated...", ()=>{
			// show next notice.?
		})
	}
}

initDialogs();

const createActivity = document.getElementById( "createActivity" );
const createGroup = document.getElementById( "createGroup" );
const createInput = document.getElementById( "createInput" );

createActivity.addEventListener( "click", (evt)=>{
	evt.preventDefault();
	l.newActivity.over( evt.target );
	l.newActivity.show();
} );


createGroup.addEventListener( "click", (evt)=>{
	evt.preventDefault();
	l.newGroup.over( evt.target );
	l.newGroup.show();
} );


createInput.addEventListener( "click", (evt)=>{
	evt.preventDefault();
	l.newInput.over( evt.target );
	l.newInput.show();
} );

document.body.addEventListener( "dragover", (evt)=>{
	evt.preventDefault();
	evt.dataTransfer.dropEffect = "move";
	console.log( "Dragover:", evt.dataTransfer.getData( "text/plain" ), evt.dataTransfer.types.includes( "text/groupRemove" ) );
})
document.body.addEventListener( "drop", (evt)=>{
	evt.preventDefault();
	var objType = evt.dataTransfer.getData( "text/plain" );
	JSOX.begin( (event)=>{
		//console.log( "?", event );
		if( event.type === "groupRemove" ) {
			accruals.unassignActivityGroup( accruals.activity( event.val2 ), accruals.group( event.val1 ))
		}
		else if( event.type === "groupRemove2" ) {
			accruals.unassignActivityGroup( accruals.activity( event.val1 ), accruals.group( event.val2 ))
		}
		else if( event.type === "inputRemove" ) {
			accruals.unassignGroupInput( accruals.group( event.val1 ), accruals.input(event.val2 ))
		}
		else if( event.type === "inputRemove2" ) {
			accruals.unassignGroupInput( accruals.group( event.val2 ), accruals.input( event.val1 ))
		}
	}).write( objType );
})


const activityTable = document.getElementById( "activityTable" );
const groupTable = document.getElementById( "groupTable" );
const inputTable = document.getElementById( "inputTable" );

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

function activityToString(activity ) {
	return activity.name;
}
function groupToString(group){
	var s = '';
	s += group.name + "\t";
	s += "Start : " + utils.to$(group.startingValue);
	s += " gives " + utils.toP( group.housePercent) + " to House";
	return s;
}
function inputToString(input){
	return input.name;//JSOX.stringify( input );
}

l.activityList = createList( { parentItem:null, parent:activityTable }, activityToString );
l.groupList = createList( { parentItem:null, parent:groupTable }, groupToString );
l.inputList = createList( { parentItem:null, parent:inputTable }, inputToString );


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
	buttonRename.setAttribute( "type", "button" );
	buttonRename.className="buttonOption rightJustify";
	buttonRename.onclick = showNameInput;
	function showNameInput() {
		console.log("Tick" );
		
		const notice = popups.simpleNotice( "Cannot Rename" );
		notice.show();
	}

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

function createInputForm( input ) {
	function ok() {
		popup.apply();
	}
	console.log( "INPUT FORM CREATE:", input );
	const popup = popups.create( "Edit Input Properties" );
	popup.refresh = function() {
		fixedIncrement.value = input.fixedAmount;
		scaledPrice.value = input.scalePrice;
		minVal.value = input.minimum;
		isDaily.checked = input.isDaily;
		isCounter.checked = input.isIncrements;
		useMinimum.checked = input.useMinimum;
		useScaling.checked = input.useScalePrice;
		useDefault.checked = input.useDefault;
		sqlVal.value = input.sqlStatement;

	}
	popup.apply = function() {
		const update = {
			accrual_input_group_id:input.accrual_input_group_id,
			fixedAmount : fixedIncrement.value,
			scalePrice : scaledPrice.value,
			minimum : minVal.value,
			isDaily : isDaily.checked,
			isIncrements : isCounter.checked,
			useMinimum : useMinimum.checked,
			useScalePrice : useScaling.checked,
			useDefault : useDefault.checked,
			sqlStatement : sqlVal.value,
		}
		console.log( "Application updated:", update );
		accruals.updateInput( update );
	}
	popup.on( "show", ()=>{
	//	input.value = defaultValue;
//		input.focus();
//		input.select();
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
		ok && ok();
	} );	
	form.addEventListener( "reset", (evt)=>{
		evt.preventDefault();
		popup.hide();
	} );	

	makeNameInput( form, input, "Input Name : " );

	var fixedIncrement = makeTextInput( form, input, "Fixed Increment", "fixedAmount", true );

	//form.appendChild( document.createElement( "br" ) );
	var scaledPrice = makeTextInput( form, input, "Price per item", "scalePrice", true);

	var minVal = makeTextInput( form, input, "Minimum value", "minimum", true);
	var useMinimum = makeCheckbox( form, input, "Use Minimum", "useMinimum" );

	var isDaily = makeCheckbox( form, input, "is Daily", "isDaily" );
	var isCounter = makeCheckbox( form, input, "Is Count Incrementer", "isIncrements" );

	var useScaling = makeCheckbox( form, input, "Use Scaling", "useScalePrice" );
	var useDefault = makeCheckbox( form, input, "Use Default", "useDefault" );

	var sqlVal = makeTextInput( form, input, "SQL Query", "sqlStatement", false, false);


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
		popup.refresh();
		//cancelCb && cancelCb( );
	})

	popup.divFrame.addEventListener( "keydown", (e)=>{
		if(e.keyCode==27){
			e.preventDefault();
			popup.hide();
			popup.refresh();
			//cancelCb && cancelCb( );
		}
	})
	popup.divContent.appendChild( form );
	form.appendChild( document.createElement( "br" ) );
	form.appendChild( document.createElement( "br" ) );
	form.appendChild( cancel );
	form.appendChild( okay );
	
	popup.center();
	popup.hide();
	return popup;

}




function createGroupForm( input ) {
	function ok() {
	}
	const popup = popups.create( "Edit Jackpot Properties" );
	const controls = {
		name:null,
		everyTally:null,
		housePercent:null,
		startingValue:null,
	}
	popup.apply = function() {
		const update = {
			accrual_group_id:input.accrual_group_id,
			name:controls.name.value,
			everyTally:controls.everyTally.value,
			housePercent:controls.housePercent.value,
			startingValue:controls.startingValue.value,
		};
		accruals.updateGroup( update );
	}
	popup.refresh = function() {
		['name','everyTally','housePercent','startingValue'].forEach( key=>{
			controls[key].value = input[key];
		});
	}

	popup.on( "show", ()=>{
	//	input.value = defaultValue;
//		input.focus();
//		input.select();
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
		popup.apply();
	} );	
	form.addEventListener( "reset", (evt)=>{
		evt.preventDefault();
		popup.hide();
		popup.refresh();
	} );	

	controls.name = makeNameInput( form, input, "Jackpot Name : ");
	controls.housePercent = makeTextInput( form, input, "House Percent", "housePercent", false, true );
	controls.startingValue = makeTextInput( form, input, "Starting Value", "startingValue", true, false );
	controls.everyTally = makeCheckbox( form, input, "Always Activated", "everyTally" );

	var thresholdTable = document.createElement( "table" );
	var newRow = thresholdTable.insertRow();
	var newCell = newRow.insertCell();
	newCell.textContent = "Threshold Value";
	var newCell = newRow.insertCell();
	newCell.textContent = "Primary Percent";
	var newCell = newRow.insertCell();
	newCell.textContent = "Secondary Percent";
	var newCell = newRow.insertCell();
	newCell.textContent = "Tertiary Percent";
	var newCell = newRow.insertCell();
	newCell.textContent = "Kitty Percent";

	form.appendChild( thresholdTable );

	var okay = document.createElement( "BUTTON" );
	okay.className = "popupOkay";
	okay.textContent = "Okay";
	okay.setAttribute( "name", "submit" );
	okay.addEventListener( "click", (evt)=>{
		evt.preventDefault();
		popup.hide();
		popup.apply();
	})

	var cancel = document.createElement( "BUTTON" );
	cancel.className = "popupCancel";
	cancel.textContent = "Cancel";
	cancel.setAttribute( "type", "reset" );
	cancel.addEventListener( "click", (evt)=>{
		evt.preventDefault();
		popup.hide();
		popup.refresh(); // throw away any changes
	})

	popup.divFrame.addEventListener( "keydown", (e)=>{
		if(e.keyCode==27){
			e.preventDefault();
			popup.hide();
			popup.refresh(); // throw away any changes
		}
	})

	form.appendChild( cancel );
	form.appendChild( okay );

	popup.divContent.appendChild( form );
	
	popup.center();
	popup.hide();
	return popup;

}


