
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
const hotballs = 9;
const intoGames = 15;  // 
const flatGames = 15;  // 
const games = 10;

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
	var win = 0;

	for( var g = 0; g < games; g++ ) {

		calledballs = generator.DrawRandomNumbers2();
		if( calledballs[0] < 16 ) 
			win++;

	}
		
	counters[0][win]++;

}


for( var z = 0;  z < 1000; z++ )  {
	runGame();
	
}	
		for( var z = 0; z < hotballs; z++ )  {
			counters[1][z] = counters[0].reduce( (acc,val,idx)=>(idx >= z)?(acc+val):acc, 0 );
			//counters[1][z] = counters[1][z];
		}
		console.log( [ z, counters[0].join(","), counters[1].join(",") ] .join(",") );

}

