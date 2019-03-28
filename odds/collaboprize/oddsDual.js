
var RNG = require( "./salty_random_generator.js" );
const generator = require( "./generator" );


var calledballs = generator.DrawRandomNumbers2();

for( var i = 0; i < 1000; i++  )
	runYear();

function runYear() {

var balls = [];
var gameUsed = [];
var game2Used = [];
var counters = [ [],[]];
var dualwins = 0;
var payout = [50000,5000,1000,300,200,100];
const hotballs = 6;
const intoGames = 15;  // 
const flatGames = 15;  // 
const games = 30;

var n ;
var dup;

calledballs = generator.DrawRandomNumbers2();
for( n = 0; n < hotballs; n++ ) {
	balls.push(calledballs.pop());
	gameUsed.push(false);
	game2Used.push(false);
	counters[0][n] = 0;
	counters[1][n] = 0;
}


	counters[0][n] = 0;
	counters[1][n] = 0;



var ig = 0;
var fg = 0;


function runGame() {

// $5  66 players   33 playing
// 2 location
	for( n = 0; n < hotballs; n++ ) {
		gameUsed[n] = false;		
		game2Used[n] = false;		
	}


	for( var g = 0; g < games; g++ ) {

		calledballs = generator.DrawRandomNumbers2();
		var thisballused = false;
		var thisBall = calledballs[0];
		var ballId = balls.findIndex( ball=>ball===thisBall );
		if( ballId>=0 ) {
			if( gameUsed[ballId] ) {
				dup++;
			} else {
				gameUsed[ballId] = true;
				if( g < flatGames )  {
					game2Used[ballId] = true;
					thisballused = true;
				}
			}
		}

		if( g < intoGames ) {
			thisBall = calledballs[1];
			ballId = balls.findIndex( ball=>ball===thisBall );
			if( ballId>=0 ) {
				if( game2Used[ballId] ) {
					dup++;
				} else {
					if( thisballused ) dualwins++;
					game2Used[ballId] = true;
				}
			}
		}
	}


	var ballsUsed = gameUsed.reduce( (acc,tf)=>(tf)?acc+1:acc, 0 );
	var balls2Used = game2Used.reduce( (acc,tf)=>(tf)?acc+1:acc, 0 );
	if( ballsUsed > hotballs ) console.log( "WHY?", gameUsed );
	if( balls2Used > hotballs ) console.log( "WHY?", game2Used );
	//console.log( "balls:", ballsUsed, balls2Used );
	for( var m = 0; m <= ballsUsed; m++ )
		counters[0][m]++
	for( var m = 0; m <= balls2Used; m++ )
		counters[1][m]++
}


for( var z = 0;  z < 365; z++ )  {
	runGame();

}
		console.log( [z, counters[0].join(","), counters[1].join(",")].join(','), "dual:", dualwins );

}

