"use strict";

var config = require( "./config.js");
//var bits = require( "../org.d3x0r.common/salty_random_generator.js").SaltyRNG();
var dns = require( 'dns');
var localAddresses;
var v6Servers = [];
var Servers=[];
var first_address;
var first_server;
var connection_count = 0;
var port = 3213;

exports.discover = ( options )=>{
     const dgram = require('dgram');
     var os = require("os");
     //console.log( "hostname is ... ", config.run.hostname );
            
     var interfaces = os.networkInterfaces();
     var addresses = [];
     for (var k in interfaces) {
    	for (var k2 in interfaces[k]) {
        	var address = interfaces[k][k2];
                calculateBroadcast( address );
	  	addresses.push(address);
                //console.log( "pushed an address from networkInterfaces..." );
	}
     }
     
/*****************
 * DNS lookup doesn't return information like netmask
 *
     //console.log( addresses );
     dns.lookup( config.run.hostname, {
          //family: 4,
          hints: dns.ADDRCONFIG | dns.V4MAPPED,
          all: true
        },(err,a,family)=> {
        
        	if( err ) {
                	console.log( "resolve had an eror", err );
                        return;
                }
                addresses = a;
           	console.log( "lookup returned an adress:", a );     
        });
        
 *        
 *******************/        
     addresses.forEach( (addr)=>
        {
                    var server;
	            	//console.log( "addr.family", addr.family );
                        if( addr.family==="IPv6") {
                            if( addr.address.startsWith( "fe80::" ) )
                                return;
                            v6Servers.push( server = { socket: dgram.createSocket({type:'udp6',reuseAddr:true})
                            			, address: addr } );
                        }
                        else if( addr.family === "IPv4" ){
                            if( addr.address.startsWith( "169.254") ) 
                            	return;
                            Servers.push( server = { socket: dgram.createSocket({type:'udp4',reuseAddr:true})
                            		, address : addr }
                                        )
                            /*
                            if( addr.address.startsWith( "192") ) {
                                first_server = server;
                                first_address = addr;
                            }
                            */
                        }

                        console.log( addr );
                        try {
                            server.socket.bind({address:addr.address, port:options.port||port, exclusive: false,reuseAddr:true});
                            config.run.addresses.push( { address:addr } );

                            server.socket.on('error', (err) => {
                              console.log(`server error:\n${err.stack}`);
                              server.socket.close();
                              console.log( "harmless... right? ");
    			              //throw "Server Error";
                            });

                            server.socket.on('message', (msg, rinfo) => {
                                if( !rinfo.address === addr.address )
                                    console.log( msg );
                                console.log( addr.address );
                                console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port}`);
                            });

                            server.socket.on('listening', () => {
                                  var address = server.socket.address();
                                  server.socket.setBroadcast(true)
                                  if( !connection_count ){
                                      console.log( "setting timeout.")
                                      setTimeout( discoverer.dispatchPing, 1000 );
                                      connection_count = 0;
                                  }
                                  connection_count++;
                                  /*
                                     if( addr.family==6 ){

                                      //serverv6.bind(3213);
                                      var buf = bits.getBuffer( 128-16 );
                                      var wordbuf = new Uint16Array( buf );
                                      var addr_tail = "";
                                      for(var n = 0; n < 5; n++ )
                                          addr_tail += ":" + ( wordbuf[n].toString(16)).substring( -4 );
                                          console.log( "address is ff08  ", addr_tail )
                                    //server.socket.addMembership("ff08" + addr_tail );
                                    }
                                */
                                console.log(`server listening ${address.address}:${address.port}`);
                            });
    	                } catch( err ) {
                           console.log( "Discovery UDP failed", err );
                        }
                        console.log( "done setting up dsicver?", connection_count);
                        if( !connection_count && options.ontimeout) {
                            setTimeout( options.ontimeout, 0 );
                            options.ontimeout = null;
                        }
                        //server.socket.setBroadcast(true)
                } )
//            } )


    var discoverer = {
        pingMessage : new Buffer( "{'msgop':'whoami','id':"+config.run.Λ+"'}")
        ,dispatchPing : () => {
            //console.log( "discover...")
            setTimeout( discoverer.dispatchPing, 30000 );
            if( first_server )
            {
                first_server.socket.send( discoverer.pingMessage, 0, discoverer.pingMessage.length, port,  first_server.broadcast );
                console.log( "sent to 255.255.255.255", first_server);
            }
            else {
                    Servers.forEach( ( server )=> {
                    	console.log( "Send to ", server.broadcast )
                        server.socket.send( discoverer.pingMessage, 0, discoverer.pingMessage.length, port,  server.broadcast );
                        return;
                    } );

                    v6Servers.forEach(  ( server )=> {
                    //    server.socket.send( pingMessage, 0, pingMessage.length, port,  multicastgroup);
                } );
            }
            /*
            ff02::	Link Local: spans the same topological region as the corresponding unicast scope, i.e. all nodes on the same LAN.
            ff05::	Site local: is intended to span a single site
            ff08::	Organization scope: Intended to span multiple sizes within the same organization
            ff0e::	Global scope, assigned by IANA.
            ff01::	Interface local: Spans only a single interface on a node and is useful only for loopback transmission of multicast.
        */
            //setTimeout( discoverer.dispatchPing, 1000 );
            //discoverer.serverv6.send( pingMessage, 0, pingMessage.length, port,address )
            if( options.ontimeout ) {
                console.log( "can something" + options.timeout );
                setTimeout( options.ontimeout, options.timeout );
                options.ontimeout = null;
            }

        }
    };


    //setTimeout( ()=>{}, 10);
    return discoverer;
};


function calculateBroadcast( addr )
{
	if( addr.family=="IPv4" ){ 
        	var mask = [];
                var addrNum = [];
                var stub = [255,255,255,255];
                var addrPart = [];
                var addrPartNot = [];
                 var d = addr.netmask.split('.');
		 mask[0] = Number(d[0])
                 mask[1] = Number(d[1])
                 mask[2] = Number(d[2])
                 mask[3] = Number(d[3])
               //  console.log( "d is ", d );
                 var d = addr.address.split('.');
		 addrNum[0] = Number(d[0])
		 addrNum[1] = Number(d[1])
		 addrNum[2] = Number(d[2])
		 addrNum[3] = Number(d[3])
               //console.log( "d is ", d );
                //console.log( "address part", addrNum);
                addrPart[0] = addrNum[0] & mask[0];
                addrPart[1] = addrNum[1] & mask[1];
                addrPart[2] = addrNum[2] & mask[2];
                addrPart[3] = addrNum[3] & mask[3];

                //console.log( "address part", addrPart);
                //console.log( "address mask", mask);
                stub[0] &= ~mask[0];
                stub[1] &= ~mask[1];
                stub[2] &= ~mask[2];
                stub[3] &= ~mask[3];
                //console.log( "stub", stub);
              	addrPart[0] |= stub[0];
              	addrPart[1] |= stub[1];
              	addrPart[2] |= stub[2];
              	addrPart[3] |= stub[3];
                
                //console.log( "final", addrPart);
                addr.broadcast = `${addrPart[0]}.${addrPart[1]}.${addrPart[2]}.${addrPart[3]}`;
        }
}
