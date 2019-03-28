
var output = document.getElementById( "testSurface" );
var ctx = output.getContext("2d" );


var SRG = require( "../org.d3x0r.common/salty_random_generator.js" ).SaltyRNG;

const segLength = (513);
const roughness = 0.02;

var tick = 0;

function FeedRandom( line ) {
	return function(salt) {
		salt.push( tick );
		tick++;
		salt.push( new Date() );
		salt.push( line.id );
		//console.log( "Salt:", line.id );
	}
}

function randomSeg( seg, vert, prior, left ) {
	var seg = { id:seg+(vert?0.5:0), 
			data:new Array(length),
			prior : prior,
			left : left,
			normalizedData:new Array(length),
	      	entropy : null,
			generate:generate,
                        normalize:normalize,
		};
	seg.entropy = SRG( FeedRandom( seg ) );
	return seg;

}

var seg0 = randomSeg( 0, false, null, false );
var seg1 = randomSeg( 1, 0, seg0, false );
seg1.generate();
var seg_1 = randomSeg( -1, 0, seg0, true );

seg_1.generate();


function draw() {
seg0.generate();
ctx.fillStyle = 0;
ctx.fillRect( 0, 0, 500, 500 );
ctx.strokeStyle="#FFFFFF";
ctx.beginPath();
ctx.moveTo( 0, 250+(seg0.normalizedData[0]*segLength/2) );
for( var n = 1; n < segLength; n++ ) {
	ctx.lineTo( n, 250+(seg0.normalizedData[n] *segLength/2));

}
ctx.stroke();


ctx.beginPath();
ctx.strokeStyle="#FF0000";
ctx.moveTo( 0, 250+(seg0.data[0]*8) );
for( var n = 0; n < segLength; n++ ) {
	ctx.lineTo( n, 250+(seg0.data[n]*500) );

}
ctx.stroke();
setTimeout( draw, 250 );
}

setTimeout( draw, 1000 );

function normalize() {
	for( n = 0; n <= segLength; n++ ) {
        	var val = this.data[n];
                if( val > 0 )  {
			var section = (val|0) & 3;
                	if( section == 0 )
                        	this.normalizedData[n] = val%1;
                        else if( section == 1 )
                        	this.normalizedData[n] = 1-(val%1);
                        else if( section == 2 )
                        	this.normalizedData[n] = -(val%1);
                        else 
                        	this.normalizedData[n] = -1+(val%1);
		}
                else {
			var section = (-val|0) & 3;
                	if( section == 1 )
                        	this.normalizedData[n] = -1-(val%1);
                	else if( section == 2 )
                        	this.normalizedData[n] = -(val%1);
                	else if( section == 3 )
                        	this.normalizedData[n] = 1+(val%1);
                        else
                        	this.normalizedData[n] = (val%1);
		}
		//console.log( "Data is:", val, val%1, section, this.normalizedData[n] );
	}
}

function generate() {
	this.entropy.reset();
	
	if( !this.prior ) {
		this.data[0] = ( this.entropy.getBits( 13 ) / ( (1 << 13)-1 ) ) - 0.5;
	} else if( this.left ) {
		this.data[segLength-1] = this.prior.data[0] + roughness * (( this.entropy.getBits( 13 ) / ( 1 << 13 ) ) - 0.5 );
	} else {
		this.data[0] = this.prior.data[segLength-1] + roughness * (( this.entropy.getBits( 13 ) / ( 1 << 13 ) ) - 0.5 );
	}
	if( this.left )
		for( n = 0; n < segLength; n++ ) {
		 	//console.log( ( this.entropy.getBits( 13 ) / ( 1 << 13 ) ) );
			this.data[(segLength-2)-n] = this.data[(segLength-1)-n] + roughness * (( this.entropy.getBits( 13 ) / ((1 << 13) -1 ) ) - 0.5 );
			if( this.data[(segLength-2)-n] < -0.5 ) this.data[(segLength-2)-n] = -0.5;
			if( this.data[(segLength-2)-n] > 0.5 ) this.data[(segLength-2)-n] = 0.5;
		}
	else
		for( n = 0; n < segLength; n++ ) {
			var ent;
			this.data[n+1] = this.data[n] + (roughness * (( (ent=this.entropy.getBits( 13 )) / (( 1 << 13)-1 ) ) - 0.5 ));
                	//console.log( ent, (1<<13)-1, ent/((1<<13)-1), this.data[n], this.data[n+1] );
			if( this.data[n+1] < -0.5 ) this.data[n+1] = -0.5;
			if( this.data[n+1] > 0.5 ) this.data[n+1] = 0.5;
		}
	this.normalize();
}

function makeLine( seed ) {

	plasma.entropy = SRG( FeedRandom( plasma ) );

}
