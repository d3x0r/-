"use strict";

var fs = require( 'fs');
const numCPUs = require('os').cpus().length;
const crypto = require( 'crypto');
const tls = require( 'tls');
const cluster = require('cluster');
const https = require( 'https')
const path = require('path');

var config = require( './config.js');
var keyManager = require( "./id_manager.js" );
// server listening 0.0.0.0:41234

exports.Cluster = ()=>{
     var mycluster  ={
        ID : config.run.Λ
        , isMaster : true
        , start: startCluster
    };
    Object.assign( mycluster, require( 'cluster' ))

    function startCluster() {
	    console.log( "start cluster... does exports fail?" );
        if (cluster.isMaster) {
	      // Fork workers.
              console.log( "here", cluster);

              for (var i = 0; i < numCPUs; i++) {
	              console.log( "fork." );
                cluster.fork();
              }

              cluster.on('exit', (worker, code, signal) => {
                  if( exports.Cluster.isMaster )
                    cluster.fork();
                else
                	console.log(`worker ${worker.process.pid} died`);
              });
        } else {
            console.log( "cluster worker starting..." );
            scriptServer();
        }
    }

    return mycluster;
};

function scriptServer() {
    console.log( "Started Script Services");
    var privateKey = fs.readFileSync('ca-key.pem').toString();
    var certificate = fs.readFileSync('ca-cert.pem').toString();
    var option = {key: privateKey, cert: certificate};
    var credentials = tls.createSecureContext ();
    //var server = tls.createServer( option,
        var server = https.createServer( option,

  // Workers can share any TCP connection
  // In this case it is an HTTP server
//  var server = http.createServer(
        (req, res) => {
      //req.connection.Socket.
      //console.log( "got request", req );

      console.log( "got request" + req.url );
      var filePath = '.' + req.url;
      if (filePath == './')
          filePath = './index.html';

      var extname = path.extname(filePath);
      var contentType = 'text/html';
      switch (extname) {
          case '.js':
              contentType = 'text/javascript';
              break;
          case '.css':
              contentType = 'text/css';
              break;
          case '.json':
              contentType = 'application/json';
              break;
          case '.png':
              contentType = 'image/png';
              break;
          case '.jpg':
              contentType = 'image/jpg';
              break;
          case '.wav':
              contentType = 'audio/wav';
              break;
      }


      if( req.url=== '/' )   {
          console.log( "something   ");
            res.writeHead(200);
            res.end('<HTML><head><script src="hello.js"></script></head></HTML>');
        }
        else {
            let relpath;
            console.log( "serving a relative...", req.url );
            fs.access( relpath = req.url.substring(1,req.url.length), (err)=>{
                if( !err ) {
                    console.log( "Existed as a file...", relpath );
                    fs.readFile(relpath, function(error, content) {
                        if (error) {
                            if(error.code == 'ENOENT'){
                                fs.readFile('./404.html', function(error, content) {
                                    res.writeHead(200, { 'Content-Type': contentType });
                                    res.end(content, 'utf-8');
                                });
                            }
                            else {
                                res.writeHead(500);
                                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                                res.end();
                            }
                        }
                        else {
                            console.log( "write head 200");
                            res.writeHead(200, { 'Content-Type': contentType });
                            res.end(content, 'utf-8');
                        }
                    });
                }
                else {
                    console.log( "access result : ", err )
                    {
                        console.log( "and truth?", relpath );
                        //console.log( req );
                        res.writeHead(404);
                        res.end('<HTML><head><script src="core/no such thing.js"></script></head></HTML>');
                    }
                }
            });
        }
    });
    server.listen( 8000, () => {
        console.log( "bind success");
        }
    );
}

function GetFrom( path ) {
    res.pipe(file);
    let path1=path.lastIndexOf( "/");
    //let path2=path.lastIndexOf( "\")
    var file = fs.createWriteStream(path);
    var request = http.get("http://" + authority + "//" + path, function(response) {
        response.pipe( file );
    });
}
