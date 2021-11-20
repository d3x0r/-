
function AdjacencyMatrix() {
	if( !(this instanceof AdjacencyMatrix ) ) return new AdjacencyMatrix();
	var bitArray = new Uint8Array( 12 );
        // 1 2 3 4 5
        // 0 1  2  3  4  5  6  7  8  9 10 11
        // 0 1  3  6 10 15 21 28 36 45
        // 0 1 13 23 25 35 37 47 49 59 5/11  6/11
        // 
        // N = total vert count-1
        // (N / 2)+(n&1) * N+(1-N&1)
        var avail = 14;
        var verts = 0;
        
        Object.defineProperty( this, "add", {value:set} );
        Object.defineProperty( this, "set", {value:set} );
        Object.defineProperty( this, "clear", {value:clear} );
        Object.defineProperty( this, "test", {value:test} );
        Object.defineProperty( this, "near", {value:near} );
        
        function bitCount(n) {
        	//return (((n/2)|0)+(n&1))*( n+(1-(n&1)))
                return (n*(n-1))/2;
        }
        
        function vertCount(n) {
        	// bits = (v*(v-1))/2
	}
        
        function set(n,m) {
        	const x = (n>m)?n:m;
                const y = (n<m)?n:m;
		if( x >= verts ) verts = x;
        	while( verts >= avail ) {
                	avail = avail*2 + 1;
                	let newArray = new Uint8Array( bitCount( avail ) );
                        let oldCount = bitCount(verts)/8;
                        for( let n = 0; n < oldCount; n++ )
                        	newArray[n] = bitArray[n];
                        bitArray = newArray;
                }
                let z = bitCount(x) + y;
		//console.log( "Setting bit: ", x, y, z );
                bitArray[(z/8)|0] |= 1 << (z&7);
        }

        function clear(n,m) {
        	const x = (n>m)?n:m;
                const y = (n<m)?n:m;
		if( x >= verts ) verts = x;
        	while( (x+1) >= avail ) {
                	avail = avail*2 + 1;
                	let newArray = new Uint8Array( bitCount( avail ) );
                        let oldCount = bitCount(verts)/8;
                        for( let n = 0; n < oldCount; n++ )
                        	newArray[n] = bitArray[n];
                        bitArray = newArray;
                        verts = x+1;
                }
                let z = bitCount(x) + y;
                bitArray[(z/8)|0] &= ~(1 << (z&7));
        }
	
        function test(n,m) {
        	const x = (n>m)?n:m;
                const y = (n<m)?n:m;
		if( x >= verts ) verts = x;
                let z = bitCount(x) + y;
                return ( bitArray[z/8] & (1 << (z&7)) );
        }

        function near(n) {
        	var result = [];
                let x = bitCount(n);
		//console.log( "nearness:", verts, bitArray )
                for( let m = 0; m < n; m++ ) {
                	if( bitArray[((x+m)/8)|0] & ( 1 << ((x+m)&7) ) )
	                	result.push( m );
                }
                for( let m = n+1; m < verts; m++ ) {
                	let x = bitCount(m) + n;
                	if( bitArray[((x)/8)|0] & ( 1 << ((x)&7) ) )
	                	result.push( m );
                }
                return result;
        }

}


export { AdjacencyMatrix };
