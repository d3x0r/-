"use strict";

//--------------- Usage
// var card_classify = require( "../cardset-classify/classify.js" );
//  var cardrow = [2,3,4,5,6];
// card_classify.getPerm( cardrow, result_object );
// var newrow card_classify.getRow( result.perm, result.comb, cardrow.length );
// // newrow array and cardrow array will be the same...
//
//


var perms_5 = [];
var perms_4 = [];
var comb_5 = [];
var comb_5_other = [];
var comb_5_other_last = [];
var comb_4 = [];

//var row_perms_5 = [];
//var row_perms_4 = [];
var row_perms_5_index = new Array(15);
for( var n = 0; n < 15; n++ ) {
	row_perms_5_index[n] = new Array(15);
	for( var m = 0; m < 15; m++ ) { row_perms_5_index[n][m] = []; }
}
var row_perms_4_index = new Array(15);
for( var n = 0; n < 15; n++ ) {
	row_perms_4_index[n] = new Array(15);
	for( var m = 0; m < 15; m++ ) { row_perms_4_index[n][m] = []; }
}

var raw_row_perms_5 = [];
var raw_row_perms_4 = [];
exports.row_perms_5_index = row_perms_5_index;
exports.row_perms_4_index = row_perms_4_index;
exports.raw_row_perms_5 = raw_row_perms_5;
exports.raw_row_perms_4 = raw_row_perms_4;

function initRowPerms(  ) {
	for( var a = 1; a <= 15; a++ )
		for( var b = 1; b <= 15; b++ )
			for( var c = 1; c <= 15; c++ )
				for( var d = 1; d <= 15; d++ )
					for( var e = 1; e <= 15; e++ ) {
						var comb = [a+0,b+15,c+30,d+45,e+60];
						row_perms_5_index[a-1][b-1].push( comb )
						//row_perms_5.push( comb );
						//console.log( 'row_perms_5  = ', row_perms_5[row_perms_5.length-1])
						raw_row_perms_5.push( [a,b,c,d,e] );
					}
	for( var a = 1; a <= 15; a++ )
		for( var b = 1; b <= 15; b++ )
			for( var c = 1; c <= 15; c++ )
				for( var d = 1; d <= 15; d++ ) {
					var comb = [a+0,b+15,c+45,d+60] ;
						row_perms_4_index[a-1][b-1].push( comb )
						//row_perms_4.push( comb );
						raw_row_perms_4.push( [a,b,c,d] );
					}
}
initRowPerms();
//console.log( "done row perms", raw_row_perms_5.length, raw_row_perms_4.length);

function initPerms( ) {
	for( var a = 0; a < 5; a++ ) {
		for( var b = 0; b < 5; b++ ) {
                	if( a == b )
	                        continue;
		       	for( var c = 0; c < 5; c++ ) {
                        	if( a == c || b == c )
                                	continue;
			       	for( var d = 0; d < 5; d++ ) {
                                	if( a == d || b == d || c == d )
                                        	continue;
		       		       	for( var e = 0; e < 5; e++ ) {
	                                	if( a == e || b == e || c == e || d == e)
        	                                	continue;
                                                perms_5.push( [a,b,c,d,e] );
						//console.log( perms_5[perms_5.length-1] );
                                        }
                                }
                        }
                }
        }
	for( var a = 0; a < 4; a++ ) {
		for( var b = 0; b < 4; b++ ) {
                	if( a == b )
	                        continue;
		       	for( var c = 0; c < 4; c++ ) {
                        	if( a == c || b == c )
                                	continue;
			       	for( var d = 0; d < 4; d++ ) {
                                	if( a == d || b == d || c == d )
                                        	continue;
                                        perms_4.push( [a,b,c,d] );
                                }
                        }
                }
        }
}


function initValidCombinations() {
	var no_overlap;
	var some_overlap;
	var third_choice;
	var third_choice_counts =[];
	comb_5.forEach( (comb,idx)=>{
		//console.log( `check comb ${comb}  @${idx} in ${comb_5.length}`)
		no_overlap = [];
		some_overlap = [];
		for( var n = 0; n < comb_5.length; n++ ) {
			var match = 0;
			if( n !== idx ) {
				var test = comb_5[n];
					//console.log( `${test} and ${comb}`)
					let a = 0;
					let b = 0;
					while( a < 5 && b < 5 )
					{
						//console.log( `${test[a]}  and ${comb[b]}    ${a}  ${b}`)
						if( test[a] < comb[b] )
 							a++;
						else if( test[a] > comb[b] )
								b++;
						else { //if( test[a] === comb[b] )
							match++;
							if( match == 2 )
								break;
								a++;
								b++;
						}
					}
					if( a < 5 && b < 5 )
						continue;
							//console.log( `test ${test} comb ${comb}`  );
					if( match == 0 )
						no_overlap.push( test );
					some_overlap.push( test );
			}
		}
		//console.log( `some overlap is ${no_overlap.length} ${some_overlap.length}`)
		comb_5_other.push( some_overlap )
		some_overlap.forEach( (comb2)=> {
		});
		third_choice_counts.forEach( (val, idx)=>{
				console.log( `${idx} : ${val}`)
		});
		//console.log( `no_overlap length ${no_overlap.length}  total ${comb_5_other.length}  total ${comb_5_other_last.length}`);
	})

}
function initCombinations() {
	for( var a = 0; a < 15; a++ ) {
		for( var b = a + 1; b < 15; b++ ) {
		       	for( var c = b + 1; c < 15; c++ ) {
			       	for( var d = c + 1; d < 15; d++ ) {
		       		       	for( var e = d + 1; e < 15; e++ ) {
                            comb_5.push( [a,b,c,d,e] );
						        				//console.log( comb_5[comb_5.length-1] );
                                        }
                                }
                        }
                }
        }

	for( var a = 0; a < 15; a++ ) {
		for( var b = a + 1; b < 15; b++ ) {
                	if( a == b )
	                        continue;
		       	for( var c = b + 1; c < 15; c++ ) {
                        	if( a == c || b == c )
                                	continue;
			       	for( var d = c + 1; d < 15; d++ ) {
                                	if( a == d || b == d || c == d )
                                        	continue;
	                                        comb_4.push( [a,b,c,d] );
						//console.log( comb_4[comb_4.length-1] );
                                }
                        }
                }
        }
}

initPerms();
initCombinations();
initValidCombinations();
//console.log( `Perms is ${perms_5.length}  ${perms_4.length}` );
//console.log( `Combs is ${comb_5.length}  ${comb_4.length}` );

exports.getCardPerm = function getCardPerm( card, result ) {
		getPerm( card[0], 5, 1, result.b = {} );
		getPerm( card[1], 5, 16, result.i = {} );
		getPerm( card[2], 4, 31, result.n = {} );
		getPerm( card[3], 5, 46, result.g = {} );
		getPerm( card[4], 5, 61, result.o = {} );
}

exports.getRowPerms = function getRowPerms( card, result ) {
		var test = [ card[0][0], card[1][0], card[2][0], card[3][0], card[4][0]]
	result.r1_comb = (card[0][0]-1)*(15*15*15*15) + (card[1][0]-16)*(15*15*15)
	    + (card[2][0]-31)*(15*15) + (card[3][0]-46)*(15) + (card[4][0]-61);
			//+ row_perms_5_index[card[0][0]-1][card[1][0]-16].findIndex( (comb)=>{var n; for( n=0; n < 5;n++ ) if( comb[n] !== test[n]) return false; return true;});
	if( result.r1_comb == -1)
		console.log( "Failed to find", test)
	test = [ card[0][1], card[1][1], card[2][1], card[3][1], card[4][1]]
	result.r2_comb = (card[0][1]-1)*(15*15*15*15) + (card[1][1]-16)*(15*15*15)
		+ (card[2][1]-31)*(15*15) + (card[3][1]-46)*(15) + (card[4][1]-61);
		//+ row_perms_5_index[card[0][1]-1][card[1][1]-16].findIndex( (comb)=>{var n; for( n=0; n < 5;n++ ) if( comb[n] !== test[n]) return false; return true;});
	if( result.r2_comb == -1)
		console.log( "Failed to find", test)
	test = [ card[0][2], card[1][2], card[3][2], card[4][2]]
	result.r3_comb = (card[0][2]-1)*(15*15*15) + (card[1][2]-16)*(15*15)
  	+  (card[3][2]-46)*(15) + (card[4][2]-61);
		//+ row_perms_4_index[card[0][2]-1][card[1][2]-16].findIndex( (comb)=>{var n; for( n=0; n < 4;n++ ) if( comb[n] !== test[n]) return false; return true;});
	if( result.r3_comb == -1)
		console.log( "Failed to find", test)
	test = [ card[0][3], card[1][3], card[2][2], card[3][3], card[4][3]]
	result.r4_comb = (card[0][3]-1)*(15*15*15*15) + (card[1][3]-16)*(15*15*15)
  	+ (card[2][2]-31)*(15*15) + (card[3][3]-46)*(15) + (card[4][3]-61);
		//+ row_perms_5_index[card[0][3]-1][card[1][3]-16].findIndex( (comb)=>{var n; for( n=0; n < 5;n++ ) if( comb[n] !== test[n]) return false; return true;});
	if( result.r4_comb == -1)
		console.log( "Failed to find", test)
	test = [ card[0][4], card[1][4], card[2][3], card[3][4], card[4][4]]
	result.r5_comb = (card[0][4]-1)*(15*15*15*15) + (card[1][4]-16)*(15*15*15)
  	+ (card[2][3]-31)*(15*15) + (card[3][4]-46)*(15) + (card[4][4]-61);
		//+ row_perms_5_index[card[0][4]-1][card[1][4]-16].findIndex( (comb)=>{var n; for( n=0; n < 5;n++ ) if( comb[n] !== test[n]) return false; return true;});
	if( result.r5_comb == -1)
		console.log( "Failed to find", test)
}

exports.getPerm = getPerm;
function getPerm( cardcol, nums, base, result ) {



	var colcopy = cardcol.slice(0);
	//console.log( colcopy );
        var i;
				for( i = 0; i < nums; i++ )
					colcopy[i] -= base;

	if( nums == 5 ) {
		var order = [0,1,2,3,4];
	        for( i = 0; i < 4; i++ ) {
                	//console.log( "Compare ", colcopy[i], " and ", colcopy[i+1] );
        		if( colcopy[i] > colcopy[i+1] ) {
	                        var tmp = colcopy[i];
        	                colcopy[i] = colcopy[i+1];
                	        colcopy[i+1] = tmp;
                        	tmp = order[i];
	                        order[i] = order[i+1];
        	                order[i+1] = tmp;
                                if( i > 0 ) // bubble backwards as well as forward...
                                 	i -= 2;
                        }

                }
                //console.log( order );
                //console.log( colcopy );
var 		perm = perms_5.findIndex( (perm)=> { var n; for( n = 0; n < 5; n++ ) if( perm[n] !== order[n] ) return false; return true; } );
var 		comb = comb_5.findIndex( (perm)=> { var n; for( n = 0; n < 5; n++ ) if( perm[n] !== colcopy[n] ) return false; return true; } );
//console.log( perm );
//console.log( comb );
		result.perm = perm;
                result.comb = comb;
if( comb == -1 )
console.log( "did not find", colcopy )

        }else {
		var order = [0,1,2,3];
	        for( i = 0; i < 3; i++ ) {
                	//console.log( "Compare ", colcopy[i], " and ", colcopy[i+1] );
        		if( colcopy[i] > colcopy[i+1] ) {
	                        var tmp = colcopy[i];
        	                colcopy[i] = colcopy[i+1];
                	        colcopy[i+1] = tmp;
                        	tmp = order[i];
	                        order[i] = order[i+1];
        	                order[i+1] = tmp;
                                if( i > 0 ) // bubble backwards as well as forward...
                                 	i -= 2;
                        }

                }
                //console.log( order );
                //console.log( colcopy );
var 		perm = perms_4.findIndex( (perm)=> { var n; for( n = 0; n < 4; n++ ) if( perm[n] !== order[n] ) return false; return true; } );
var 		comb = comb_4.findIndex( (perm)=> { var n; for( n = 0; n < 4; n++ ) if( perm[n] !== colcopy[n] ) return false; return true; } );
//console.log( perm );
//console.log( comb );
		result.perm = perm;
                result.comb = comb;
        }
}


exports.getRow = function getRow( perm, comb, nums ) {
	if( nums === 5 ) {
		var order = perms_5[perm].slice(0);
                var baserow = comb_5[comb];
                var out = new Array(5);
                for( var i = 0; i < 5; i++ ) { out[order[i]] = baserow[i]; }
                return out;
        } else {
		var order = perms_4[perm].slice(0);
                var baserow = comb_4[comb];
                var out = new Array(4);
                for( var i = 0; i < 4; i++ ) { out[order[i]] = baserow[i]; }
                return out;
        }
}

// build generic combinations... given a set size and count of them to use
var combinations = [];
var building;
function initCombinationsRecur( size, nums, start, base ) {
  var arr = base || [];
  if( !start  ){
      building = [];
    }
    if( !nums && nums !== 0 ){
      nums = size;
    }
  if( nums ) {
    for( var a = start||0; a < size; a++ ){
      arr.push( a );
      initCombinationsRecur( size, nums-1, a+1, arr );
      arr.pop();
    }
    if( !start && !base ) {
      combinations[size] = building;
      //console.log( combinations[size]);
    }
  }
  else {
    building.push( arr.slice(0) );
  }
}
//  incomplete anyway...
//initCombinationsRecur(6, 3);
//initCombinationsRecur(9);


var perms = [];
var buildperm;
function initPermutations( size, nums, base ) {
  var arr = base || [];
  if( !base ) buildperm = [];
  if( !nums && nums !== 0 ) nums = size;
  if( nums ){
    for( var a = 0; a < size; a++ ) {
      if( a === arr.find( (val)=>{ return (val === a); } ) )
				continue;
      arr.push( a );
      initPermutations( size, nums-1, arr );
      arr.pop();
    }
    if( nums === size ) {
      perms[size] = buildperm;
    }
  }
  else {
      buildperm.push( arr.slice(0) )
  }
}

exports.initPermutations = initPermutations;
//initPermutations( 6 );
//initPermutations( 9 );

exports.getPerms = function() { return perms; };


exports.countEvens = function(card) {
	var evens = 0;
	card.forEach( (col )=>{
		col.forEach( (spot)=>{
			if( !( spot & 1 ) )
					evens++;
		})
	});
	return evens;
}

// ----------------- Test code ----------------

/*
var tmp1;
var tmp2;
getPerm( [5,3,12,7,2], 5, tmp1 = {} );
getPerm( [5,3,12,2], 4, tmp2 = {} );

console.log( tmp1 );
console.log( tmp2 );
var out1 = getRow( 103, 1773, 5 );
var out2 = getRow( 20, 666,4 );
console.log( out1 );
console.log( out2 );
*/
