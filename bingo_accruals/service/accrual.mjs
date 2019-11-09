

import {db} from "./db.mjs";
import sack from "sack.vfs";
const JSON=sack.JSOX;
const l = {
	accruals : null,
};


function loadAccruals() {
	db.loadAccruals( (accruals)=>{
        	l.accruals = accruals;
        } );
}

loadAccruals();

const accrualConnections =[];
const accrual = {
	messageProcessor : processMessage,
	connect(ws) {
		accrualConnections.push( ws );
	},
	disconnect(ws) {
		var idx = accrualConnections.findIndex(c=>c===ws);
		if( idx >= 0 ) accrualConnections.splice(idx,1);
	}
}

export {accrual};

function send(notWs, msg){
	accrualConnections.forEach( ws=>{
		ws.send(msg);
	})
}


function processMessage( ws, msg, txtMsg ) {

	if( msg.op === "hello" ) {
		const methods = sack.Volume().read( "accrualMethods.mjs" ).toString();
		const methodMsg = JSON.stringify( {op:"addMethod", code:methods} );
		ws.send( methodMsg );
		ws.send( JSON.stringify( {op:"accruals", accruals : l.accruals } ) );
		return;
	}

	if( msg.op === "createActivity" ) {
		var activity = db.createActivity( msg.name );
		l.accruals.activities.push(activity);
		if( activity )
			send( null, JSON.stringify( {op:"activity", activity : activity } ) );
		return;
	}
	if( msg.op === "createGroup" ) {
		var group = db.createGroup( msg.name );
		l.accruals.groups.push(group);
		if( group )
			send( null, JSON.stringify( {op:"group", group : group } ) );
		return;
	}
	if( msg.op === "createInput" ) {
		var input = db.createInput( msg.name );
		l.accruals.inputs.push(input);
		if( input )
			send( null, JSON.stringify( {op:"input", input : input } ) );
		return;
	}
	if( msg.op === "assignActivityGroup" ) {
		
		var activity = l.accruals.activity( msg.activity );
		var group = l.accruals.group( msg.group );
		console.log( "Got:", activity, group, msg );
		if( !activity.groups.find( g=>g===group )) {

			db.assignGroup( activity, group );
			activity.groups.push( group );
			group.activities.push( activity );

			group.inputs.forEach( input=>{
				if( !activity.inputs.find(i=>i===input)) {
					activity.inputs.push( input );
					input.activities.push( activity );
					send( null, JSON.stringify( {op:"assignActivityInput"
						,activity:activity.accrual_activity_id
						,input:input.accrual_input_group_id}));
				}
			})

			send( null, txtMsg ); // just forward same message.
			return;
		}
	}
	if( msg.op === "unassignActivityGroup" ) {
		var activity = l.accruals.activity( msg.activity );
		var group = l.accruals.group( msg.group );
		if( activity.groups.find( g=>g===group )) {

			var i;
			db.unassignGroup( activity, group );
			i = group.activities.findIndex( i=>i===activity);
			group.activities.splice( i, 1 );
			i = activity.groups.findIndex( i=>i===group);
			activity.groups.splice( i, 1 );

			group.inputs.forEach( input=>{
				var gai = activity.inputs.findIndex( input=>{
					return !l.accruals.activities.find( activity=>{
						return activity.groups.find( group_=>{
							if( group_ === group ) return false;
							return group_.inputs.find( i=>i===input );
						})
					})
				}) 
					
				if( gai >= 0 ) {
					activity.inputs.splice( gai, 1 );
					var i = input.activities.find( a=>a===activity );
					input.activities.splice( i , 1 );
					send( null, JSON.stringify( {op:"unassignActivityInput"
						,activity:activity.accrual_activity_id
						,input:input.accrual_input_group_id}));
				}
			})

			send( null, txtMsg ); // just forward same message.
			return;
		}
		return;
	}
	if( msg.op === "assignGroupInput" ) {
		var group = l.accruals.group( msg.group );
		var input = l.accruals.input( msg.input );
		if( !group.inputs.find( i=>i===input) )
		{
			group.inputs.push( input );			
			input.groups.push( group );

			// If this is the first group in this activity to get
			// this input, then send a notice to assign the input
			// to the activity.
			group.activities.forEach( activity=>{
				if( !activity.inputs.find( i=>i===input) ) {
					activity.inputs.push(input);
					send( null, JSON.stringify( {op:"assignActivityInput"
						,activity:activity.accrual_activity_id
						,input:input.accrual_input_group_id}));
				}
			})
			db.assignInput( group, input );
			send( null, txtMsg ); // just forward same message.
		}
	}

	if( msg.op === "unassignGroupInput" ) {
		var group = l.accruals.group( msg.group );
		var input = l.accruals.input( msg.input );
		if( group.inputs.find( i=>i===input) )
		{
			var i;
			i = group.inputs.findIndex( i=>i===input);
			group.inputs.splice( i, 1 );
			i = input.groups.findIndex( i=>i===group);
			input.groups.splice( i, 1 );

			// for this group's activities, scan to see if some other
			// group uses this input... if it does not, send a reminder to
			// remove this relation.
			// and remove the relation.
			var gai = group.activities.forEach( activity=>{
				var ai = activity.inputs.find( i=>i===input );
				var ai = activity.groups.find( g=>{
					if( g === group )return false;
					return group.inputs.find(i=>i===input);
				});
				if( !ai ){
					activity.inputs.splice( gai, 1 );
					send( null, JSON.stringify( {op:"unassignActivityInput"
						,activity:activity.accrual_activity_id
						,input:input.accrual_input_group_id}));
				}
			})
			
			db.unassignInput( group, input );
			send( null, txtMsg ); // just forward same message.
		}
	}

	if( msg.op === "updateActivity") {
		db.updateActivity( msg.activity );

		var activity = l.activities.groups.find( i=>i.accrual_activity_id===msg.activity.accrual_activity_id );
		activity.name = msg.activity.name;

		send( null, txtMsg );
		return;
	}
	if( msg.op === "updateGroup") {
		var group = l.accruals.groups.find( i=>i.accrual_group_id===msg.group.accrual_group_id );
		db.updateGroup( msg.group );
		['name','everyTally','housePercent','startingValue'].forEach( key=>{
			group[key] = msg.group[key];
		})
		// thresholds will be more work.

		send( null, txtMsg );
		return;
	}
	if( msg.op === "updateInput") {
		var input = l.accruals.inputs.find( i=>i.accrual_input_group_id===msg.input.accrual_input_group_id );
		['name','defaultAmount','fixedAmount','isDaily',
		 'useMinimum','useScalePrice','useDefault','sqlStatement',
		 'scalePrice','minimum','isWeekly','isIncrements'
		].forEach( key=>{
			input[key] = msg.input[key];
		})
		db.updateInput( msg.input );	
		send( null, txtMsg );
		return;
	}

	if( msg.op === "deleteGroup") {
		var i;
		var g = l.accruals.group( msg.group );
		i = l.accruals.groups.findIndex( t=>t===g );
		l.accruals.groups.splice(i);

		l.accruals.activities.forEach( activity=>{

			var gai = group.activities.forEach( activity=>{
				//var ai = activity.inputs.findIndex( i=>i===input );
				var ai = activity.groups.findIndex( g=>{
					if( g === group )return false;
					return group.inputs.find(i=>i===input);
				});
				if( !ai ){
					activity.inputs.splice( gai, 1 );
					send( null, JSON.stringify( {op:"unassignActivityInput"
						,activity:activity.accrual_activity_id
						,input:input.accrual_input_group_id}));
				}
			})
			
			var i = activity.groups.find( t=>t===g );
			if( i >= 0 )
				activity.groups.splice( i, 1 );
			
		})
		db.deleteGroup( msg.group );
		send( null, txtMsg );
	
	}
	if( msg.op === "deleteActivity") {
		var i;
		var g = l.accruals.activity( msg.activity );
		i = l.accruals.activities.findIndex( t=>t===g );
		l.accruals.activities.splice(i);
	
		l.groups.forEach( group=>{
			var i = group.activities.find( a=>a===g );
			if( i >= 0 )
				group.activities.splice(i, 0);
		})
		l.inputs.forEach( input=>{
			var i = input.activities.find( a=>a===g );
			if( i >= 0 )
				input.activities.splice(i, 0);
		})

		send( null, txtMsg );
	}
	if( msg.op === "deleteInput") {
		var i;
		var g = l.accruals.input( msg.input );
		i = l.accruals.inputs.findIndex( t=>t===g );
		l.accruals.inputs.splice(i);
	
		l.accruals.activities.forEach( activity=>{
			var i = activity.inputs.findIndex( t=>t===i)
			if( i >= 0 )
				activity.inputs.splice( i, 1 );
		})
		l.accruals.groups.forEach( group=>{
			var i = group.inputs.findIndex( t=>t===i)
			if( i >= 0 )
				group.inputs.splice( i, 1 );
		})

		send( null, txtMsg );
	}
}
