
var rquire( 

var xhrObj;
Voxelarium.Voxels.load = function( cb ) {
	var n = 1
	xhrObj = new XMLHttpRequest();
	//var xhrObj2 = new XMLHttpRequest();
	loadAVoxel( n, cb );
}


function loadAVoxel( n, cb ) {
	{
		try {
			xhrObj.open('GET', `./src/voxels/voxel_${n}.js`);
			//xhrObj.responseType = "text";
			//xhrObj.response = "";
			xhrObj.send(null);
			xhrObj.onerror = (err)=>{
				  //console.log( "require ", n );
		      //console.log( err );
					cb();
					return;
			};
			xhrObj.onload = ()=>{
				if( !xhrObj.status || xhrObj.status === 200 ) {
					//console.log( "load ", n)
					Voxelarium.Voxels.types.push( eval(xhrObj.responseText) );
					var t = Voxelarium.Voxels.types[n];

					t.codeData = xhrObj.responseText;
					xhrObj.open('GET', `./src/voxels/images/voxel_${n}.png`);
					xhrObj.onerror = (err)=>{
						 console.log( "error:", err);
				     loadAVoxel( n+1, cb );
				  }
					xhrObj.send(null);
					xhrObj.onload = ()=>{
						if( xhrObj.responseText.length > 0 ) {
							( t.image = new Image() ).src = xhrObj.responseText;
							t.textureData = xhrObj.response;
							t.image.onerror = (err)=>{ console.log( "image load error?", err)}
							//console.log( t );
							if( true || !t.image.width )
							{
								t.image.onload = ()=> {
									 //console.log( "Waited until load to setup coords", t)
								   t.textureCoords = Voxelarium.TextureAtlas.add( t.image )
							  }
							} else {
								//console.log( "don't have to delay load?")
							  //t.textureCoords = Voxelarium.TextureAtlas.add( t.image )
						  }
						}
						loadAVoxel( n+1, cb );
					}
				}
				else {
					console.log( "All completed... out of loadables...")
					cb();
				}
			}
			//require( `./voxels/voxel_${n}.js` )
		}
		catch( err ) {
			console.log( "require ", n );
	        	console.log( err );
				cb();
		}
	}

}
