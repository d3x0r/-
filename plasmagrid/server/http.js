var path = require('path');
var http = require('http');
var fs = require('fs');
var url = require( 'url' );

var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.VCAP_APP_PORT || process.env.PORT || process.argv[2] || 24680;
var ip = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

/*
var Gun = require('gun');
var gun = Gun({
	file: 'data.json',
	s3: {
		key: '', // AWS Access Key
		secret: '', // AWS Secret Token
		bucket: '' // The bucket you want to save into
	}
});
*/


var server = http.createServer(function(req, res){
	//console.log( req );
      //  console.log( req.url );

	//if(gun.wsp.server(req, res)){
      //  	console.log( "websock request?" );
//		return; // filters gun requests!
//	}
        var _rurl = url.parse( req.url );
	var rurl = _rurl.pathname;
				// NTS HACK! SHOULD BE ITS OWN ISOLATED MODULE! //
//	var reply = {headers: {'Content-Type': tran.json, rid: req.headers.id, id: gun.wsp.msg()}};
	//	//		if(req && req.url && req.url.pathname && req.url.pathname.indexOf('gun.nts') >= 0){
	//				return cb({headers: reply.headers, body: {time: Gun.time.is() }});
	//			}
				// NTS END! SHOULD HAVE BEEN ITS OWN MODULE //
				// ALL HACK! SHOULD BE ITS OWN MODULE OR CORE? //
        //if( url.startsWith( "/three.js" ) )
        //	url = ".." + url;
        //console.log( url );

	var stream = fs.createReadStream(path.join(__dirname+"/../..", rurl))
	stream.on('error',function(){ // static files!
	        console.log( "Failed so...?", rurl );
		if( rurl === "/" ) {
			res.end(fs.readFileSync(path.join(__dirname+"/..", 'index.html'))); // or default to index
		}
		else {
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.end();
		}
	});

	if( rurl.endsWith( ".js" ) ) {
    //console.log( "it's app/javascript... do ppipe..." );
		res.writeHead(200, {'Content-Type': 'application/javascript'});
	} else if( rurl.endsWith( ".css" ) )
		res.writeHead(200, {'Content-Type': 'text/css'});
	else if( rurl.endsWith( ".png" ) ){
		res.writeHead(200, {'Content-Type': 'image/png'});
			res.write( "data:image/png;base64," );
		stream.on( 'data', function( img) {
			res.write( new Buffer(img).toString('base64') );
			//res.write( img, "binary" );
		})
		stream.on( 'end', function( ) {
			res.end();
		})
		return;
	}
	else
		res.writeHead(200, {'Content-Type': 'text/html'});

	stream.pipe(res); // stream
});
//gun.wsp(server);
server.listen(port, ip);

console.log('Server started on port ' + port );
