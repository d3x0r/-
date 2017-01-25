"use strict";

//------------------------------------------
// var discover = require( "discovery.js" );
// discover.discover( { ontimeout : ()=>{} // function call if timeout elapses and no reply is recieved.
//                      timeout : 30000 // how long to try; ping timer is set to fire 4 times before this, on the 5th fail.
//                      onquery : (msg)=>{} // function; callback given when a request is received.  Is given the object sent.
//                      onreply : (msg)=>{} // callback when the other side of discovery responds.  Is given the object sent.
//                      onsend : ()=>{ return "new buffer"; } // if specified, this is used to generate the data sent for broadcast
//                    } );
//
//  returns an object which has 
//   { pingMessage : new Buffer( "message" );
//   , dispatchPing : function // called to start sending pings; allows setting pingMessage to something....
//   }

var config = { run : { addresses: [] } };  //require( "./config.js");
//var bits = require( "../org.d3x0r.common/salty_random_generator.js").SaltyRNG();
var dns = require( 'dns');
var localAddresses;
var v6Servers = [];
var Servers=[];
var first_address;
var first_server;
var connecting_count = 0;
var connection_count = 0;
const port = 3213;

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
 * DNS lookup doesn't return information like netmask; so we use os.networkInterfaces instead.
 *
     //console.log( addresses );
     dns.lookup( require( 'os').hostname(), {
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
                            server.socket.bind({address:addr.address, port:port, exclusive: false,reuseAddr:true});
                            config.run.addresses.push( { address:addr } );

                            server.socket.on('error', (err) => {
                              connecting_count--;

                              console.log(`server error:\n${err.stack}`);
                              server.socket.close();
                              console.log( "harmless... right? ");
    			              //throw "Server Error";
                            });

                            server.socket.on('message', (msg, rinfo) => {                            	
                                if( rinfo.address !== addr.address ) {
                                    var self = Servers.find( (svr)=> {
                                    	console.log( `is ${rinfo.address} === ${svr.address.address}` );
                                    	return ( rinfo.address === svr.address.address ) ; 
                                        }
                                    );
                                    if( !self ) {
                                    console.log( msg );
                                    console.log( info );
                                    console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port} `, server.address);
                                    }
                                }
                            });

                            server.socket.on('listening', () => {
                                  var address = server.socket.address();
                                  server.socket.setBroadcast(true)
                                  connecting_count--;
                                  connection_count++;
                                  if( !connection_count ){
                                      console.log( "At least one setup... ")
                                      setTimeout( discoverer.dispatchPing, 100 );
                                      connection_count = 0;
                                  }
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
                                //console.log(`server listening ${address.address}:${address.port}  (${connection_count})`);
                            });
    	                } catch( err ) {
                           console.log( "Discovery UDP failed", err );
                        }
                        
                        connecting_count++;
                        console.log( "done setting up discover?", connection_count);
                        
                        //server.socket.setBroadcast(true)
                } ) // addresses.foreach
               if( !connection_count && options.ontimeout) {
               	console.log( "wow that was immediate fire?", options.timeout );
                    setTimeout( options.ontimeout, options.timeout );
                    options.ontimeout = null;
               }


    var discoverer = {
        pingMessage : new Buffer( "{'msgop':'whoami','id':"+config.run.Λ+"'}")
        ,dispatchPing : () => {
            var timeout = options.timeout || 30000;
            //console.log( "discover...")
            console.log( "timeout is ", timeout, options );
            if( options.pendingTimeout || options.ontimeout ) {
	            console.log( "Still need to send pings... schedule one." );
	            setTimeout( discoverer.dispatchPing, timeout / 5 );
            }


                    Servers.forEach( ( server )=> {
                    	console.log( "Send to ", server.address.broadcast )
                        var msg = discoverer.pingMessage;
                        if( options.onsend )
                        	msg = options.onsend( server.address );
                        server.socket.send( msg, 0, msg.length, port,  server.address.broadcast );
                    } );

                    v6Servers.forEach(  ( server )=> {
                        if( options.onsend )
                        	msg = options.onsend( server.address );
                    //    server.socket.send( pingMessage, 0, pingMessage.length, port,  multicastgroup);
            	    } );
                    
                    
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
                options.pendingTimeout = setTimeout( ((cb)=>{
                	return ()=>{ 
                        	//clearTimeout( options.pendingTimeout );
                        	cb(); 
                        } 
                        } )(options.ontimeout)
                        , options.timeout );
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

                 var d = addr.address.split('.');
		 addrNum[0] = Number(d[0])
		 addrNum[1] = Number(d[1])
		 addrNum[2] = Number(d[2])
		 addrNum[3] = Number(d[3])

                addrPart[0] = addrNum[0] & mask[0];
                addrPart[1] = addrNum[1] & mask[1];
                addrPart[2] = addrNum[2] & mask[2];
                addrPart[3] = addrNum[3] & mask[3];

                stub[0] &= ~mask[0];
                stub[1] &= ~mask[1];
                stub[2] &= ~mask[2];
                stub[3] &= ~mask[3];

              	addrPart[0] |= stub[0];
              	addrPart[1] |= stub[1];
              	addrPart[2] |= stub[2];
              	addrPart[3] |= stub[3];
                
                addr.broadcast = `${addrPart[0]}.${addrPart[1]}.${addrPart[2]}.${addrPart[3]}`;
        }
}
