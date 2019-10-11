/* this is copies from another project and froughtly stripped down... */
const _debug = false;

const myExtensions = {
	pending : {
		foyer : [],
		lobby : [],
		createGame : [],
		events : {},
	},
	foyer(cb){
		this.pending.foyer.push(cb);
		this.send( JSON.stringify( { op:"foyer"} ))
	},
	lobby(id,cb){
		this.pending.lobby.push(cb);
		this.send( JSON.stringify( { op:"lobby", id:id } ))
	},
	createGame( name, players, width, height, cb){
		this.pending.createGame.push(cb);
		this.send( JSON.stringify( { op:"createGame", name,name, players,players,width:width,height:height } ))
	},
	leaveGame(  ) {
		this.send(JSON.stringify( { op:"leaveGame" } ))
	},
	joinGame( id ) {
		this.send(JSON.stringify( { op:"joinGame", id:id } ))
	},
	putPiece( x, y, dx, dy ) {
		this.send(JSON.stringify( { op:"putPiece", x:x, y:y, dx:dx, dy:dy } ))
	},
	
	on(name,cb) {
		this.pending.events[name] = cb;
	}
}

Object.assign( this, myExtensions );

this.fw_message = function( ws, msg, _msg ) {
	// these are handled before application callback 
	// return true to prevent application from receiving message, and indicate handled.
	//console.log( "received:", msg );
	if( msg.op === "foyer" ) {
		var replyTo = this.pending.foyer.shift();
		replyTo( msg.games );
		return true;
	}
	else if( msg.op === "game" ) {
		var replyTo = this.pending.createGame.shift();
		replyTo( msg.id, msg.player_id );
		return true;
	} else if( msg.op === "waitTurn" ) {
		this.pending.events.waitTurn()
	} else if( msg.op === "putPiece" ) {
		this.pending.events.putPiece( msg.x, msg.y, msg.dx, msg.dy );
	} else if( msg.op === "initGame" ) {
		this.pending.events.setup( msg.width, msg.height, msg.players );
	} else if( msg.op === "aiMove" ) {
		this.pending.events.aiMove();
	} else if( msg.op === "yourMove" ) {
		this.pending.events.turn();
	} else if( msg.op === "lobby" ) {
		var replyTo = this.pending.lobby.shift();
		replyTo( msg );
		return true;
	}
	return false;
};

// this routine is meant for receiving requests directly from a client.
this.message = function( ws, msg, _msg ) {
	// this can be used to prefilter events directly from a client
	// 

	return false;
}
//# startup-supportBot-fireallextensions.js

