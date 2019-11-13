"use strict";

//------------------------------------------
// var discover = require( "discovery.js" );
// discover.discover( { ontimeout : ()=>{} // function call if timeout elapses and no reply is recieved.
//                      filter : [true/false] // defaults true, if false, skips interface self-send filtering
//                      timeout : 30000 // how long to try; ping timer is set to fire 4 times before this, on the 5th fail.
//                      onquery : (msg, !!self, rinfo, server.address)=>{} // function; callback given when a request is received.  Is given the object sent.
//                      onsend : (address)=>{ return "new buffer"; } // if specified, this is used to generate the data sent for broadcast
//                    } );
//
//  returns an object which has
//   { pingMessage : new Buffer( "message" );
//   , dispatchPing : function // called to start sending pings; allows setting pingMessage to something....
//   , stop : function // stop automatic pings, shutdown timeout event (presumably is a good response)
//                     // no further received messages will be dispatched
//   }

var bits = require( "../../org.d3x0r.common/salty_random_generator.js").SaltyRNG( (salt)=>{salt.length=0;salt.push( (new Date()).getTime() ) });
var dns = require('dns');
var localAddresses;
var v6Servers = [];
var Servers = [];
var first_address;
var first_server;
var stopped = false;
var connecting_count = 0;
var connection_count = 0;
const port = 3214;


exports.discover = (options) => {
	if( !("master" in options ) )
		options.master = false;
	if (!options.onquery) {
		throw new Error("Requires onquery callback, or nothing useful could be done");
	}
	const dgram = require('dgram');
	var os = require("os");
	//console.log( "hostname is ... ", config.run.hostname );
	if( !( "filter" in options ) )
	     	options.filter = true;
	var interfaces = options.interfaces || os.networkInterfaces();
	var addresses = [];
	for (var k in interfaces) {
		for (var k2 in interfaces[k]) {
			var address = interfaces[k][k2];
			calculateBroadcast(address);
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
	addresses.forEach((addr) => {
			var server;
			//console.log( "addr.family", addr.family );
			if (addr.family === "IPv6") {
				// skippnig ipv6 for now.
        		return;

        		console.log( "check v6 ", addr.address)
				if (addr.address.startsWith("fe80:"))
					return;
				v6Servers.push(server = {
					socket: dgram.createSocket({
						type: 'udp6',
						reuseAddr: true
					}),
					address: addr
				}); {
					//serverv6.bind(3213);
					var buf = bits.getBuffer(128 - 16);
					var wordbuf = new Uint16Array(buf);
					var addr_tail = "";
					for (var n = 0; n < 5; n++)
						addr_tail += ":" + (wordbuf[n].toString(16)).substring(-4);
          			addr.broadcast = "ff02::2";// + addr_tail+"]";
					console.log("address is  ", addr.broadcast);
						/*
						ff02::	Link Local: spans the same topological region as the corresponding unicast scope, i.e. all nodes on the same LAN.
						ff05::	Site local: is intended to span a single site
						ff08::	Organization scope: Intended to span multiple sizes within the same organization
						ff0e::	Global scope, assigned by IANA.
						ff01::	Interface local: Spans only a single interface on a node and is useful only for loopback transmission of multicast.
						*/
				}

			} else if (addr.family === "IPv4") {
				if (addr.address.startsWith("169.254"))
					return;
				if (addr.address === "127.0.0.1")
					return;
				Servers.push(server = {
					socket: dgram.createSocket({
						type: 'udp4',
						reuseAddr: true
					}),
					address: addr
				})
			} //console.log(addr);
			try {
				//console.log( "try bind ", addr.address, port )
				server.socket.bind({
					address: addr.address,
					port: options.master?port:undefined,
					exclusive: false
				});
        //if( addr.family === "IPv6" )
        //  server.socket.addMembership( addr.broadcast, addr.address);

				server.socket.on('error', (err) => {
					// close event will be called next
					connecting_count--;
					console.log(`server error:\n${err.stack}`);
					console.log("harmless... right? ");
				});

				server.socket.on('message', (msg, rinfo) => {
					if( stopped ) { console.log( "ignoring message because stopped" ); return; }
					msg = msg.toString('utf8');
					//console.log( "message", msg, rinfo )
					if (!options.filter || rinfo.address !== addr.address) {
						var self = Servers.find((svr) => {
							//console.log(`is ${rinfo.address} === ${svr.address.address}`);
							return (rinfo.address === svr.address.address);
						});
                                                //if( self )
	                                        //        ;//console.log( "found self", self.address.address );
                                                //else
                                                //	;//console.log( "not from myself!" );
                                                if( compareBroadcast( server, rinfo, server.address ) ) {
							//console.log(`server got: ${msg} from ${rinfo.address}:${rinfo.port} `, server.address.address);
                                                
							let reply = options.onquery(msg, !!self, rinfo, server.address );
							if (reply) {
								//console.log("Reply with ", reply);
								server.socket.send(reply, 0, reply.length, rinfo.port, rinfo.address);
							}
                                                }
                                                //else
						//	console.log(`server ignored: ${msg} from ${rinfo.address}:${rinfo.port} `, server.address.address);
					}
					//console.log( "Done with message graceful", msg )
				});
				server.socket.on('listening', () => {
					var address = server.socket.address();
					server.socket.setBroadcast(true);

					if( addr.family === "IPv6" )
					    server.socket.addMembership( addr.broadcast, addr.address);
					if (!connection_count) {
						// first setup.
						//console.log("At least one setup... ")
						//setTimeout(discoverer.dispatchPing, 100);
					}

					connecting_count--;
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
					//console.log(`server listening ${address.address}:${address.port}  (${connection_count+connecting_count})`);
				});
			} catch (err) {
				console.log("Discovery UDP failed", err);
			}

			connecting_count++;
			//console.log("done setting up discover?", connection_count + connecting_count);

			//server.socket.setBroadcast(true)
		}) // addresses.foreach
                

	var discoverer = {
		pingMessage: "ping",
                close : ()=>{
			//console.log( "closing; no long receives UDP messages." );
                	Servers.forEach( (server)=>{
                        	server.socket.close();
                        } );
                        Servers = [];
                },
                send : (reply,rinfo,addr)=>{
	                //console.log( "send with compare ", rinfo, addr );
                	var server = Servers.find( (server)=>compareBroadcast( server, rinfo, addr ) );
                        if( server ) {
					//console.log( "Sending ", reply, rinfo.port, rinfo.address )
	                		server.socket.send(reply, 0, reply.length, rinfo.port, rinfo.address);
						}else console.log( "didn't know which way to send")
                },
                stop : ()=>{
			console.log( "STOP DISCOVER")
                	stopped = true;
                	clearTimeout( options.pingTimer );
                        options.pingTimer = null;
                        if( options.pendingTimeout ) {
	                	clearTimeout( options.pendingTimeout );
        	                options.pendingTimeout = null;
                        }
                },
		restart: () => { stopped = false; discoverer.dispatchPing(); },
		dispatchPing: () => {
			if( stopped )
				return;
			var timeout = options.timeout || 30000;
			var send = discoverer.pingMessage;
			//console.log( "discover...")
			if (options.pendingTimeout || options.ontimeout) {
				//console.log("Still need to send pings... schedule one.");
				options.pingTimer = setTimeout(discoverer.dispatchPing, timeout / 5);
			}

			Servers.forEach((server) => {
				//console.log("Send to ", server.address.broadcast)
				var msg = discoverer.pingMessage;
				if (options.onsend) {
	                                //console.log( "call the onsend..." );
					msg = options.onsend(server.address);
                                        //console.log( "onsend replied with message:", msg );
                                }
				server.socket.send(msg, 0, msg.length, port, server.address.broadcast);
			});

			v6Servers.forEach((server) => {
				var msg = discoverer.pingMessage;
				if (options.onsend)
					var msg = options.onsend(server.address);
        			console.log( server.address.broadcast)
				server.socket.send( msg, 0, msg.length, port, server.address.broadcast );
			});

			if (options.ontimeout) {
				options.pendingTimeout = setTimeout(((cb) => {
					return () => {
						
						if (options.pingTimer) {
							clearTimeout( options.pingTimer );
							cb();
						}
						options.pendingTimeout = null;
					}
				})(options.ontimeout), options.timeout);
				options.ontimeout = null;
			}
		}
	};

	return discoverer;
};

function compareBroadcast(server, testAddr, testAddr2 ) {
      	var addr = server.address;
                        
	if (addr.family == "IPv4") {
		var mask = [];
		var addrNum = [];
		var stub = [255, 255, 255, 255];
		var addrPart = [];
		var addrPartNot = [];
                var testAddrNum = [];
                var testAddr2Num = [];

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

		var d = testAddr.address.split( '.' );
                testAddrNum[0] = Number( d[0] ) & mask[0];
                testAddrNum[1] = Number( d[1] ) & mask[1];
                testAddrNum[2] = Number( d[2] ) & mask[2];
                testAddrNum[3] = Number( d[3] ) & mask[3];
                
		var d = testAddr2.address.split( '.' );
                testAddr2Num[0] = Number( d[0] ) & mask[0];
                testAddr2Num[1] = Number( d[1] ) & mask[1];
                testAddr2Num[2] = Number( d[2] ) & mask[2];
                testAddr2Num[3] = Number( d[3] ) & mask[3];
                //console.log( "testing ", addrPart, testAddrNum, testAddr2Num );
                if( addrPart[0] === testAddrNum[0] &&
                    addrPart[1] === testAddrNum[1] &&
                    addrPart[2] === testAddrNum[2] &&
                    addrPart[3] === testAddrNum[3] &&
                    addrPart[0] === testAddr2Num[0] &&
                    addrPart[1] === testAddr2Num[1] &&
                    addrPart[2] === testAddr2Num[2] &&
                    addrPart[3] === testAddr2Num[3]
                    )
                 	return true;
                
	}
                 return false;
}


function calculateBroadcast(addr) {
	if (addr.family == "IPv4") {
		var mask = [];
		var addrNum = [];
		var stub = [255, 255, 255, 255];
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
