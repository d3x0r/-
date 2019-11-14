
var RNG = require( "./salty_random_generator.js" );
const generator = require( "./cardset-generator/card_generator.js" );
//console.log( "TICK?", generator.make3Cards() );
var cards = [];//

for( var n = 0; n < 50; n++ )  // 25*3 cards = 75 cards in play
	cards.push(generator.make3Cards());
console.log( "TICK?", cards );

var calledballs = generator.DrawRandomNumbers2();

for( var i = 0; i < 1000; i++  )
	runYear();

function runYear() {

var balls = [];
var gameUsed = [];
var game2Used = [];
var counters = [ [],[]];
var bestwin = new Array(76).fill( 0 );
var bestRow = new Array(5).fill( 0 );
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

	//for( var g = 0; g < games; g++ ) 
	{
		calledballs = generator.DrawRandomNumbers2();
		if( calledballs[0] < 16 ) 
			win++;

		var marks = 0;
		var win = 76;
		var lastRow = -1;
	//console.log( " -------- " );
		cards.forEach( (cardset,ci)=>{
			cardset.forEach( (card)=>{
				marks = 0;
				for( b = 0; b < calledballs.length; b++ ) {
					var row = ((calledballs[b] -1)/15)|0;
					if( card[row].find( (ball)=>{  
						//if(ball==calledballs[b])  console.log( "CHECK: ", ball, calledballs[b], marks, b ); 
						return ball==calledballs[b] 
					} ) ) {
						marks++;
					}
					if( marks == 24 )  {
	//					console.log( b, calledballs[b] );
						if( b < win ) {
							win = b;
							lastRow = row;
						}
						break;
					}
				}
			});
		} );
				{
					bestwin[win] ++;
					bestRow[lastRow]++;
					//break;
				}

	}
	
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

 bestwin.fill(0);
 bestRow.fill(0);

for( var z = 0;  z < 1000; z++ )  {
	runGame();
	
}	
		bestwin.forEach( (w,n)=>{
			bestwin[n] = 1000-bestwin.reduce( (acc,val,idx)=>(idx >= n)?(acc+val):acc, 0 );
		} );
		for( var x = 0; x < hotballs; x++ )  {
			counters[1][x] = counters[0].reduce( (acc,val,idx)=>(idx >= x)?(acc+val):acc, 0 );
			//counters[1][x] = counters[1][x];
		}
		console.log( [ z, bestwin.map( (n,i)=>(JSON.stringify({n:i,wins:n})) ).join(",")
				, "     "
				, bestRow.join(",")
				, bestRow.reduce( (acc,val)=>acc+val,0 ) 
			] .join(",") );

}

