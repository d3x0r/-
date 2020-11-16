var init_code = "2468";
var start_code = "13579";


//document.body.background="images/ff/Scoreboard_static.png"
//document.body.background="images/ff/Scoreboard_static.png"
//document.body.style.backgroundSize = "cover";
document.body.style.background = "rgba(0,0,0,0.5)";
//document.body.style.webkitBackgroundSize = "cover";

var gameContainer = document.createElement( "div" );
gameContainer.style.position = "absolute";
gameContainer.style.left = 0;
gameContainer.style.top = 0;
gameContainer.style.width = "100%";
gameContainer.style.height = "100%";

gameContainer.style.border = 0;
var introMovie = document.createElement( "video" );
introMovie.src = "images/ff/videos/Lula_FF_Attract_720.mp4";
introMovie.style.objectFit = "cover";
introMovie.style.width = "100%";
introMovie.style.height = "99.75%";
introMovie.style.border = 0;
introMovie.loop = true;
introMovie.addEventListener( "mousedown", beginGame );
introMovie.addEventListener( "ontouch", beginGame );

function restart() {
	introMovie.currentTime = 0;
}

function begin() {
	introMovie.play();
	gameContainer.appendChild( introMovie );
}

var key_string = "";
var last_key_time = 0;
document.body.addEventListener( "keypress", doKeyDown, true);
function doKeyDown(e) {
	if( ( e.timeStamp - last_key_time ) > 1000 )
		key_string = "";
	last_key_time = e.timeStamp;
	key_string += String.fromCharCode(e.keyCode);
	if( key_string === init_code ) {
		console.log( "Do Init" );
	}
	if( key_string === start_code ) {
		console.log( "Do Game" );
		beginGame();
	}
}

var down = 0;

function beginGame(){
		console.log( "down is " + down );
		if( down === 4 ) {
			down = 0;
			clearScoreboard();
			begin();
		}
		else if( down === 0 )
		{
			console.log( "clear startup movie" );
			introMovie.pause();
			gameContainer.removeChild( introMovie );
			intro();
		}
}

function intro() {
	gameContainer.appendChild( introGameMovie );
	introGameMovie.currentTime = 0;
	introGameMovie.play();
	down = 1;
}

function playSecondDown() {
	gameContainer.appendChild( secondDownMovie );
	secondDownMovie.currentTime = 0;
	secondDownMovie.play();
	down = 2;
}

function playThirdDown() {
	gameContainer.appendChild( thirdDownMovie );
	thirdDownMovie.currentTime = 0;
	thirdDownMovie.play();
	down = 3;
}

function showScoreboard() {
	gameContainer.appendChild( scoreMovie );
	scoreMovie.currentTime = 0;
	scoreMovie.play();
	down = 4;
	console.log( "setting timeout? ");
	setTimeout( addScores, 5000 );
}

function addScores() {
	var label;
	console.log( "Adding Score elements?" );
	label = document.createElement( "div" );
	label.style.position = "absolute";
	label.style.left = "0%";
	label.style.fontSize = "48px";
	label.style.textAlign = "center";
	label.style.width = "100%";
	label.innerHTML = "0 1 2 3 4 5 6 7 8";
	label.style.top = "37%";
	label.zIndex = 3;
	gameContainer.appendChild( label );
	
	label = document.createElement( "div" );
	label.style.position = "absolute";
	label.style.left = "0%";
	label.style.fontSize = "48px";
	label.style.textAlign = "center";
	label.style.width = "100%";
	label.innerHTML = "0 1 2 3 4 5 6 7 8";
	label.style.top = "47%";
	label.zIndex = 3;
	gameContainer.appendChild( label );
	
	label = document.createElement( "div" );
	label.style.position = "absolute";
	label.style.left = "0%";
	label.style.fontSize = "48px";
	label.style.textAlign = "center";
	label.style.width = "100%";
	label.innerHTML = "0 1 2 3 4 5 6 7 8";
	label.style.top = "57%";
	label.zIndex = 3;
	gameContainer.appendChild( label );
	
	label = document.createElement( "div" );
	label.style.position = "absolute";
	label.style.left = "0%";
	label.style.fontSize = "48px";
	label.style.textAlign = "center";
	label.style.width = "100%";
	label.innerHTML = "0 1 2 3 4 5 6 7 8";
	label.style.top = "67%";
	label.zIndex = 3;
	gameContainer.appendChild( label );
}

function clearScoreboard() {
	while( gameContainer.firstChild )
		gameContainer.removeChild( gameContainer.firstChild );
}

function firstDownEnded() {
	if( gameContainer.contains( introGameMovie ) )
		gameContainer.removeChild( introGameMovie );
	if( gameContainer.contains( secondDownMovie ) )
		gameContainer.removeChild( secondDownMovie );
	if( gameContainer.contains( thirdDownMovie ) )
		gameContainer.removeChild( thirdDownMovie );
	
	gameContainer.appendChild( helmetBackground );
	gameContainer.appendChild( helmetGrid );
	helmetStills.forEach( ( img ) => { 
		gameContainer.appendChild( img ); } 
	);
}

function clearHelmets() {
	helmetStills.forEach( ( img ) => { 
		gameContainer.removeChild( img ); } 
	);
	gameContainer.removeChild( helmetBackground );
	gameContainer.removeChild( helmetGrid );
}

function helmetClicked( e ) {
	gameContainer.removeChild( e );
	gameContainer.appendChild( helmetAnimations[ e.id] );
	helmetAnimations[ e.id].currentTime = 0;
	helmetAnimations[ e.id].play();
}

function helmetEnded( e ) {
	console.log( "helmet ended." );
	gameContainer.removeChild( e );
	gameContainer.appendChild( helmetStills[ e.id] );
	clearHelmets();
	switch( down ) {
		case 1:
			playSecondDown();
			break;
		case 2:
			playThirdDown();
			break;
		case 3:
			showScoreboard();
			break;
	}
}

var introGameMovie = document.createElement( "video" );
var secondDownMovie = document.createElement( "video" );
var thirdDownMovie = document.createElement( "video" );
var scoreMovie = document.createElement( "video" );
var helmetBackground = document.createElement( "img" );
var helmetGrid = document.createElement( "img" );

var helmetStillSrcs = ["ARIZONA",
"ATLANTA",
"BALTIMORE",
"BUFFALO",
"CAROLINA",
"CHICAGO",
"CINCINNATI",
"CLEVELAND",
"DALLAS",
"DENVER",
"DETROIT",
"GREEN BAY",
"HOUSTON",
"INDIANAPOLIS",
"JACKSONVILLE",
"KANSAS CITY",
"MIAMI",
"MINNESOTA",
"NEW ENGLAND",
"NEW ORLEANS",
"NEW YORK_G",
"NEW YORK_J",
"OAKLAND",
"PHILADELPHIA",
"PITTSBURGH",
"SAN DIEGO",
"SAN FRANCISCO",
"SEATTLE",
"ST LOUIS",
"TAMPA BAY",
"TENNESSEE",
"WASHINGTON", ];

var helmetStills = [];
var helmetAnimations = [];

function setVideoProps( video ) {
	video.style.objectFit = "cover";
	video.style.width = "100%";
	video.style.height = "99.75%";
	video.style.border = 0;

}


function delayLoad() {
	introGameMovie.src = "images/ff/videos/Intro_First_down.mp4";
	setVideoProps( introGameMovie );
	introGameMovie.addEventListener( "ended", firstDownEnded );
	secondDownMovie.src = "images/ff/videos/SECOND DOWN_with VO.mp4";
	setVideoProps( secondDownMovie );
	secondDownMovie.addEventListener( "ended", firstDownEnded );
	thirdDownMovie.src = "images/ff/videos/THIRD DOWN_with VO.mp4";
	setVideoProps( thirdDownMovie );
	thirdDownMovie.addEventListener( "ended", firstDownEnded );
	
	scoreMovie.src = "images/ff/videos/Scoreboard_lulaFF_1280x720.mp4";
	setVideoProps( scoreMovie );
	scoreMovie.addEventListener( "mousedown", beginGame );
	scoreMovie.addEventListener( "ontouch", beginGame );
	scoreMovie.style.zIndex = 1;
	
	helmetBackground.src = "images/ff/grid_background.jpg";
	helmetBackground.style.position = "absolute";
	helmetBackground.style.width = "100%";
	helmetBackground.style.height = "100%";
	helmetBackground.style.zIndex = "0";
	
	helmetGrid.src = "images/ff/grid-composite.png";
	helmetGrid.style.position = "absolute";
	helmetGrid.style.width = "100%";
	helmetGrid.style.height = "100%";
	helmetGrid.style.zIndex = "0";
	

	helmetStillSrcs.forEach( (name,index)=> { 
		helmetStills[index] = document.createElement( "img" );
		helmetStills[name] = helmetStills[index];
		helmetStills[index].id = name;
		helmetStills[index].src = "images/ff/videos/helmet/" + name + ".png";
		helmetStills[index].style.zIndex = 3;
		helmetStills[index].style.position = "absolute";
		helmetStills[index].style.left = ( ( ( index % 8 ) * 11.9 ) + 3.5 ) + "%";
		helmetStills[index].style.top = ( ( Math.floor( index / 8 ) * 24 ) + 3 ) + "%";
		helmetStills[index].style.width = "10%";
		helmetStills[index].style.height = "20%";
		//helmetStills[index].addEventListener( "onclick", () => { helmetClicked(helmetStills[index] ); } );
		helmetStills[index].addEventListener( "mousedown", () => { helmetClicked(helmetStills[index] ); } );
		helmetStills[index].addEventListener( "ontouch", () => { helmetClicked(helmetStills[index] ); } );
		helmetAnimations[index] = document.createElement( "video" );
		helmetAnimations[name] = helmetAnimations[index];
		helmetAnimations[index].id = name;
		helmetAnimations[index].src = "images/ff/videos/helmet/" + name + ".webm";
		helmetAnimations[index].style.zIndex = 1;
		helmetAnimations[index].style.position = "absolute";
		helmetAnimations[index].style.left = ( ( ( index % 8 ) * 11.9 ) + 3.5 ) + "%";
		helmetAnimations[index].style.top = ( ( Math.floor( index / 8 ) * 24 ) + 3 ) + "%";
		helmetAnimations[index].style.width = "10%";
		helmetAnimations[index].style.height = "20%";
		helmetAnimations[index].width = "10%";
		helmetAnimations[index].height = "20%";
		helmetAnimations[index].addEventListener( "ended",  () => { helmetEnded( helmetAnimations[index] ); } );
	} );
	//intro();
}


//-------------- Prize Information ---------------

var prizeLine;
var games = 200;

function Prize( image, val ) {
	var prize = { value : val
		, image : document.createElement( "img" )
	}
	prize.image.src = image;
}

//------------------------------------------------------------


document.body.appendChild( gameContainer );
begin();
setTimeout( delayLoad, 10 );