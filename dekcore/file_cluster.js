const debug_ = false;
const fs = require( 'fs');
const config = require( "./config.js" );
const vfs = require( 'sack.vfs' );
const idGen = require( './util/id_generator.js' );

console.log( "File_Cluster volume Creation (was this ovreridden?");
console.log( "Does this get reused?")
const vol = vfs.Volume();

var cvol;
var disk = vol;

var fc_local = {
	authorities : [],
	store : null,
	root : null,
}

var inited = false;

module.exports = exports = {
	async init() {
		//console.log( "who waits for root to be gotten?");
		return new Promise( (resume, stop)=>{
			if( inited ) return;
			var cvolName;
			let keys = [undefined,undefined];//[idGen.regenerator( "0" + config.Λ ), idGen.regenerator( "1" + config.Λ )];
			cvol = vfs.Volume( null, cvolName = './core/' + config.Λ, keys[0], keys[1] );
			(fc_local.store = vfs.ObjectStorage( cvol, "storage.os" ))
				.getRoot()
					.then( (dir)=>{
						fc_local.root = dir
						console.log( "Resume waiter on init...");
						resume();
				} );
			if( debug_ ) {
				console.log( cvol.dir() );
				console.log( "cvol", cvolName );
			}
			exports.cvol = cvol;
			process.on( 'exit', ()=>{
				fc_local.store.flush();
				//cvol.flush();
				console.trace( "Exit event in file cluster" );
			})
			
			
			inited = true;		
		});
	},
	Store( id ){
		return vfs.ObjectStorage( cvol, id );
	},
	addAuthority( addr ) {
		athorities += addr;
	},
	put( o, opts ) {
       	return fc_local.store.put( o, opts );
	},
	get( opts ) {
       	return fc_local.store.get( opts );
	},
	addEncoders( encoders ) {
		return fc_local.store.addEncoders( encoders );
	},
	addDecoders( coders ) {
		return fc_local.store.addDecoders( coders );
	},
	map( o, opts ) { return fc_local.store.map( o, opts ) ; },
	store( filename, object, callback ) {
		var fileName;
		if( callback ) {
			console.trace( "CALLBACK DEPRECATED ON STORE, PLEASE USE PROMISED RESULT");
		}
		if( !object ){
			console.log( "Nothing to store?");
			return;
		}
		//console.log( typeof filename )
		//console.log( 'storing object : ', object, Object.keys( object ) );
		//console.log( 'storing object : ', object.toString() );
		//console.trace( "storing into : ", filename, object, callback );
		if( typeof( filename ) == 'string' ) {
			 fileName = filename
			 return new Promise( (res,rej)=>fc_local.root.open( fileName )
				 .then( file=>file.write( object )
						.then( res )
						.catch( rej ) 
					).catch(rej)
				);
		} else {
			return new Promise( (res,rej)=>fc_local.store.put( filename )
				.then( d=>{ console.log( "put filename, callback.." );return (callback&&callback(d),res(d))} ).catch(rej) );
			/*
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
			*/
		}
		return fc_local.root.open( fileName ).then( file=>file.write( object ).then( callback ) );
	},
	reloadFrom( pathobject, callback ) {
		if( pathobject.Λ )
			if( !pathobject.ΛfsPath )
				pathobject.ΛfsPath = GetFilename( pathobject );
			console.log( "readdir of, ", pathobject.ΛfsPath+"Λ")
			fs.readdir(  pathobject.ΛfsPath+"Λ", callback );
	},
	reload(filename, callback){
		if( callback ) {
			console.trace( "CALLBACK DEPRECATED ON STORE, PLEASE USE PROMISED RESULT");
		}
		if( filename.Λ )
			if( filename.ΛfsPath )
				fileName =  filename.ΛfsPath;
				else {
					fileName = filename.ΛfsPath = GetFilename( filename );
				}

		var result;
		var fileName = filename
		return new Promise( (res,rej)=>{
			return fc_local.root.open( fileName ).then( file=>file.read().then( res ).catch( rej ) ).catch(rej);
		})
	},
	mkdir: mkdir,
	cvol: cvol
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
		//console.log( "GetFilename is ", oid.ΛfsName, " for ",oid);
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

	return fs_local.root.Folder( path ).then( callback );
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
