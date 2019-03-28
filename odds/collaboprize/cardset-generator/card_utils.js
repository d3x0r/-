"use strict";

exports.MakeBufferForCardset = function( cardset ) {
  var buf = new Buffer(cardset.length*12);
  var c,row,col, n = 0;
  cardset.forEach( (card,c)=>{
   card.forEach( (colarr, col)=> {
      var base = col * 15;
      colarr.forEach( (spot)=> {
        if( !spot ) return;
        if( n & 1 )
          buf[n>>1] |= ( spot - base );
        else
          buf[n>>1] = ( spot - base ) << 4;
        n++;
      });
    })
  })
  return buf;
}

exports.MakeCardsetFromBuffer = function ( buffer ) {
  var cardset = [[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]
      ,[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]
      ,[[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]]
  var c,row,col, n = 0;
  for( c = 0; c < 3; c++ )
  for( col = 0; col < 5; col++ ) {
    var base = col * 15;
    for( row = 0; row < (col==2?4:5); row++) {
      if( n & 1 )
        cardset[c][col][row] = base + ( buffer[n>>1] & 0xF );
      else
        cardset[c][col][row] = base + ( buffer[n>>1] >> 4 );
        n++;
    }

  }
  return cardset;
}

exports.MakeBufferForCard = function(card) {
  //console.log( "make ", card);
  if( ( card.length == 7 ) || ( card.length == 8 ) ) {
    var buf = new Buffer(card.length);
    //console.log( "buffer...")
    card.forEach( (val,index)=>{
      buf[index] = val;
    })
    return buf;
  }
  else if( card.length == 5 && card[0].length==5 ) {
    var buf = new Buffer(12);

  }
}
exports.MakePickCardFromBuffer = function( buffer ){
  var card = [];
  var row,col;
  if( !buffer )
    return undefined;
  //console.log( "doing for buffer", buffer)
  buffer.forEach( (val)=>{
    if( val )
      card.push( val );
  })
  return card;
}

exports.MakeCardFromBuffer = function ( buffer ) {
  if( buffer.length == 12 ) {
    var card = [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]];
    var row,col, n = 0;
    if( !buffer )
      return undefined;
    //console.log( "doing for buffer", buffer)
    for( col = 0; col < 5; col++ ) {
      var base = col * 15;

      for( row = 0; row < (col==2?4:5); row++) {
        //console.log( "Buffer ", buffer[n>>1].toString(16), " base ", base, ' n ', n );
        if( n & 1 )
          card[col][row] = base + ( buffer[n>>1] & 0xF );
        else
          card[col][row] = base + ( buffer[n>>1] >> 4 );
          n++;
      }

    }
    return card;
  }
  if( (buffer.length==8) || ( buffer.length == 7 ) ) {
    // upick 7 or 8 dat buffer
    var card = [];
    buffer.forEach( (val)=>{ card.push(val); })
    return card;
  }
  return undefined;
}
