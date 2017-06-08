

const myName = ( process.argv.length > 2 )?process.argv[2]:"unnamed remote";
const startup = ( process.argv.length > 3 )?require( 'process').cwd() + process.argv[3]:null;

process.on( "warning", (warning)=>{console.trace( warning ); } );
const discoverer = require( "../../util/discovery.js" );
const config = require( "../../config.js" );
const idGen = require( "../../util/id_generator.js");
const idMan = require( "../../id_manager_ext.js" );
const os = require( "os" );
//const text=require('../../../org.d3x0r.common/text.js')
//const Gun = require( "gun" );
const WebSocket = require( 'ws' );

//var gun = null;//Gun();

const myID = getLocation();

function getLocation() {
	var here = process.cwd();
	var i = os.networkInterfaces();
	for( var int in i ) {
		i[int].forEach( addr=>{
			here += addr.mac;
		});
	}
	return idGen.regenerator( here );
}

// should cache responses
var remoteRequire = require( '../../util/myRequire.js');
remoteRequire.provide( "id_manager.js", idMan )
remoteRequire.provide( "id_manager_ext.js", idMan )


var discoverRun;
config.start( run );

function run() {
	console.log( "going to generate an ID..." );
    idMan.ID( idMan.localAuthKey, config.run.Λ, key=>{
			console.log( "got back an ID", key );
            discoverRun = key;
            run2();
    } );
}
function run2() {
    var d = discoverer.discover( { timeout: 5000
        , filter : false // expects to hear on localhost and/or same interfaces
        , onsend : (addr)=>{ return discoverRun.Λ + " identify " + idGen.xor( discoverRun.Λ, myID ) + " " + myName }
        , onquery : (msg, self,raddr,addr) => {
            console.log( "Received:", msg, self, raddr, addr )
        	var parts = msg.split( " " );
                //console.log( "got message ", msg );
                if( parts[0] === discoverRun.Λ )  // is a message from myself.
        		{
        			if( !myID )
        				myID = idGen.regenerator( addr.mac + process.cwd() );
                        	return null;
        		}
                if( parts[1] === "identity" ) {
                    // parts[2] == my new run ID...
                    //if( gun ) // filter duplicates.
                    //    return null;
                    d.stop();
                    x( parts[2], parts[3], raddr );
                }

        }
        , ontimeout : ()=>{
            console.log( "i'm all alone.", config.run.Λ )
			process.exit();
            // really all of my keys are on my config.run key anyway
            //   so this shouldn't be done here?
        }
        , onconnect : ( sock ) => {
        	console.log( "Connect happened?  What do we do with a connect?" );
            //var idGen = require( "./id_generator.js");
            //idMan.sync( sock );
        }
    })
    d.dispatchPing(); // begin the discovery.
}



function x( parts,rport,raddr ) {
        console.log( raddr.address, "addr:", raddr, "parts:", parts );
        idMan.setRunKey( parts );
        config.commit();

        //var addr = `wss://${raddr.address}:8000/unused`;
        //console.log( "passing wsc option though:()");
        //gun=Gun( {wsc:{protocols:["gunDb"], rejectUnauthorized:false}, peers:[addr], file:"nodegun.json", uuid:idGen.generator} );
        //console.log( "gun target",addr);

        var Entity ;
        remoteRequire.config.config = config;
        remoteRequire.config.port = rport;
        remoteRequire.config.host = raddr.address;

console.log( "Require Entity." );
        Entity = remoteRequire.require( "/Entity/entity.js" );
        //Entity.gun = gun;
        Entity.reloadAll( ()=>{
		console.log( "This is Entities recovered" );
        },
        ()=>{
		console.log( "This creates this 'void'" );

            Entity.create( null, "node", "this node itself", (o)=>{
                //console.log( "my old key was ", o.Λ)
                o.Λ = parts;

                //console.log( "Gun listening on ", parts);
                //gun.get( parts ).map( _handleCommand(o) );

                //gun.get( parts[2] ).put( {firstMessage:"FIRST!"} );
                o.sandbox.require = remoteRequire.require;
                //o.gun =

                o.sandbox.io = {
                        service : {
                                register : (name)=>{
                                        var myRequest = idGen.generator();
                                        /*
                                        gun.get( "Services" ).put( { service: myRequest } );

                                        gun.get( myRequest ).put( { service: name } );
                                        gun.get( myRequest ).map( (val, field )=>{
                                                if( "servicePool" in val ) {
                                                        gun.get( val.servicePool ).map( handleServiceRequest );
                                                }
                                        } );
					*/
                                }
                        }
                };
                o.sandbox.io.ether = {
                        ws : new WebSocket(addr, ["entitiy-ethernet"], {rejectUnauthorized:false}),
                        send(target,msg) {

                        }
                }

                {
                        var ws = o.sandbox.io.ether.ws;
                        ws.on( 'open', ()=>{

                        })
                        ws.on( 'message', (msg)=>{

                        });
                        ws.on( 'close', (reason,code)=>{

                        });
                        ws.on( 'error', ()=>{

                        });
                }

                //console.log( "Try to require shell?")

                //var shell = remoteRequire.require( "/Sentience/shell.js" );
                //o.sandbox.command = shell.Filter( o.sandbox );

                /*
                o.sandbox.command.processCommandLine = (args)=>{
                        args.break();
                        gun.get( o.Λ ).put( { exec: args })
                }
                */
                if( o.sandbox.command )
                    Object.keys( o.sandbox.command ).forEach( key=>{
                                    Object.defineProperty( o.sandbox.command, key, { enumerable:false, writable:true,configurable:false} );
                            });
	console.log( "This is REmote Requite probably of startup script" );
		o.sandbox.require( startScript );

		console.log( "At what point should we remote require everything?" );
                //o.sandbox.require = remoteRequire.require;


                ////var path = require.resolve( "nodeStartup.js" ).replace( /\\/g, "/" );
                //shell.Script( o.sandbox, text.Text("startup.js") );
        })
    })
}


function _handleCommand( o ) {
	return function( val, field ) {
                console.log(" map event with", field, val)
        	if( field === "exec" ) {
                	return vm.runInContext(val, sandbox /*, { filename:"", lineOffset:"", columnOffset:"", displayErrors:true, timeout:10} */)
                }
		this.put( null );
        };
}

config.resume();
