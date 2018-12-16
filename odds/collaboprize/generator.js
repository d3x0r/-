
// var Gen = require( 'generator.js' )
//        Gen.DrawRandomNumbers2()
//              returns an array of 75 numbers that have been shuffled.
var fs = require( 'fs');
var outSeeds;

var seeds = [];

exports.reloadSeeds = function reloadSeeds( filename, callback, doneCallback ){
  var readerFactory = require('readline');
  var lineReader = readerFactory.createInterface({
       input:fs.createReadStream( filename )
  });
  lineReader.on('close', ()=>{
    doneCallback();
  })
  lineReader.on('line', (line)=>{
      //console.log( `adding to seeds ${line}` )
      seeds.push( Number(line) );
      if( seeds.length >  10 ) {
        //console.log( "Schedule generation")
        callback();
        //setTimeout( callback, 0 );
        //callback = undefined;
      }
  } );
  //lineReader.on('close', closeFile );

}

var RNG=require( "./salty_random_generator.js" ).SaltyRNG( (salt)=>{
  var val;
  if( seeds.length ) {
    //console.log( "using seed... ", seeds.length )
    salt.push( seeds.shift() );
  } else {
    salt.push(  ( val = new Date().getTime(), val =( val % 100000 ) * ( val % 100000 ) )  );
    if( outSeeds )
      outSeeds.write( String(val) + "\n");
  }
});
//RNG.getBuffer( 4096 );  // eat some bits... kept getting the same sequences.

//var value = RNG.getBits( 10 );
//console.log( "test is ", value);
exports.closeOutput = function closeOutput() {
  if( outSeeds ) {
    outSeeds.end();
    outSeeds = null;
  }
}
exports.setOutput = function setOutput(out) {
  if( outSeeds )
    outSeeds.end();
    console.log( "open output seed file...")
  outSeeds = fs.createWriteStream( out );
}
var balls = [];
function initBalls() {
  for( var i = 1; i <= 75; i++ )
    balls.push(i);
}

initBalls();

function Holder() {
  return {
    number : 0
    , r : 0
    , less : undefined
    , more : undefined
  };
}

var nHolders = 0;
var holders = [];

for( var i = 0; i < 75; i++ )   holders.push( Holder() );

function sort(  tree,  number,  r )
{
    //console.log( "Assign ", r, " to ", number)
   if( !tree )
   {
      tree = holders[nHolders++];
      tree.number = number;
      tree.r = r;
      tree.pLess = tree.pMore = undefined;
   }
   else
   {
      if( r > tree.r )
         tree.pMore = sort( tree.pMore, number, r );
      else
         tree.pLess = sort( tree.pLess, number, r );
   }
   return tree;
}

var nNumber = 0;
function  FoldTree( numbers, tree )
{
   if( tree.pLess )
      FoldTree( numbers, tree.pLess );
   numbers[nNumber++] = tree.number;
   if( tree.pMore )
      FoldTree( numbers, tree.pMore );
}

function  Shuffle( numbers )
{
	 var tree;
   var n;
	  tree = null;
	 nHolders = 0;
   nNumber = 0;
   for( n = 0; n < 75; n++ )
   {
     var v = RNG.getBits( 9 );
		 tree = sort( tree, numbers[n], v );//RNG.getBits( 13 ) );
   }
   FoldTree( numbers, tree );
}

var work_nums = new Array(75);
for( n = 1; n <= 75; n++ )
     work_nums[n-1] = n;

var nNums = 0;
var nums = new Array(16); // temporary result
for(var i = 0; i < 16; i++ ) {
  nums[i] = new Array(75);
//  console.log( "nums[", i, "]=", nums[i]);
}

exports.DrawRandomNumbers2 = (  ) =>
{
	var n;

	Shuffle( work_nums );

	nNums++;
	if( nNums == 16 )
      nNums = 0;
	for( n = 0; n < 75; n++ )
	{
		nums[nNums][n] = work_nums[n];
	}
  if( false )
  {
  // debug logging, make long hex string for random buffer data
    var str = "";

    for( var x = 0; x < 75; x++ ) {
       var val = nums[nNums][x].toString(10);
       str += "," + val
    }
    //console.log( "ball list is ", str );
  }


   return nums[nNums];
}
