

const _debug = false;
const targetPlayer = 1;  // this will be more than 1....

const l = {
	rows : 4,
	cols : 6,
	widths : [],
	heights : [],
	cellx : [],
	celly : [],
	peiceSize : 16,
	peiceDist : 8,
	boardAtoms : [],
	board : [],
	unstable : false,
	Explode : [],
	ExplodeHead:0,
	ExplodeTail:0,
	sphere : false, // torus?
	players : [],
	currentPlayer : 0,
	updating_board_end : 0,
	winstate : null, // ends up being the l.player element
	RNG : SaltyRNG( salt=>salt.push( Date.now() ) ),
	timeOut : [],
	boardOut : [],
	lastPlay : {x:0,y:0},
	gameLog : [],
	noMoveMask : [],
	canMoveMask : [],
	tick : 0,
}

var GuestName = localStorage.getItem( "guestName" );

var gameBoard = document.getElementById( "board" );
var gameCtx = gameBoard.getContext("2d");
var gameBoard_width = document.getElementById( "board_size_x" );
var gameBoard_height = document.getElementById( "board_size_y" );
var alertFrame = document.getElementById( "alert");
var alertFrameText = document.getElementById( "alertContent");
alertFrameText.textContent = "Test Message goes Here....";
var images = [ "atom2-24.png", "cursor.jpg", "grid1.jpg" ];
var imageElements = [];
var pieces = [];
var grids = [];
var image_index = 0;

var popupTracker;
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



function initGameBoardForm() {
	var popup = {
		divFrame : document.getElementById( "gameBoard" ),
		divCaption : document.getElementById( "gameBoardCaption" ),
		cnvBoard : gameBoard,
		set caption(val) {
			popup.divCaption.innerText = val;
		},
		hide() {
			this.divFrame.style.display = "none";
		},
		show() {
			this.divFrame.style.display = "unset";
		},
	}

	return popup;
}
var gameBoardForm = initGameBoardForm();
gameBoardForm.hide();

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

function initApp() {
	var captions = document.getElementsByClassName( "inFrameCapt");
	for( var i = 0; i < captions.length; i++ ) {
		addCaptionHandler( captions[i], null );
	}



	var send = document.getElementsByClassName( "chatSendBox");
	for( var i = 0; i < send.length; i++ ) {
		send[i].addEventListener( "keydown", (evt)=>{
			if( evt.ctrlKey || evt.shiftKey  )
			{
				if( evt.keyCode == 13 ){
					sendMessage( evt.target.textContent );
					evt.target.textContent = "";
					evt.preventDefault();
				}
			}
			//console.log( "KEY:", evt );
		})
		/*
		send[i].addEventListener( "change", (evt)=>{
			console.log( "change:", evt );
		})
		send[i].addEventListener( "input", (evt)=>{
			console.log( "input:", evt );
		})
		*/
		//chatSendBox
	}

	var chatSendButton = document.getElementsByClassName( "chatSendButton");
	for( var i = 0; i < chatSendButton.length; i++ ) {
		chatSendButton[i].addEventListener( "click", (evt)=>{
			for( var i = 0; i < send.length; i++ ) {
				send[i].textContent = "";
			}
					
		}); 
	}

}

initApp();


function createPopup(caption, useCaption ) {
	var popup = {
		divFrame : useCaption?useCaption.parentNode:document.createElement( "div" ),
		divCaption : useCaption || document.createElement( "div" ),
		set caption(val) {
			popup.divCaption.innerText = val;
		},
		hide() {
			this.divFrame.style.display = "none";
		},
		show() {
			this.divFrame.style.display = "unset";
		},
	}
	if( !useCaption ) {
		popup.divFrame.className = "inFrame";
		popup.divFrame.style.top = 0;
		popup.divFrame.style.left = 0;

		popup.divCaption.className = "inFrameCapt";
		if( caption )
			popup.divCaption.textContent = caption;
		popup.divFrame.appendChild( popup.divCaption );
		addCaptionHandler( popup.divCaption, popup );
		document.body.appendChild( popup.divFrame );
	}
	popupTracker.addPopup( popup );
	return popup;
}

function handleService (a,b,c) {
	//console.log( "request for protocol:", a, b, c );
	if( a === true ) {
		//chainReactService = b;
		//console.log( "THIS IS TOO EARLY" );
	} else if( a.op === "connected" ) {
		chainReactService = a.ws;
		chainReactService.on( "putPiece", putPiece );
		chainReactService.on( "aiMove", (player)=>{
			_debug && console.log( "AI TURN GENERATION" );
			//l.currentPlayer = player;
			pickAiMove_generation_one();
			//pickAiMove_generation_zero();
		} );
		chainReactService.on( "waitTurn", ()=>{
			alertForm.caption = "Please wait for your turn...";
			alertForm.show();
		} );
		chainReactService.on( "turn", ()=>{
			_debug && console.log( "YOUR TURN (alwyas player 0)" );
			l.currentPlayer = 0;
			if( l.players[0].autoMove )
				pickAiMove_generation_zero();
		} );
		chainReactService.on( "setup", (w,h,players)=>{
			l.winstate = null;
			_debug && console.log( "got setup" );
			l.rows = h;
			l.cols = w;
			l.players.length = 0;
			foyerForm.hide();
			for( var p = 0; p < players; p++ ){
				makePlayer();
			}
			l.players[0].active = true;

			gameStatusForm.players = players;
			initBoard();
			gameStatusForm.update();
			gameStatusForm.show();
			gameBoardForm.show();
		})
		chainReactService.onclose = (status,code)=>{
			chainReactService = false;
			loginForm.show();
			foyerForm.hide();
			gameStatusForm.hide();
			gameChatForm.hide();
			gameBoardForm.hide();
		}
		loginForm.hide();
		foyerForm.show();
		gameChatForm.show();
	} else if( a.op === "status" ) {
		loginForm.setStatus( a.status );
		//userStatus.textContent = "";

	}else {
		console.log( "Request of chainreact instead of connectTo:", a, b, c );

	}
}


	function dumpGame() {
		l.timeOut[l.tick] = true;		
		var o = 0;
		for( var n = 0; n < l.rows; n++ ) {
			for( var m = 0; m < l.cols; m++ ) {
				//console.log( "PLAYER:", n, m, l.board[n][m].player, l.currentPlayer, !( ( l.board[n][m].player === -1 ) || ( l.board[n][m].player === l.currentPlayer ) ) );
				l.boardOut[7*o + 0] = ( l.board[n][m].player === targetPlayer /*l.currentPlayer*/ );
				l.boardOut[7*o + 1] = !( ( l.board[n][m].player === -1 ) || ( l.board[n][m].player === targetPlayer /*l.currentPlayer*/ ) );
				l.boardOut[7*o + 2] = ( l.board[n][m].player === -1 );
	        
				l.boardOut[7*o + 3] = l.board[n][m].count > 0;
				l.boardOut[7*o + 4] = l.board[n][m].count > 1;
				l.boardOut[7*o + 5] = l.board[n][m].count > 2;
				l.boardOut[7*o + 6] = l.board[n][m].count > 3;
	        
				if( l.boardOut[7*o+0] || l.boardOut[7*o+2] )
					l.canMoveMask[n*l.cols + m] = 1;
				else
					l.canMoveMask[n*l.cols + m] = 0;
	        
				//l.boardOut[8*o + 7] = l.board[n][m].count > 4; // last game can have large counts.
				o++;
				
			}
		}


		var s = [];
	for( var n = 0; n < o; n++ ) {
				s.push(0);
		}
	        
		l.gameLog.push( { 
			tick: l.timeOut.map( x=>x?1:0)
			, board:l.boardOut.map(x=>x?1:0)
			, canMove:l.currentPlayer === targetPlayer ?l.canMoveMask.map(n=>n):l.noMoveMask
			, lastMove:s
		} );
		// reset this tick mark for next.
		l.timeOut[l.tick] = false;
		return l.tick++;
	}

	function putPiece(x,y,dx,dy) {
				if( l.currentPlayer == 0 && !l.players[0].moves ) {
					l.players.forEach( player=>player.active = true);
				}
				if( l.winstate )  {
					alertForm.caption = "Game has been won!";
					alertForm.show();
					return;
				}
				if( !l.board[y][x].count ){
					l.boardAtoms[y][x][l.board[y][x].count].x = dx;
					l.boardAtoms[y][x][l.board[y][x].count].y = dy;
					l.board[y][x].count = 1;
					l.board[y][x].player = l.currentPlayer;
					l.players[l.currentPlayer].count++;
					l.players[l.currentPlayer].moves++;
					l.board[y][x].stable = false;
					gameStatusForm.update();
					dumpGame();
				} else if( l.board[y][x].player === l.currentPlayer ) {
					l.boardAtoms[y][x][l.board[y][x].count].x = dx;
					l.boardAtoms[y][x][l.board[y][x].count].y = dy;
					l.board[y][x].count++;
					l.players[l.currentPlayer].count++;
					l.players[l.currentPlayer].moves++;
					l.board[y][x].stable = false;
					gameStatusForm.update();
					dumpGame();
				} else {
					passField.textContent = "";
				}
				do {
					l.currentPlayer++;
					if( l.currentPlayer >= l.players.length )
						l.currentPlayer = 0;
				}while( !l.players[l.currentPlayer].active );
	}


function initLoginForm() {
	var connection = createPopup( "Connecting", null );
	var center = document.createElement( "CENTER" );

	var pRect = connection.divFrame.getBoundingClientRect();
	connection.divFrame.style.left = document.body.clientWidth/2 - pRect.width/2;
	connection.divFrame.style.top = document.body.clientHeight/2 - pRect.height/2;
	connection.caption = "Login..."

	var topPadding = document.createElement( "div" );
	topPadding.style.height = "10px";

	var userPrompt = document.createElement( "div" );
	userPrompt.innerText = "Account Name";

	var userField = document.createElement( "div" );
	userField.className = "loginUsername";
	userField.setAttribute( "contenteditable", true );
	userField.innerText = "";

	var userPassword = document.createElement( "div" );
	userPassword.innerText = "Password";

	var passField = document.createElement( "div" );
	passField.className = "loginPassword";
	passField.setAttribute( "contenteditable", true );
	passField.setAttribute("type", "password");
	//passField.style.password = true;
	passField.innerText = "";

	var btnPadding = document.createElement( "div" );
	btnPadding.style.height = "10px";


	var userLogin = document.createElement( "div" );
	userLogin.className = "button";
	userLogin.style.width = "max-content";
	var userLoginInner = document.createElement( "div" );
	userLoginInner.className = "buttonInner";
	userLoginInner.style.width = "max-content";
	userLoginInner.innerText = "Login";

	var userStatus = document.createElement( "div" );
	userStatus.textContent = "";

	connection.setStatus = (status)=>{
		userStatus.textContent = status;
	}

	var guestLogin = document.createElement( "div" );
	guestLogin.className = "button";
	guestLogin.style.width = "max-content";
	var guestLoginInner = document.createElement( "div" );
	guestLoginInner.className = "buttonInner";
	guestLoginInner.style.width = "max-content";
	guestLoginInner.innerText = "Use Guest Login";
	
	var isGuestLogin = false;
	var GuestName = localStorage.getItem( "guestName" );
	
	userLogin.addEventListener( "click", ()=>{
		if( isGuestLogin ) {
			if( userField.innerText.length < 3 ) {
				alertForm.caption = "Please use a longer display name...";
				alertForm.show();

			} else {

				localStorage.setItem( "devkey", idGen.generator() );
				var a, b, c, d;
				localStorage.setItem( "a", a = idGen.generator() );
				localStorage.setItem( "b", b = userField.innerText );
				localStorage.setItem( "c", c = idGen.generator() );
				localStorage.setItem( "d", d = idGen.generator().substr(0,8)+"@d3x0r.org" );

				protocol.createUser( a, b, d, c, (msg, err, username)=>{
					//console.log( "create user callback Got:", msg, err)
					if( msg ) {
						guestLogin.style.display = "none";
						isGuestLogin = username;
						protocol.request( "chainReaction", null,null,handleService );
					} else {
						if( err === "Account Error" ) {
							loginForm.setStatus( "Name is in use." );
						} else
							loginForm.setStatus( "Login Error" );
						console.log( "error?", err );
					}
				} );

				localStorage.setItem( "guestName", userField.innerText );
			}
		}
		else
			protocol.login( userField.innerText, passField.innerHTML,(passFail,userId,userName,ws)=>{
				console.log( "Login passfail.a:",passFail,"B:",userId, "C:",userName);
				if( passFail ) {
					console.log( "Requesting game service...");
					protocol.request( "chainReaction", null,null,handleService );
				} else {
					loginForm.setStatus( "Login Failed." );
					passField.textContent = "";
				}
			} );
	})

	userLogin.appendChild( userLoginInner );

	guestLogin.addEventListener( "click", ()=>{
		userPrompt.innerText = "Display Name";
		userPassword.style.display = "none";
		passField.style.display = "none";
		guestLogin.style.display = "none";
		localStorage.setItem( "devkey", idGen.generator() );
		isGuestLogin = true;
	})
      	guestLogin.appendChild( guestLoginInner );



	connection.divFrame.appendChild( topPadding );
	center.appendChild( userPrompt );
	center.appendChild( userField );
	center.appendChild( userPassword );
	center.appendChild( passField );
	center.appendChild( btnPadding );
	center.appendChild( userLogin );
	center.appendChild( guestLogin );
	connection.divFrame.appendChild( center );
	connection.divFrame.appendChild( userStatus );
	
	var centerLink = document.createElement( "center" );
	var accountLink = document.createElement( "a");
	accountLink.href = "https://" + location.host + "/#login";
	accountLink.innerText = "Create An Account";
	centerLink.appendChild( accountLink );
	connection.divFrame.appendChild( centerLink );
	


	return connection;
}

var loginForm = initLoginForm()

//---------------------------------------------------------------------------

function initGameStatusForm() {
	var popup = popupTracker.find( "gameStatusDialog" );
	if( !popup ) popup = {
		divFrame : document.getElementById( "gameStatusDialog" ),
		divCaption : document.getElementById( "gameStatusCaption" ),
		show() {
			this.divFrame.style.display = "unset";
		},
		hide() {
			this.divFrame.style.display = "none";
		},
		set caption(val) {
			popup.divCaption.innerText = val;
		},
	}

	var popupExtensions = {
		set players(val){
			while( myPlayerTable.rows.length > 1 )
				myPlayerTable.rows[1].remove();	
			rows.length = 0;
			for( var p = 0; p < val; p++ ) {
				var statRow = { player : l.players[p] ,
					row : myPlayerTable.insertRow(),
					cells : []
				};
				statRow.cells.push( statRow.row.insertCell() );
				statRow.cells.push( statRow.row.insertCell() );
				statRow.cells.push( statRow.row.insertCell() );

				statRow.row.className = "gameStatRowActive";
				statRow.cells[0].className = "gameStatPlayerName";
				statRow.cells[1].className = "gameStatPlayerColor";
				statRow.cells[2].className = "gameStatPlayerCount";

				if( p == 0 )
					statRow.cells[0].textContent = "You";
				else
					statRow.cells[0].textContent = "AI";
				var img = document.createElement( "img");
				img.src = pieces[p].src;
				img.style.height = "2em";
				statRow.cells[1].appendChild( img );
				statRow.cells[2].textContent = "0";
				rows.push( statRow );
			}
		},
		update() {

			l.players.forEach( (player,idx)=>{
				if( player === l.winstate) 
					rows[idx].cells[2].textContent = "WINNER";
				else if( player.moves && !player.active )
					rows[idx].cells[2].textContent = "LOSER";
				else if( !player.active )
					rows[idx].cells[2].textContent = "Waiting...";
				else
					rows[idx].cells[2].textContent = player.count;
			})
		},
		addPlayer(name) {
		}
	}

	Object.getOwnPropertyNames(popupExtensions).forEach(function (prop) {
        var descriptor = Object.getOwnPropertyDescriptor(popupExtensions, prop);
        Object.defineProperty(popup, prop, descriptor);
    });
	popup.divFrame.style.left = localStorage.getItem( popup.divFrame.id + "/x" ) || 483;
	popup.divFrame.style.top = localStorage.getItem( popup.divFrame.id + "/y" ) || 23;
	var rows = [];
	var myPlayerTable = document.getElementById( "gameStatusList");

	var quitGame =  document.getElementById( "quitGame");
	quitGame.addEventListener( "click", ()=>{
		chainReactService.leaveGame();
		gameBoardForm.hide();
		gameStatusForm.hide();
		foyerForm.show();
	})

	var resignGame =  document.getElementById( "resignGame");
	resignGame.addEventListener( "click", ()=>{
		l.players[0].autoMove = true;
	})

	//popupTracker.addPopup( popup );

	return popup;
}

var gameStatusForm = initGameStatusForm();
gameStatusForm.hide();

function initAlertForm() {
	var popup = {
		divFrame : document.getElementById( "alert" ),
		divCaption : document.getElementById( "alertContent" ),
		show() {
			this.divFrame.style.display = "unset";
		},
		hide() {
			this.divFrame.style.display = "none";
		},
		set caption( val ) {
			this.divCaption.textContent = val;
		}
	};
	popup.divFrame.addEventListener( "click", ()=>{
		popup.divFrame.style.display = "none";
	})
	return popup;
}

var alertForm = initAlertForm();
alertForm.hide();

function initFoyerForm() {
	var popup = popupTracker.find( "foyerDialog" );
	if( !popup ) popup = {
		divFrame : document.getElementById( "foyerDialog" ),
		divCaption : document.getElementById( "foyerCaption" ),
		set caption(val) {
			popup.divCaption.innerText = val;
		},
		hide() {
			this.divFrame.style.display = "none";
		},
		show() {
			this.divFrame.style.display = "unset";
			this.loadGames();
		},
	}
	Object.assign( popup, {
		loadGames() {
			chainReactService.foyer( (games)=>{
				this.clearGames();
				this.addGames( games );
			})

		},
		addGames(games) {
			games.forEach( game=>{
				var row = myGameTable.insertRow();
				var cell;
				var game_ = game;

				cell = row.insertCell();
				cell.textContent = game.name;

				cell = row.insertCell();
				cell.textContent = game.players;

				cell = row.insertCell();
				cell = row.insertCell();
				cell.textContent = game.width;
				cell.style.width = "2em";

				cell = row.insertCell();
				cell.textContent = game.height;
				cell.style.width = "2em";

				cell = row.insertCell();
				cell = row.insertCell();
				var button = document.createElement( "button");
				button.textContent = "Join";
				button.addEventListener( "click", (evt)=>{
					chainReactService.joinGame( game_.id );
				})
				cell.appendChild( button );
			})
		},
		clearGames() {
			while( myGameTable.rows.length > 2 )
				myGameTable.rows[2].remove();	
		}
	})
	popup.divFrame.style.left = localStorage.getItem( popup.divFrame.id + "/x" ) || 358;
	popup.divFrame.style.top = localStorage.getItem( popup.divFrame.id + "/y" ) || 71;

	var myGameTable = document.getElementById( "gameList" );
	var myGameName = document.getElementById( "myGameName" );
	var myGamePlayers = document.getElementById( "myGamePlayers" );
	var myGameWidth = document.getElementById( "myGameWidth" );
	var myGameHeight = document.getElementById( "myGameHeight" );
	var myGameCreate = document.getElementById( "createGame" );
	myGameCreate.addEventListener( "click", (evt)=>{
		try {
			if( ( Number(myGamePlayers.textContent) > 7 )  || ( Number(myGamePlayers.textContent) < 2 ) )
			{
				alertForm.caption = "Only 2 to 7 players may play";
				alertForm.show();
				return;
			}
			if( ( Number(myGameWidth.textContent) > 100 ) || ( Number(myGameWidth.textContent) < 4 ) ) {
				alertForm.caption = "Width must be between 4 and 100";
				alertForm.show();
				return;
			}
			if( ( Number(myGameHeight.textContent) > 100 ) || ( Number(myGameHeight.textContent) < 4 ) ) {
				alertForm.caption = "Height must be between 4 and 100";
				alertForm.show();
				return;
			}
			chainReactService.createGame( myGameName.textContent
				, Number(myGamePlayers.textContent)
				, Number(myGameWidth.textContent)
				, Number(myGameHeight.textContent) );
		}catch(err) {
			alert( "Format error in numbers (maybe?)");
		}
	})
	
	//popup.divFrame.style.visibility = "hidden";
	//popupTracker.addPopup( popup );
	return popup;
}

var foyerForm = initFoyerForm();
foyerForm.hide();

function initGameChatForm() {
	var popup = popupTracker.find( "gameChat" );
	if( !popup ) popup = {
		divFrame : document.getElementById( "gameChat" ),
		divCaption : document.getElementById( "gameChatCaption" ),
	}
	Object.assign( popup, {
		divSendText : document.getElementById( "gameChatSend"),
		btnSendText : document.getElementById( "chatSendButton" ),
		set caption(val) {
			popup.divCaption.innerText = val;
		},
		get caption() {
			return popup.divCaption.innerText;
		},
		hide() {
			this.divFrame.style.display = "none";
		},
		show() {
			this.divFrame.style.display = "unset";
		},
	})
	popup.divFrame.style.left = localStorage.getItem( popup.divFrame.id + "/x" ) || 483;
	popup.divFrame.style.top = localStorage.getItem( popup.divFrame.id + "/y" ) || 201;
	//popupTracker.addPopup( popup );
	return popup;
}

var gameChatForm = initGameChatForm();
gameChatForm.hide();


//---------------------------------------------------------------------------
//  Begin Connection to services.

var chainReactService = null; // this is the thing to talk to the server with.

protocol.connect( connectEventHandler );

function connectEventHandler(a,b,c ) {
	if( a.op === "status") {
		loginForm.setStatus( a.status );
	}else {
		if( a.op == "login" ) {
			// b.ws == auth connection to do login....
			protocol.relogin( "chainReaction", handleService );

		}
		else
			console.log( "got:", a, b, c );
	}
}

//---------------------------------------------------------------------------



//---------------------------------------------------------------------------
//  BEGIN GAME LOGIC


function makePlayer() {
	var player = {
			 x :0, y:0, // cursor position
			 color:l.players.length,
			 active:false,
			 went:false,
			 wins:0,
			 count:0, // maybe check this for win/loss?
			 moves : 0,
			 computer:false,
			 name:"",
	};
	l.players.push(player );
	return player;
}


function initBoard() {

	l.tick = 0;
	l.gameLog.length = 0;
	l.noMoveMask.length = 0;
	l.timeOut.length = 0;
	l.noMoveMask.length = 0;
	l.canMoveMask.length = 0;

	gameStatusForm.players = l.players.length;

	var del1 = gameBoard.height / (l.rows+0);
	var del2 = gameBoard.width / (l.cols+0);
	if( del1 > del2 )
		del1 = del2;
	else
		del2 = del1;
	var pad1 = ( gameBoard.height - ( l.rows * del1 ) ) / 2;
	var pad2 = ( gameBoard.width - ( l.cols * del2 ) ) / 2;
	var rows = [];
	l.currentPlayer = 0;
	l.boardAtoms.length = 0;
	l.board.length = 0;
	l.peiceSize = del1/3;
	l.peiceDist = ((l.peiceSize*11)/16 )
	l.ExplodeHead = l.ExplodeTail = 0;
	l.Explode = [];//new Array( l.rows*l.cols ); // maximum number of cells that can be queued...
	for( var r = 0; r < l.rows; r++ ) {
		var rx = (pad1 + r * del1 )|0;
		rows.push( rx ) ;
		l.board.push([]);
		l.boardAtoms.push([]);
		for( var c = 0; c < l.cols; c++ ) {
			l.Explode.push( {x:0,y:0})
			l.board[r].push( {player:-1,count:0,stable:true} );
			l.boardAtoms[r].push( [] );

			if( r && ( r < (l.rows-1) ) )
				l.timeOut.push(false);
			if( c && ( c < (l.cols-1) ) )
				l.timeOut.push(false);
			l.timeOut.push(false);
			l.timeOut.push(false);
			l.noMoveMask.push(0);
			l.canMoveMask.push(1);

			for( var depth = 0; depth < 8; depth++ ) 
				l.boardAtoms[r][c].push( { x:0,y:0 } );
		}
	}
	{
		var rx = (pad1 + l.rows * del1 )|0;
		rows.push( rx ) ;
	}
	var cols = [];
	for( var r = 0; r <= l.cols; r++ ) {
		var ry = (pad2 + r* del2 )|0;
		cols.push( ry ) ;
	}
	l.cellx = cols.map( (val,idx)=>idx < cols.length-1?(val+cols[idx+1])/2:undefined);
	l.celly = rows.map( (val,idx)=>idx < rows.length-1?(val+rows[idx+1])/2:undefined);
	l.widths = cols;
	l.heights = rows;
}
initBoard();

function processImage( image, r,g,b ) {
	gameBoard.width = image.width;
	gameBoard.height = image.height;
	gameCtx.fillStyle = "transparent";
	gameCtx.fillStroke = "transparent";
	gameCtx.clearRect( 0, 0, 500, 500 );
	var myImageData = gameCtx.getImageData(0, 0, image.width, image.height);
	gameCtx.drawImage(image, 0, 0);
	var myImageData = gameCtx.getImageData(0, 0, image.width, image.height);
	var outImageData = gameCtx.createImageData(image.width, image.height);
	var numBytes = myImageData.data.length;
	for( n = 0; n < numBytes; n+=4 ) {
		outImageData.data[n+0] = (myImageData.data[n+0] * r[0]
				  + myImageData.data[n+1] * g[0]
				  + myImageData.data[n+2] * b[0])>>8
				;	
		outImageData.data[n+1] = ( myImageData.data[n+0] * r[1]
				  + myImageData.data[n+1] * g[1]
				  + myImageData.data[n+2] * b[1] ) >> 8;
				;	
		outImageData.data[n+2] = ( myImageData.data[n+0] * r[2]
				  + myImageData.data[n+1] * g[2]
				  + myImageData.data[n+2] * b[2] ) >> 8;
				;	
		outImageData.data[n+3] = myImageData.data[n+3];
		
	}
	gameCtx.putImageData(outImageData, 0, 0)
	var image = new Image();
	image.src = gameBoard.toDataURL();
	return image;
	return outImageData;
	//img.style.display = 'none';	
}

function makePeices() {
	grids.push( imageElements[2] );
	grids.push( processImage( imageElements[2], [255,0,0], [0,0,0], [0,0,0] ))
	pieces.push( processImage( imageElements[0], [0,0,0], [128,192,192], [455,0,0] ) );

	grids.push( processImage( imageElements[2], [0,255,0], [0,0,0], [0,0,0] ))
	pieces.push( processImage( imageElements[0], [0,0,0], [192,158,192], [0,255,0] ) );

	grids.push( processImage( imageElements[2], [0,0,255], [0,0,0], [0,0,0] ))
	pieces.push( processImage( imageElements[0], [0,0,0], [255,255,255], [0,0,255] ) );

	grids.push( processImage( imageElements[2], [255,0,255], [0,0,0], [0,0,0] ))
	pieces.push( processImage( imageElements[0], [0,0,0], [128,255,128], [255,0,255] ) );

	grids.push( processImage( imageElements[2], [255,255,0], [0,0,0], [0,0,0] ))
	pieces.push( processImage( imageElements[0], [0,0,0], [128,128,255], [255,255,0] ) );

	grids.push( processImage( imageElements[2], [0,255,255], [0,0,0], [0,0,0] ))
	pieces.push( processImage( imageElements[0], [0,0,0], [255,128,128], [0,255,255] ) );

	grids.push( processImage( imageElements[2], [192,128,25], [0,0,0], [0,0,0] ))
	pieces.push( processImage( imageElements[0], [0,0,0], [192,192,255], [192,128,25] ) );
	console.log( "this is what limits it to 7... make some new colors." );
	gameBoard.width = 800;	
	gameBoard.height = 600;
}


function loadImage( image ) {
	var i = document.createElement( "IMG" );
        imageElements.push(i);
        i.src = image;
	//i.crossOrigin = "Anonymous";
	//i.crossOrigin = "Anonymous";
        i.onload = ()=>{
        	if( image_index < images.length )
	        	loadImage( images[image_index++] );
			else {
				makePeices();
				drawBoard();
			}
        }
}

gameBoard.addEventListener( "click", (evt)=>{
	var rect = gameBoard.getBoundingClientRect();
    var clientX = evt.clientX - rect.left;
	var clientY = evt.clientY - rect.top;
	clientX = clientX * gameBoard.width/rect.width;
	clientY = clientY * gameBoard.height/rect.height;

	var x = l.widths.findIndex( (col,idx)=>idx<l.widths.length?l.widths[idx]<clientX&&l.widths[idx+1]>clientX:false);
	
	var y = l.heights.findIndex( (col,idx)=>idx<l.heights.length?l.heights[idx]<clientY&&l.heights[idx+1]>clientY:false);
	
	//console.log( "click event:", evt, x, y )
	if( x < 0 || y < 0 ) 
		return;
	if( x >= l.board[y].length || y >= l.board.length )
		return;

	if( l.board[y][x].player < 0 || l.board[y][x].player === l.currentPlayer)
		chainReactService.putPiece( x, y, clientX - l.cellx[x], clientY - l.celly[y] );
	else {
		alertForm.caption = "Illegal Move";
		alertForm.show();
	}
})

loadImage( images[image_index++] );

function drawBoard() {
	gameCtx.fillStyle = "RED";
        
	gameCtx.strokeStyle = "RED";
	gameCtx.clearRect( 0, 0, gameBoard.width, gameBoard.height );
	for( var r = 0; r < l.rows; r++ )
		for( var c = 0; c < l.cols; c++ ) {
			gameCtx.drawImage( grids[l.board[r][c].player+1]
					//imageElements[2]
					, l.widths[c], l.heights[r], l.widths[c+1]-l.widths[c], l.heights[r+1]-l.heights[r] );

		}
	//gameCtx.clearRect( 1, 1, 500, 500 );
		if( false ) {
	gameCtx.drawImage( imageElements[0], 50, 50 );
	gameCtx.drawImage( imageElements[1], 150, 50 );
	gameCtx.drawImage( imageElements[2], 250, 50 );

	gameCtx.drawImage( pieces[0], 50, 150 );
	gameCtx.drawImage( pieces[1], 150, 150 );
	gameCtx.drawImage( pieces[2], 250, 150 );
	gameCtx.drawImage( pieces[3], 50, 220 );
	gameCtx.drawImage( pieces[4], 150, 220 );
	gameCtx.drawImage( pieces[6], 250, 220 );
		}
	animateAtoms();
	for( var r = 0; r < l.rows; r++ )
		for( var c = 0; c < l.cols; c++ ) {
			var cnt = l.board[r][c].count;
			for( var i = 0; i < cnt; i++ ) {
				var x = l.boardAtoms[r][c][i].x + l.cellx[c];
				var y = l.boardAtoms[r][c][i].y + l.celly[r];
				gameCtx.drawImage( pieces[l.players[l.board[r][c].player].color]
					             , x - l.peiceSize/2, y - l.peiceSize/2, l.peiceSize, l.peiceSize );
			}
		}

	setTimeout( drawBoard, 40 );

}


//setTimeout( drawBoard, 100 );



var priorTick = Date.now();
function animateAtoms()
{
	var bx, by;
	var n;
	var dx, dy;
	var xy;
	var thisTick = Date.now();
	var thisDel = ((thisTick-priorTick)/100) ;
	priorTick = thisTick;
	//if( l.winstate ) return;
	//if( !animate )
	//	return;

	l.unstable = false;
   //cnt = 0;
	for( bx = 0; bx < l.cols; bx++ )
		for( by = 0; by < l.rows; by++ )
		{
			if( l.board[by][bx].stable )
			{
            /* if this square is stable, don't need to draw/update anything */
				continue;
			}
			xy = l.boardAtoms[by][bx];
			dx = l.cellx[bx];
			dy = l.celly[by];

			//Board[by][bx].stable = true;
			for( n = 0; n < l.board[by][bx].count; n++ )
			{
				var v1x, v1y;
				var v2x, v2y;
            //float
				//double dist;
				//float x,y, xd, yd;
				//printf( WIDE("Drawing %d, %d\n"), xy[n].x, xy[n].y );
            // move towards center...
				//lprintf( WIDE("Checking %g %g"), xy[n]._x, xy[n].x );

				//v1x = 20/(xy[n].x * xy[n].x);
				//v1y = 20/(xy[n].y * xy[n].y);

				xy[n].x += (-xy[n].x /7.0)*thisDel;
				xy[n].y += (-xy[n].y /7.0)*thisDel;
            //lprintf( WIDE("Checking %g %g"), xy[n]._x, xy[n].x );
				// move away from others near...
            {
            	var no;
					for( no = 0; no < l.board[by][bx].count; no++ )
					{
						var xd, yd, dist;
						if( no == n )
							continue;
						xd = xy[no].x - xy[n].x;
						yd = xy[no].y - xy[n].y;
						if( !xd && !yd )
						{
							xy[n].x +=1;
							xy[n].y +=1;
							xd = 1;
							yd = 1;
						}
					   dist = Math.sqrt( xd*xd + yd*yd);
					   if( dist < l.peiceDist )
					   {
							xd /= dist;
							yd /= dist;

					   	dist = l.peiceDist - dist;
					   	dist /= 2.0; // 2+
					   	xd *= dist;
					   	yd *= dist;
					   	xy[n].x -= xd;
					   	xy[n].y -= yd;
					   	xy[no].x += xd;
					   	xy[no].y += yd;
					   }
					} 
					//lprintf( WIDE("Checking %g %g"), xy[n]._x, xy[n].x );
				}
			}
			for( n = 0; n < l.board[by][bx].count; n++ )
			{
				var x,y;
            //lprintf( WIDE("Checking %g %g"), xy[n]._x, xy[n].x );
				x = xy[n]._x - xy[n].x;
				y = xy[n]._y - xy[n].y;
            /* need to update these all at once so that the above calcualtion with [no] works */
				xy[n]._x = xy[n].x;
				xy[n]._y = xy[n].y;
				var STABLEDEL = (2.0)
				if( x < -STABLEDEL || x > STABLEDEL || y < -STABLEDEL || y > STABLEDEL )
				{
					//lprintf( WIDE("UNSTABLE!-------------") );
					// also update this so we get a 0 delta.
					l.board[by][bx].stable = false;
					//unstable = true;
				}
			}
         /*
			if( Board[by][bx].stable )
			{
				for( n = 0; n < l.board[by][bx].count; n++ )
				{
					// also update this so we get a 0 delta.
 					xy[n]._x = xy[n].x;
					xy[n]._y = xy[n].y;
					//lprintf( WIDE("FINAL - MATCH Checking %g %g"), xy[n]._x, xy[n].x );
				}
				}
				*/
			// is unstable... has atoms moving into or out of(?)
			if( !l.winstate )
			if( CheckSquareEx( bx, by, false ) )
				UpdateBoardThread();
		}
	/* compute what explodes next... */
	//UpdateBoard(); // for each stable, enqueued suare...
	//if( !animate )
	//ShowPlayer( tru );

}

function clearBoard() {
	l.updating_board_end = 0; // allow board to update

}

function UpdateBoardThread(  )
{
		var bx, by;
		var updated;
		updated = 0;
		if( !l.updating_board_end )
		{
			//updating_board = 1;
			l.unstable = true;
			//cnt = 0;
			for( bx = 0; bx < l.cols; bx++ )
				for( by = 0; by < l.rows; by++ )
				{
					if( CheckSquareEx( bx, by, true ) )
						updated = 1;
					gameStatusForm.update();
				}
		}
		if( updated )
		{
			updateBoard();
			if( !l.winstate )
				setTimeout( UpdateBoardThread, 1 );
			//updating_board = 0;
			//Relinquish();
		}
}


function CheckSquareEx(  x, y,  explode )
//#define CheckSquare( x, y ) CheckSquareEx( x, y, true )
{
	var c;
	//if( !Board[y][x].stable )
	//	return false;
	if( l.sphere )
	{
		c = 4;
	}
	else
	{
		c = 2;
		if( x>0 && x < (l.cols-1) )
			c++;
		if( y>0 && y < (l.rows-1) )
			c++;
	}
	if( l.board[y][x].count >= c )
	{
		//players[l.Board[y][x].color].count -= c;
		//Board[y][x].count -= c;
		if( explode )
		{
			//if( animate )
				l.unstable = true;
			enqueCell( x, y );
		}
		return  true;
	}
	return  false;
}

function enqueCell(  x,  y )
{
	var n;
	// see if we enqueued this beast already!
	//printf( WIDE("Head: %d Tail: %d\n"), ExplodeHead, ExplodeTail );
	for( n = l.ExplodeTail; n != l.ExplodeHead; n++ )
	{
		if( n == (l.Explode.length) )
			n = 0;
		if( n == l.ExplodeHead )
			break;
		if( l.Explode[n].x == x && 
			l.Explode[n].y == y )
		{
			//printf( WIDE("Already Enqueued?\n") );
		   return;
		}
	}
	//printf( WIDE("Head: %d\n"), ExplodeHead );
	l.Explode[l.ExplodeHead].x = x;
	l.Explode[l.ExplodeHead].y = y;
	l.ExplodeHead++;
	if( l.ExplodeHead == (l.Explode.length) )
		l.ExplodeHead = 0;
}

function dequeCell(  )
{
	if( l.ExplodeTail == l.ExplodeHead )
		return null;
	//printf( WIDE("Tail: %d\n"), ExplodeTail );
	var ret =  l.Explode[l.ExplodeTail];
	l.ExplodeTail++;
	if( l.ExplodeTail == l.Explode.length )
		l.ExplodeTail = 0;
	return ret;
}

function explodeInto( x, y, into_x, into_y )
{
	var real_into_x = into_x;
	var real_into_y = into_y;
	if( l.sphere )
	{
		if( into_x < 0 )
		{
			l.boardAtoms[y][x][l.board[y][x].count-1].wrap_x--;
			into_x += l.cols;
		}
		if( into_y < 0 )
		{
			l.boardAtoms[y][x][l.board[y][x].count-1].wrap_y--;
			into_y += l.rows;
		}
		if( into_x >= l.cols )
		{
			l.boardAtoms[y][x][l.board[y][x].count-1].wrap_x++;
			into_x -= l.cols;
		}
		if( into_y >= l.rows )
		{
			into_y -= l.rows;
			l.boardAtoms[y][x][l.board[y][x].count-1].wrap_y++;
		}
	}


	l.players[l.board[y][x].player].count--;
	l.board[y][x].count--;
	//if( animate )
	{
		l.boardAtoms[into_y][into_x][l.board[into_y][into_x].count].x = l.boardAtoms[y][x][l.board[y][x].count].x;
		l.boardAtoms[into_y][into_x][l.board[into_y][into_x].count].y = l.boardAtoms[y][x][l.board[y][x].count].y;

		l.boardAtoms[into_y][into_x][l.board[into_y][into_x].count].x += l.cellx[x] - l.cellx[real_into_x];
		l.boardAtoms[into_y][into_x][l.board[into_y][into_x].count].y += l.celly[y] - l.celly[real_into_y];
		//BoardAtoms[into_y][into_x][l.board[into_y][into_x].count].__x = BoardAtoms[into_y][into_x][l.board[into_y][into_x].count].x;
		//BoardAtoms[into_y][into_x][l.board[into_y][into_x].count].__y = BoardAtoms[into_y][into_x][l.board[into_y][into_x].count].y;
	}
	// if 0, 1
	if( l.board[into_y][into_x].count < 2 )
	{
		if( l.board[into_y][into_x].player >= 0 ) {
			l.players[l.board[into_y][into_x].player].count -= l.board[into_y][into_x].count;
			l.players[l.board[y][x].player].count += l.board[into_y][into_x].count;
		}
		//if( Board[into_y][into_x].player != Board[y][x].player )
		//	DrawSquare( into_x, into_y, false );
		l.board[into_y][into_x].player = l.board[y][x].player;
	}
	l.board[into_y][into_x].count++;
	l.players[l.board[into_y][into_x].player].count++;


	if( CheckSquareEx( into_x, into_y, false ) ) {
		l.players[l.board[into_y][into_x].player].count -= l.board[into_y][into_x].count;
		l.players[l.board[y][x].player].count += l.board[into_y][into_x].count;
		l.board[into_y][into_x].player = l.board[y][x].player;
	}
	//if( !animate )
//		l.board[into_y][into_x].stable = true;
//	else
	l.board[into_y][into_x].stable = false;

	
	/*
	if( !animate )
	{
		CheckSquareEx( into_x, into_y, true );
		DrawSquare( into_x, into_y, true );
	}
	*/
}

function updateBoard(  )
{
	var exploded;
	var x, y;
	var first = true;
	//improve this with a queue process...
	do
	{
		exploded = false;
		var cell;
		while( cell = dequeCell() )
		{
			x = cell.x; y = cell.y;
			exploded = true;
			//if( first )
			//	PlaySound( WIDE("44magnum.wav"), NULL, 0x00020003L );

			first = false;
			if( l.sphere || ( x > 0 ) )
			{
				explodeInto( x, y, x-1, y );
			}
			if( l.sphere || ( x < ( l.cols-1 ) ) )
			{
				explodeInto( x, y, x+1, y );
			}
			if( l.sphere || ( y > 0 ) )
			{
				explodeInto( x, y, x, y-1 );
			}
			if( l.sphere || ( y < ( l.rows-1 ) ) )
			{
				explodeInto( x, y, x, y+1 );
			}
			if( !l.board[y][x].count )
			{
				l.board[y][x].stable = true;
			}
			else
				l.board[y][x].stable = false; //remaining pieces may be moving some...
			if( !l.board[y][x].count )
				l.board[y][x].player = -1;
			//if( !animate )
			//	DrawSquare( x, y, TRUE );
			if( !l.winstate )
			{
				doLose(); // check to see if we knocked out someone..
				if( l.winstate = findWinner() )
				{
					gameStatusForm.update();
					//if( !animate )
					//	ShowPlayer( TRUE );
					return true;
				}
			}
		}
      //Idle();//Relinquish();
	}while( exploded );

	gameStatusForm.update();

	//if( winstate )
	//	return FALSE;
	return false;
}


var tfModel = null;

async function initAI(  ) {
	tfModel = await tf.loadLayersModel( "./playBrain/model.json" );
	console.log( "model:", tfModel );
}
initAI();

async function pickAiMove_generation_one() {
	var thisTick = l.tick-1;
	var thisMove = l.gameLog[thisTick];
	
		var tickTensor = tf.tensor3d( [[thisMove.tick]] );
		//var tickTensorBatch = tf.tensor2d( [tickTensor], [1,tickTensor.shape[0]] )
		// 160 bits

		var boardTensor = tf.tensor3d( [[thisMove.board]] );
		// 40 * 7
		var canMoveTensor = tf.tensor3d( [[thisMove.canMove]] );
		// 40 bits (mask on softmax activation)
		var lastMoveTensor = tf.tensor3d( [[thisMove.lastMove]] );
		var maskTensor = tf.zeros([1,1,1]);

		var prediction = await tfModel.predict( [tickTensor,boardTensor,maskTensor] );
		prediction.print();
		var thing = tf.argMax(prediction, 2).dataSync();

	var m = thing%l.cols;
	var n = ( thing / l.cols ) | 0;
	if( l.board[n][m].player < 0 || l.board[n][m].player == l.currentPlayer )
		chainReactService.putPiece( m, n, 0, 0 );
	else {
		console.log( "MOve is illegal; rechoosing" );
		pickAiMove_generation_zero();
	}

}

function pickAiMove_generation_zero() {
	if( l.winstate )
		return;
		
	var n = l.RNG.getBits( 16 );
	var m = l.RNG.getBits( 16 );
	n = ( l.rows * n / 65535 ) | 0;
	m = ( l.cols * m / 65535 ) | 0;
	if( l.board[n][m].player < 0 || l.board[n][m].player == l.currentPlayer )
		chainReactService.putPiece( m, n, 0, 0 );
	else
		return pickAiMove_generation_zero();


}

function doLose() {
	// scan to see if someone is out entirely.
	l.players.forEach( player=>{
		if( player.active ) {
			if( !player.count ) {
				if( player.moves )
					player.active= false;
			}
		}
	})
}

function findWinner() {
	// is there no other players?
	var win = false;
	var winner = null;
	l.players.forEach( player=>{
		if( player.active ) 
			if( !winner ) { 
				winner = player;
				win = true;
			}
			else win = false;
	})
	if( win )
		return winner;
	return null;
}

function sendMessage( msg ) {

}
