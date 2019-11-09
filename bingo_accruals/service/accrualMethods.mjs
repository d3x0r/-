
const events ={
	load:null, 
	newActivity:null,
	newGroup:null,
	newInput:null,
	updateInput:null,
	updateActivity:null,
	updateGroup:null,
	deleteInput:null,
	deleteActivity:null,
	deleteGroup:null,
	assignActivityGroup:null,
	unassignActivityGroup:null,
	assignActivityInput:null,
	unassignActivityInput:null,
	assignGroupInput:null,
	unassignGroupInput:null,

};

Object.assign( this, {
	processMessage : processMessage,
	loadAccruals : loadAccruals,
	on(event,param) {
		if( param && "function" === typeof param){
			events[event] = param;
		} else {
			events[event] && events[event](param);
		}
	},
	createActivity( name ) {
		this.send( JSON.stringify( {op:'createActivity',name:name } ) );
	},
	createGroup( name ) {
		this.send( JSON.stringify( {op:'createGroup',name:name } ) );
	},
	createInput( name ) {
		this.send( JSON.stringify( {op:'createInput',name:name } ) );
	},
	updateActivity( name ) {
		this.send( JSON.stringify( {op:'updateActivity',activity:name } ) );
	},
	updateGroup( name ) {
		this.send( JSON.stringify( {op:'updateGroup',group:name } ) );
	},
	updateInput( name ) {
		this.send( JSON.stringify( {op:'updateInput',input:name } ) );
	},
	deleteActivity( name ) {
		this.send( JSON.stringify( {op:'deleteActivity',id:name.accrual_activity_id } ) );
	},
	deleteGroup( name ) {
		this.send( JSON.stringify( {op:'deleteGroup',id:name.accrual_group_id } ) );
	},
	deleteInput( name ) {
		this.send( JSON.stringify( {op:'deleteInput',id:name.accrual_input_id } ) );
	},
	assignActivityGroup(a,g) {
		this.send( JSON.stringify( {op:'assignActivityGroup',activity:a.accrual_activity_id,group:g.accrual_group_id }))
	},
	unassignActivityGroup(a,g) {
		this.send( JSON.stringify( {op:'unassignActivityGroup',activity:a.accrual_activity_id,group:g.accrual_group_id }))
	},
	assignGroupInput(g,i) {
		this.send( JSON.stringify( {op:'assignGroupInput',group:g.accrual_group_id, input:i.accrual_input_group_id }))
	},
	unassignGroupInput(g,i) {
		this.send( JSON.stringify( {op:'unassignGroupInput',group:g.accrual_group_id, input:i.accrual_input_group_id }))
	},

} );

var accruals = null;

function loadAccruals( cb ) {
	this.send( "{op:'loadAccruals'}" );
}

function activity(id) { return accruals.activities.find( a=>a.accrual_activity_id===id ) }
function group(id) { return accruals.groups.find( a=>a.accrual_group_id===id ) }
function input(id) { return accruals.inputs.find( a=>a.accrual_input_group_id===id ) }
function activityI(id) { return accruals.activities.findIndex( a=>a.accrual_activity_id===id ) }
function groupI(id) { return accruals.groups.findIndex( a=>a.accrual_group_id===id ) }
function inputI(id) { return accruals.inputs.findIndex( a=>a.accrual_input_group_id===id ) }

function processMessage( msg ) {
	if( msg.op === "accruals" ) {
		accruals = msg.accruals;
		events.load && events.load(msg.accruals);
		return true;
	}
	if( msg.op === "activity" ) {
		accruals.activities.push( msg.activity );
		events.newActivity && events.newActivity( msg.activity );
		return true;		
	}
	if( msg.op === "group" ) {
		accruals.groups.push( msg.group );
		events.newGroup && events.newGroup( msg.group );
		return true;
	}
	if( msg.op === "input" ) {
		accruals.inputs.push( msg.input );		
		events.newInput && events.newInput( msg.input );
		return true;
	}
	if( msg.op === "updateActivity" ) {
		let a = activity( msg.activity.accrual_activity_id );
		a.name = msg.activity.name;
		events.updateActivity && events.updateActivity( a );
		return true;		
	}
	if( msg.op === "updateGroup" ) {
		let g = group( msg.group.accrual_group_id );
		['name','everyTally','housePercent','startingValue'].forEach( key=>{
			g[key] = msg.group[key];
		})
		// thresholds will be more complex.

		events.updateGroup && events.updateGroup( g );
		return true;
	}
	if( msg.op === "updateInput" ) {
		let i = input( msg.input.accrual_input_group_id );
		['name','defaultAmount','fixedAmount','isDaily',
		 'useMinimum','useScalePrice','useDefault','sqlStatement',
		 'scalePrice','minimum','isWeekly','isIncrements'
		].forEach( key=>{
			i[key] = msg.input[key];
		})

		events.updateInput && events.updateInput( i );
		return true;
	}

	if( msg.op === "assignActivityGroup" ) {
		var a = activity( msg.activity );
		var g = group( msg.group );
		a.groups.push( g );
		g.activities.push( a );
		events[msg.op] && events[msg.op]( a, g );
		return true;
	}
	if( msg.op === "unassignActivityGroup" ) {
		var a = activity( msg.activity );
		var g = group( msg.group );
		var ai = g.activities.findIndex( ta=>ta===a );
		g.activities.splice( ai, 1 );
		var gi = a.groups.findIndex( ta=>ta===g );
		a.groups.splice( gi, 1 );		
		events[msg.op] && events[msg.op]( a, g );
		return true;
	}

	/* These are triggered by assign/unassign and delete operations on the server */
	if( msg.op === "assignActivityInput" ) {
		var a = activity( msg.activity );
		var i = input( msg.input );
		a.inputs.push(i);
		i.activities.push(a);
		events[msg.op] && events[msg.op]( a, i );
		return true;
	}
	if( msg.op === "unassignActivityInput" ) {
		var a = activity( msg.activity );
		var i = input( msg.input );
		var ai = a.inputs.findIndex( input=> input=== i  );
		a.inputs.splice( ai, 1 );
		var ai = i.activities.findIndex( activity=> activity===a );
		i.activities.splice( ai, 1 );
		events[msg.op] && events[msg.op]( a, i );
		return true;
	}
	if( msg.op === "assignGroupInput" ) {
		var g = group( msg.group );
		var i = input( msg.input );
		g.inputs.push(i);
		i.groups.push(i);
		events[msg.op] && events[msg.op]( g, i );
		return true;
	}
	if( msg.op === "unassignGroupInput" ) {
		var g = group( msg.group );
		var i = input( msg.input );
		var gi = g.inputs.findIndex( input=> input === i );
		g.inputs.splice( gi, 1 );
		var ii = i.groups.findIndex( group=> group === g );
		i.groups.splice( ii, 1 );
		
		events[msg.op] && events[msg.op]( g, i );
		return true;
	}
	if( msg.op === "deleteActivity" ) {
		let activity = activityI( msg.id ) ;
		let ao = accruals.activities[activity];

		ao.inputs.forEach( input=>{
			var i = input.activities.findIndex( a=> a===ao );
			input.activities.splice( i, 1 );
		});
		ao.groups.forEach( group=>{
			var i = group.activities.findIndex( a=> a===ao );
			group.activities.splice( i, 1 );
		});
		accruals.activities.splice( activity, 1 );

		events.deleteActivity && events.deleteActivity( activity );
		return true;		
	}
	if( msg.op === "deleteGroup" ) {
		let group = accruals.groups.findIndex( a=>a.accrual_group_id === msg.id ) ;
		let go = accruals.groups[group];

		go.inputs.forEach( input=>{
			var i = input.groups.findIndex( a=> a===go );
			input.groups.splice( i, 1 );
		});
		go.activities.forEach( activity=>{
			var i = activity.groups.findIndex( a=> a===go );
			activity.groups.splice( i, 1 );
		});
		accruals.groups.splice( group, 1 );

		events.deleteGroup && events.deleteGroup( group );
		return true;
	}
	if( msg.op === "deleteInput" ) {
		let input = accruals.inputs.findIndex( a=>a.accrual_input_group_id === msg.id ) ;
		let io = accruals.inputs[input];

		io.groups.forEach( group=>{
			var i = group.inputs.findIndex( a=> a===io );
			group.inputs.splice( i, 1 );
		});
		io.activities.forEach( activity=>{
			var i = activity.inputs.findIndex( a=> a===io );
			activity.inputs.splice( i, 1 );
		});
		accruals.inputs.splice( input, 1 );

		events.deleteInput && events.deleteInput( accruals.inputs[input] );
		return true;
	}
}