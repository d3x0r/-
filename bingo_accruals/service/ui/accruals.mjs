
import {JSOX} from "./jsox.mjs";
const JSON = JSOX;

const accruals = {
	all: new Map(),
	on( eventName, callback ) {
		l.events[eventName] = callback;
	},
	load : openSocket,
	activity(name) {
		return l.accruals.activities.find( i=>i.name===name ) || l.accruals.activities.find( i=>i.accrual_activity_id===name );
	},
	group(name) {
		return l.accruals.groups.find( i=>i.name===name ) || l.accruals.groups.find( i=>i.accrual_group_id===name );
	},
	input(name) {
		return l.accruals.inputs.find( i=>i.name===name ) || l.accruals.inputs.find( i=>i.accrual_input_group_id===name );
	},
	createActivity(name) {
		var tmp;
		if( !(tmp=l.accruals.activities.find( i=>i.name===name ) ) )
			l.ws.createActivity( name );
		return tmp;
	},
	createGroup(name) {
		var tmp;
		if( !(tmp=l.accruals.groups.find( i=>i.name===name ) ) )
			l.ws.createGroup( name );
		return tmp;
	},
	createInput(name) {
		var tmp;
		if( !(tmp=l.accruals.inputs.find( i=>i.name===name ) ) )
			l.ws.createInput( name );
		return tmp;
	},
	updateActivity(o) {
		l.ws.updateActivity( o );
	},
	updateGroup(o) {
		l.ws.updateGroup( o );
	},
	updateInput(o) {
		l.ws.updateInput( o );
	},
	deleteActivity(o) {
		l.ws.deleteActivity( o );
	},
	deleteGroup(o) {
		l.ws.deleteGroup( o );
	},
	deleteInput(o) {
		l.ws.deleteInput( o );
	},
	assignActivityGroup(a,g) {
		l.ws.assignActivityGroup(a,g);
	},
	unassignActivityGroup(a,g) {
		l.ws.unassignActivityGroup(a,g);
	},
	assignGroupInput(a,g) {
		l.ws.assignGroupInput(a,g);
	},
	unassignGroupInput(a,g) {
		l.ws.unassignGroupInput(a,g);
	},
}


const l = {
	events : {
		load:null,
		newGroup:null,
		newActivity:null,
		newInput:null,
		deleteActivity:null,
		deleteGroup:null,
		deleteInput:null,
		updateActivity:null,
		updateGroup:null,
		updateInput:null,
		assignActivityGroup:null,
		unassignActivityGroup:null,
		assignGroupInput:null,
		unassignGroupInput:null,
		assignActivityInput:null,
		unassignActivityInput:null,

	},
	flags : {
		wantLoadAccruals : false,
	},
	ws : null,
	accruals : null,
};




function loadAccruals() {
	// the server just sends accruals on connect now.
	l.ws.on( "load",  (accruals_)=>{
		l.accruals = accruals_;
		accruals_.activities.forEach( activity=>accruals.all.set( activity.accrual_activity_id, activity ) );
		accruals_.groups.forEach( group=>accruals.all.set( group.accrual_group_id, group ) );
		accruals_.inputs.forEach( input=>accruals.all.set( input.accrual_input_group_id, input ) );

		l.events.load && l.events.load(accruals_);
	} );
	l.ws.on( "newGroup",  o=>{
		l.events.newGroup&&l.events.newGroup(o) 
		accruals.all.set( o.accrual_group_id, o );
	} );
	l.ws.on( "newActivity",  o=>{l.events.newActivity&&l.events.newActivity(o)
		accruals.all.set( o.accrual_activity_id, o );
	 });
	l.ws.on( "newInput",  o=>{l.events.newInput&&l.events.newInput(o) 
		accruals.all.set( o.accrual_input_group_id, o );
	});

	function relay(name){
		l.ws.on( name, (a,b)=>l.events[name]&&l.events[name](a,b));
	}

	relay( "assignActivityGroup" );
	relay( "unassignActivityGroup" );
	relay( "assignActivityInput" );
	relay( "unassignActivityInput" );
	relay( "assignGroupInput" );
	relay( "unassignGroupInput" );

	l.ws.on( "updateActivity", o=>l.events.updateActivity&&l.events.updateActivity(o) );
	l.ws.on( "updateGroup", o=>l.events.updateGroup&&l.events.updateGroup(o) );
	l.ws.on( "updateInput", o=>l.events.updateInput&&l.events.updateInput(o) );


	l.ws.on( "deleteActivity", o=>{
		l.events.deleteActivity&&l.events.deleteActivity(accruals.all.get(o))
		accruals.all.delete(o);
	});
	l.ws.on( "deleteGroup", o=>{
		l.events.deleteGroup&&l.events.deleteGroup(accruals.all.get(o))
		accruals.all.delete(o);
	});
	l.ws.on( "deleteInput", o=>{
		l.events.deleteInput&&l.events.deleteInput(accruals.all.get(o));
		accruals.all.delete(o);
	});
}

function processMessage( msg ) {
	if( msg.op === "addMethod" ) {
		try {
			var f = new Function( "JSON", msg.code );
			f.call( l.ws, JSON );
			loadAccruals();
		} catch( err ) {
			console.log( "Function compilation error:", err,"\n", msg.code );
		}
	}
}

function openSocket() {


  var ws = new WebSocket("ws://"+location.host+"/", "accruals");
  
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

export {accruals}






