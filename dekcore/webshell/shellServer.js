

io.addProtocol( "webShell", (conn)=>{
    //console.log( "connected gundb, add peer")
    peers.push( conn );
    exports.gun.on('out', (msg)=>{
        msg = JSON.stringify({headers:{},body:msg});
        peers.forEach( (p)=>{ try { p.send( msg ) }catch  (err) {console.log( "Peer is bad... maybe closing?", err );} })
    })

    conn.on( 'message',(msg)=>{
            console.log( "gundb is getting", msg );
            exports.gun.on('in',msg.body)
        })
    conn.on( 'close', (reason,desc)=>{
        // gunpeers gone.
        var i = peers.findIndex( p=>p===conn );
        if( i >= 0 )
            peers.splice( i, 1 );
    })
})

