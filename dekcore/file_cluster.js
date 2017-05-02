
const fs = require( 'fs');
const vfs = require( 'sack.vfs' );
const vol = vfs.Volume();

var fc_local = {
	authorities : []
}

module.exports = exports = {
	addAuthority( addr ) {
		athorities += addr;
	}
	, store : ( filename, object, callback ) => {
		var fileName;
		if( !object ){
			console.log( "Nothing to store?");
			return;
		}
		//console.log( typeof filename )
		//console.log( 'storing object : ', object, Object.keys( object ) );
		//console.log( 'storing object : ', object.toString() );
		//console.log( "storing into : ", filename );
		if( typeof( filename ) == 'string' )
			 fileName = filename
		else {
				 if( filename.Λ && !object )
					if( !(fileName = filename.ΛfsName )){
						console.log( "Init name")
						fileName =  filename.ΛfsName = GetFilename( fileName );
						console.log( "filename is now ", fileName)
					}
					else {
						console.log( "already had a name");
					}
					else {
						if( filename.Λ && object.Λ ) {
							fileName = GetFilename( filename ) + GetFilename( object );
							console.log( "Full path name ", fileName );
						} else {
							if( filename.Λ )
								fileName = GetFilename( filename );
							console.log( "filename isn't self identified - contains multiple things?", fileName );
						}
					}
				if( !filename && object && object.Λ ) {
					 console.log( "object is also a thing" );
					if( !(fileName = object.ΛfsName )){
						console.log( "Init name")
						fileName =  object.ΛfsName = GetFilename( object );
					}
				}
				 //fileName = getpath( filename, object );
		}
		console.log( "WRITE FILE ", fileName )
		mkdir( fileName, ()=>{
			vol.write( fileName, object.toString() );
			if( callback ) callback();
		} );
/*
				 //console.log( " store filestat of ", fileName);
			fs.stat(fileName, (error, stats)=>{
					 console.log( "Write to" ,fileName,error  );
					 var f =  ()=>{
					
							 fs.open(fileName, "w", (error, fd)=>{
								 var buffer;// = JSON.stringify( object );
								 //if( !buffer ) {

									 //sorry this  HAS To be tostring; json.stringify fails to save key maps....
									buffer = object.toString();
									 //console.log( "why is json of ", object );
								 //}
								 //console.log( "error token keys", error );
								 if( !error ) {
									 //console.log( "error", error );
									 //console.log( "write : JSON : ", buffer, buffer.length );
									 fs.write(fd, buffer
										 , (error, bytesWritten, buffer)=>{
												if( error ) { console.log( "write had errror: ", error ); }
												fs.truncate(fd,bytesWritten,(err)=>{
													if( err) { console.log( "truncate had error:", error ); }
												   	fs.close(fd, (err)=>{ 
														if( err ) console.log( "close had an error?", err );
														if( callback ) callback();		
												 	} );
												} )
									  });
								 }
							 });
					 };
					 if( error )
						 mkdir( fileName,f );
				   else f();
						  
				});
*/

	}
	, reloadFrom: ( pathobject, callback )=> {
		if( pathobject.Λ )
			if( !pathobject.ΛfsPath )
			  pathobject.ΛfsPath = GetFilename( pathobject );
			  console.log( "readdir of, ", pathobject.ΛfsPath+"Λ")
			fs.readdir(  pathobject.ΛfsPath+"Λ", callback );
	}
	, reload: (filename, callback) =>{
		if( filename.Λ )
			if( filename.ΛfsPath )
				fileName =  filename.ΛfsPath;
				else {
					fileName = filename.ΛfsPath = GetFilename( filename );
				}

		var result;
		var fileName;
			 fileName = filename
		//console.log( "> reload on ", fileName );
		fs.stat(fileName, function(error, stats) {
			var fileData;
			if( !stats ) {
				//console.log( "no such file")
				callback( true );
			} else {
				fs.readFile(fileName, function(err, data) {
					if (err) throw err;
					//fileData = new Uint8Array(data.toArrayBuffer());
					var buffer = new ArrayBuffer(stats.size);
					var readBuf = new Uint8Array( buffer );
					for( var n = 0; n < stats.size; n++ )
						readBuf[n] = data[n];
					callback( false, buffer, data );
				});
			}
		});
	}
	,mkdir: mkdir
}

exports.Utf8ArrayToStr = function(typedArray) {
	var out, i, len, c;
	var char2, char3;
	var array = new Uint8Array( typedArray );
	out = "";
	len = array.length;
	i = 0;
	while(i < len) {
	c = array[i++];
	switch(c >> 4)
	{
	  case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
		// 0xxxxxxx
		out += String.fromCharCode(c);
		break;
	  case 12: case 13:
		// 110x xxxx   10xx xxxx
		char2 = array[i++];
		out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
		break;
	  case 14:
		// 1110 xxxx  10xx xxxx  10xx xxxx
		char2 = array[i++];
		char3 = array[i++];
		out += String.fromCharCode(((c & 0x0F) << 12) |
					   ((char2 & 0x3F) << 6) |
					   ((char3 & 0x3F) << 0));
		break;
	}
	}

	return out;
}

function GetFilename( oid )
{
	if( !oid.ΛfsName ) {
		oid.ΛfsName = "Λ/" + oid.Λ;//.substring( 0, 5 ) + "-" + oid.Λ.substring( 5,10 ) + "-" + oid.Λ.substring( 10 );
		console.log( "GetFilename is ", oid.ΛfsName, " for ",oid);
	}
	return oid.ΛfsName;
}

function GetObjectFilename( oid )
{
	var leader = "";
	if( oid.contained )
		if( oid.contained ) {
			if( oid.contained.ΛfsPath )
				leader = oid.contained.ΛfsPath;
			else
				leader =  ( oid.contained.Λfspath = oid.contained._.substring( 0, 5 ) + "/" + oid.contained._.substring( 5,10 ) + "/" +  oid.contained._.substring( 10 ) )
			leader += ".content/";
		}
	//if( oid )
	//    oid.fs
	console.log( "object filename from: ", oid );;
	var char =  leader.join( oid._.substring( 0, 5 ) + "/" + oid._.substring( 5,10 ) + "/" +  oid._.substring( 10 ));
	console.log( "joined filename:", char);
	return char;
}

function mkdir(path, callback) {
	if( path[path.length-1] !== 'Λ')
		path = path.substring( 0, path.lastIndexOf("/"));
	else {
		if( path.length == 1 ) return;
	}
	if( !path ){
		if( callback ) callback();
		return;
	}
	//console.log( "mkdir path: ", path )

	fs.mkdir( path, (err)=>{
		if( err ) {
			if( err.code == 'ENOENT') {
				//path = path.substring( 0, path.lastIndexOf("/"));
				chainMkDir( path )
				fs.mkdir( path, ()=>{} );
			}
			else if( err.code == 'EEXIST');
			else console.log( " mkdir status ", err );
		}
		if( callback ) callback();
	} );
}

function chainMkDir(path) {
		path = path.substring( 0, path.lastIndexOf("/"));
		if( path.length )
			chainMkDir( path );
		if( path.length == 0 ) return;
	fs.mkdir( path, (err)=>{
		if( err ) {
		if( err.code == 'ENOENT') {
			//path = path.substring( 0, path.lastIndexOf("/"));
			chainMkDir( path );
			fs.mkdir( path, (err)=>{} );
		}
		else if( err.code == 'EEXIST');
		else console.log( " chainmkdir status ", err );

	} } );
}
