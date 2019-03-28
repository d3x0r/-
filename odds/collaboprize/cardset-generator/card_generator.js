

var basePath = "C:/halls/cardsets/raw-perfect-packs/eqube2/"
var fs = require('fs');
var BallGenerator = require( "./generator.js");
var cardUtils = require( './card_utils.js' );
var classify = require( '../cardset-classify/classify.js' );

var fileNum = 1;
var wstream;
var limit = process.argv[3]?Number( process.argv[3] ):250000;
var maxlimit = 100000000;//process.argv[4]?Number( process.argv[4] ):100000000;
var baseName = process.argv[2]?process.argv[2]:"cardset-junk";
console.log( "maxlimit ", process.argv[4], maxlimit)
var i = 0;

var spotCounts = [new Array(25),new Array(25),new Array(25)];
for( var c = 0; c < 3; c++ ){
  for( var n = 0; n < 25; n++ ){
    spotCounts[c][n] = new Array(15)
    for( var m = 0; m < 15; m++ ) {
      spotCounts[c][n][m] = 0;
    }
  }
}

var permCounts = [ new Array( 759375 ), new Array( 759375 ), new Array( 759375 ), new Array( 759375 )];
var permsUsed = [0,0,0,0];
for( var n = 0; n < 759375; n++ )
  permCounts[0][n] = permCounts[1][n] = permCounts[2][n] = permCounts[3][n] = 0;

var permCountsShort = new Array( 15*15*15*15 );
var permsUsedShort = 0;
for( var n = 0; n < 15*15*15*15; n++ )
  permCountsShort[n] = 0;

function MakeCard() {
  return [new Array(5),new Array(5),new Array(5),new Array(5),new Array(5)];
}

function MakeCardSet()
{
  var result = [[],[],[]]
  var nums = BallGenerator.DrawRandomNumbers2();
  var columns = [0,0,0,0,0];
  var cards = [MakeCard(),MakeCard(),MakeCard()]
  for( var i = 0; i < 75; i++ ) {
    var col = Math.floor( ( nums[i] - 1 ) / 15 );
    var row;
    var colspot;
    if( col == 2 ) {
        row = Math.floor( columns[col] / 4 );
        colspot = columns[col] % 4;
      }
    else  {
        row =Math.floor( columns[col] / 5 );
        colspot = columns[col] % 5;
      }
      if( row > 2 )
          continue;
      if( nums[i] )
        cards[row][col][colspot] = nums[i];
      columns[col]++;
  }
  return cards;
}

exports.make3Cards = MakeCardSet;
exports.DrawRandomNumbers2 = BallGenerator.DrawRandomNumbers2;

function doGenerateOne() {
  //console.log( "doGeneration")
  if( !wstream ) {
    wstream = fs.createWriteStream(  basePath + baseName + `.${fileNum}.dat` );
    BallGenerator.setOutput(  basePath + baseName + `.${fileNum}.seed` );
    fileNum++;
  }
  if( i < limit )
  {
    if( ( i % 5000 ) == 0 )
      console.log( "....", i );
      var test, test_buf ;
    wstream.write( test_buf = cardUtils.MakeBufferForCardset( test = MakeCardSet() ) );

    i++;
  }
  else {
    i++; // end finishGeneration loop
    wstream.end();
    wstream = 0;
  }
}

function finishGeneration() {
  while( i <= limit )
    doGenerateOne();
}

var counts = new Array( 759375 );
function shortPermStats() {
  var max = permCountsShort.length;
      var pmin = 100000, pmax = 0;
      var total = 0;
      var missing = 0;
      var used = 0;
      var tmp;
      //console.log( permCounts.length )
      for( n = 0; n < max; n++ ){
        tmp = permCountsShort[n];
        if( !tmp )
          missing++;
        else{
          used++;
          total += tmp;
          if( tmp < pmin )
            pmin = tmp;
          if( tmp > pmax )
            pmax = tmp;
        }
          //console.log( `${n}  : ${PermCounts[n]}` );
      }
      console.log( `Short Row Perm Stats : ${pmin} ${pmax} ${missing} ${used} ${permsUsed} ${total/4}  ${shortPermLimit}`);
      for( n = pmax; n >= (0); n--) {
        counts[n] = 0;
      }
      // counts total is one per permutation
      for( var c = 0; c < permCountsShort.length; c++ ){
          counts[permCountsShort[c]]++;
      }


      if( pmax && (counts[pmax] < 20  ))
      for( var c = 0; c < permCountsShort.length; c++ ){
        if( permCountsShort[c] == pmax ){
           var perm = classify.raw_row_perms_4[c];
           process.stdout.write( `[ ${perm[0]+0} ${perm[1]+15} ${perm[2]+30} ${perm[3]+45} ]`)
         }
      }
      if( false ) // log per-count stats... to see where the bell curve is falling...
      for( n = 0; n < pmax; n++) {
        console.log( `${n} : ${counts[n]}   ${counts[n]*100 / 50625}`)
      }
}


function permStats() {
  var max = permCounts[0].length;
  for( var i = 0; i < 4; i++ ){
      var pmin = 100000, pmax = 0;
      var total = 0;
      var missing = 0;
      var used = 0;
      var tmp;
      //console.log( permCounts.length )
      for( n = 0; n < max; n++ ){
        tmp = permCounts[i][n];
        if( !tmp )
          missing++;
        else{
          used++;
          total += tmp;
          if( tmp < pmin )
            pmin = tmp;
          if( tmp > pmax )
            pmax = tmp;
        }
          //console.log( `${n}  : ${PermCounts[n]}` );
      }
      console.log( `Row Perm Stats : ${pmin} ${pmax} ${missing} ${used} ${permsUsed} ${total/4}  ${longPermLimit} ${longPermLimit2} ${longPermLimit3} ${longPermLimit4} `);
      for( n = pmax; n >= (0); n--) {
        counts[n] = 0;
      }
      // counts total is one per permutation
      for( var c = 0; c < permCounts[i].length; c++ ){
          counts[permCounts[i][c]]++;
      }
      if( pmax && (counts[pmax] < 20  ))
      for( var c = 0; c < permCounts[i].length; c++ ){
        if( permCounts[i][c] == pmax ){
           var perm = classify.raw_row_perms_5[c];
           process.stdout.write( `[ ${perm[0]} ${perm[1]+15} ${perm[2]+30} ${perm[3]+45} ${perm[4]+60} ]`)
         }
      }
      if( i == 3 )
      for( n = 0; n < pmax; n++) {
        console.log( `${n} : ${counts[n]}   ${counts[n]*100 / 759375}`)
      }
  }
}

function countStats(){
  for( var c = 0; c < 3; c++ ) {
    var midpoint = [0,0,0,0,0];
    var minpoint = [1000000000,1000000000,1000000000,1000000000,1000000000];
    var maxpoint = [0,0,0,0,0];
    for( var n = 0; n < 25; n++ ){
      if( n == 14 )
        continue;
      var col = Math.floor(n/5);
      for( var m = 0; m < 15; m++ ) {
        var val = spotCounts[c][n][m];
        process.stdout.write( `${val} `)
        if( val > maxpoint[col] )
          maxpoint[col] = val;
        if( val < minpoint[col] )
          minpoint[col] = val;
      }
      process.stdout.write( "\n");
      if( (n % 5) == 4 || n == 13 ) {
        process.stdout.write( "\n");
      }
    }
    console.log( minpoint, maxpoint )
    for( var n = 0; n < 5; n++ ){
      midpoint[n] = (minpoint[n]+maxpoint[n])/2;

    }
    var range = [ maxpoint[0]-midpoint[0]
                 ,maxpoint[1]-midpoint[1]
                 ,maxpoint[2]-midpoint[2]
                 ,maxpoint[3]-midpoint[3]
                 ,maxpoint[4]-midpoint[4]];
    minpointss = [0,0,0,0,0];
    maxpoint = [0,0,0,0,0];
    var avg = [0,0,0,0,0];
    console.log( midpoint, range, `[${range[0]/midpoint[0]},${range[1]/midpoint[1]},${range[2]/midpoint[2]},${range[3]/midpoint[3]},${range[4]/midpoint[4]}]` )
    for( var n = 0; n < 25; n++ ){
      if( n == 14 )
        continue;
      var col = Math.floor(n/5);

      for( var m = 0; m < 15; m++ ) {
        var value = ( ( spotCounts[c][n][m] - midpoint[col] ) * 100.0 / range[col] );
        avg[col] += value;
        var val = value.toFixed(2);
        if( value > maxpoint[col] )
          maxpoint[col] = value;
        if( val < minpoint[col] )
          minpoint[col] = value;
        process.stdout.write( `${"       ".substring(val.length)}${val} `)
      }
      process.stdout.write( "\n");
      if( (n % 5) == 4 || n == 13 ) {
        process.stdout.write( `min/max deviation ${minpoint[col]} ${maxpoint[col]}  ${avg[col]/(5*15)}`)
        process.stdout.write( "\n");
      }
    }
    process.stdout.write( "\n");
  }
}

var nolimit;


function count(cards, stats) {
    stats.forEach( (stat)=>{
      //console.log( " count ", stats )
      permCounts[0][stat.r1_comb]++;
      permCounts[1][stat.r2_comb]++;
      permCountsShort[stat.r3_comb]++;
      permCounts[2][stat.r4_comb]++;
      permCounts[3][stat.r5_comb]++;
      permsUsed[0]++;
      permsUsed[1]++;
      permsUsed[2]++;
      permsUsed[3]++;
      permsUsedShort++;
    })
    if( !nolimit ){
      nolimit = (process.argv[5] === 'nolimit')?100:1;
      console.log( ` nlimit ${nolimit}` )
    }

    longPermLimit = nolimit * 5.0*( ( permsUsed[0] + 759375 ) / 759375 )*0.7;
    longPermLimit2 = nolimit * 3.6*( ( permsUsed[0] + 759375 ) / 759375 )*0.7;
    shortPermLimit = nolimit * 1.75*( ( permsUsedShort + 50625 ) / 50625 )*0.7;
    longPermLimit3 = nolimit * 3.0*( ( permsUsed[0] + 759375 ) / 759375 )*0.7;
    longPermLimit4 = nolimit * 6.4*( ( permsUsed[0] + 759375 ) / 759375 )*0.7;

    cards.forEach( (card, cardIndex)=>{
      card.forEach( (col, colindex)=>{
        col.forEach( (spot,spotIndex)=>{
          spotCounts[cardIndex][colindex * 5 + spotIndex][spot-(colindex*15+1)]++;
        })
      })
    })
}


var logged;
var longPermLimit = 2;
var longPermLimit2 = 1;
var longPermLimit3 = 1;
var longPermLimit4 = 3;

var shortPermLimit = 5;
var fails = [0,0,0,0,0];

function allow(set,setstats) {

  //console.log( limit )
  var success = true;
  set.forEach( (card, c)=>{
    var stats = setstats[c];
    if( !success) return;
    classify.getRowPerms( card, stats );
    //console.log( `comparison is ${stats.r1_comb} ${stats.r2_comb} ${stats.r4_comb} ${stats.r5_comb}`)
    //console.log( `comparison is ${permCounts[stats.r1_comb]} ${permCounts[stats.r2_comb]} ${permCounts[stats.r4_comb]} ${permCounts[stats.r5_comb]}`)
    if( permCounts[0][stats.r1_comb] > longPermLimit ) {
        fails[0]++;
      success = false;
    }
    else if( permCounts[1][stats.r2_comb] > longPermLimit2 ){
        fails[1]++;
      success = false;
    }
    else if( permCountsShort[stats.r3_comb] > shortPermLimit ) {
        fails[2]++;
      success = false;
    }
    else if( permCounts[2][stats.r4_comb] > longPermLimit3 ) {
        fails[3]++;
      success = false;
    }
    else if( permCounts[3][stats.r5_comb] > longPermLimit4 ) {
        fails[4]++;
      success = false;
    }
  })
  return success;
}

var cardGen = 0;
var stopGen = false;
var subCount = 0;
var failed = 0;

function doGeneration() {
  //console.log( "generate ", maxlimit, limit, process.argv )
  //for( ; cardGen < maxlimit; cardGen+=limit ){

    if( stopGen )
      return;
    if( !wstream ) {
      console.log( `create streams... ${fileNum}`);
      wstream = fs.createWriteStream(  basePath + baseName + `.${fileNum}.dat` );
      wstream.on( "close", ()=> { global.gc(); setTimeout( doGeneration ); } );
      BallGenerator.setOutput(  basePath + baseName + `.${fileNum}.seed` );
      fileNum++;
    }
    for(subCount = 0; subCount < limit; subCount++ ) {
      //if( stopGen )
      //  break;
        var test, test_buf ;
        var stats = [{r1_comb:0,r2_comb:0,r3_comb:0,r4_comb:0,r5_comb:0}
            ,{r1_comb:0,r2_comb:0,r3_comb:0,r4_comb:0,r5_comb:0}
            ,{r1_comb:0,r2_comb:0,r3_comb:0,r4_comb:0,r5_comb:0}];
         test = MakeCardSet();
         if( allow( test, stats ) ) {
           if( ( subCount % 20000 ) == 0 ) {
             console.log( `-------- ${cardGen+subCount} ${failed}  ${fails}` );
             //if( nolimt == 100 )
             {
               countStats();
               permStats();
               shortPermStats();
             }
           }
           count(test, stats)
           wstream.write( test_buf = cardUtils.MakeBufferForCardset( test ) );
           //console.log( test_buf )
         }
         else {
           failed++;
           if( ( failed % 20000 ) == 0 ){
             console.log( `fail ${cardGen+subCount} ${failed} ${fails}` );
           }
           subCount--;
         }

    }
    //subCount++;
    //if( subCount >= limit )
    {
      wstream.end();
      wstream = null;
      cardGen += limit;
    }
    //setTimeout( doGeneration, 10 );
  //}
}

if( 0 ) { 
//console.log( process.argv )
if( process.argv.length == 2 )
  throw "Need to specify output filename on commandline.";
if( process.argv.length == 3 )
  throw "Need to specify count to output on commandline.";

if( typeof document !== "undefined" ){
  var buttonElement = document.getElementById('make cards');
  buttonElement.addEventListener( "click", ()=>{
  	//console.log( basepath, basename)
    stopGen = false;
  	setTimeout( doGeneration, 10 );
  })

  var buttonElement = document.getElementById('stop cards');
  buttonElement.addEventListener( "click", ()=>{
  	//console.log( basepath, basename)
    stopGen = true;
  })
}
else if( process.argv.length == 5 && process.argv[4] == 'regen' )
  BallGenerator.reloadSeeds( baseName + ".seed", doGenerateOne, finishGeneration );
else {
  setTimeout( doGeneration, 10 );
}

}



//console.log( "Card set ", MakeCardSet() )
//console.log( "Card set ", MakeCardSet() )
//console.log( "Card set ", MakeCardSet() )
