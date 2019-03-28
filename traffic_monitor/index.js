
var vfs = require( "sack.vfs" );

var raw = vfs.Volume();

console.log( "dir?", raw.dir( "/sys/class/net/*" ) );

var base = null;
var baseStart;

function readAll() {
	var enp = [
		parseInt(raw.read( '/sys/class/net/enp3s0/statistics/rx_bytes' ).toString()),
		parseInt(raw.read( '/sys/class/net/enp3s0/statistics/tx_bytes' ).toString())];
	enp[2] = enp[0] + enp[1];
        enp[3] = parseInt(raw.read( '/sys/class/net/enp3s0/statistics/rx_packets' ).toString())
        enp[4] = parseInt(raw.read( '/sys/class/net/enp3s0/statistics/tx_packets' ).toString())
        enp[5] = enp[3]+enp[4];
	var br0 = [
		parseInt(raw.read( '/sys/class/net/br0/statistics/rx_bytes' ).toString()),
		parseInt(raw.read( '/sys/class/net/br0/statistics/tx_bytes' ).toString())];
	br0[2] = br0[0] + br0[1];
        br0[3] = parseInt(raw.read( '/sys/class/net/br0/statistics/rx_packets' ).toString())
        br0[4] = parseInt(raw.read( '/sys/class/net/br0/statistics/tx_packets' ).toString())
        br0[5] = br0[3]+br0[4];
	var he = [
		parseInt(raw.read( '/sys/class/net/he-ipv6/statistics/rx_bytes' ).toString()),
		parseInt(raw.read( '/sys/class/net/he-ipv6/statistics/tx_bytes' ).toString())];
	he[2] = he[0] + he[1];
        he[3] = parseInt(raw.read( '/sys/class/net/he-ipv6/statistics/rx_packets' ).toString())
        he[4] = parseInt(raw.read( '/sys/class/net/he-ipv6/statistics/tx_packets' ).toString())
        he[5] = he[3]+he[4];
        
        
	var stats = {enp:enp, br0:br0, he:he };
        if( !base ) {
	        base = stats;
                baseStart = new Date();
        } else if( baseStart.getDay() != (new Date()) .getDay() ) {
        	base = stats;
                baseStart = new Date();                
        }
        return stats;
}


function readCounters() {
	var stats = readAll();
	console.log( new Date() );
	console.log( stats );
	console.log( "byt ENP:", stats.enp[2].toLocaleString(), "  BR0:", stats.br0[2].toLocaleString(), "  HE:",
stats.he[2].toLocaleString() 
);
	console.log( "pkt ENP:", stats.enp[5].toLocaleString(), "  BR0:", stats.br0[5].toLocaleString(), "  HE:",
stats.he[5].toLocaleString() 
);
	console.log( "p*b ENP:", (stats.enp[5]*1452).toLocaleString(), "  BR0:", (stats.br0[5]*1452).toLocaleString(), "  HE:",(stats.he[5]*1452).toLocaleString() 
);
	console.log( "byt ENP:", (stats.enp[2]-base.enp[2]).toLocaleString()
        	, "  BR0:", (stats.br0[2]-base.br0[2]).toLocaleString()
        	, "  HE:",(stats.he[2]-base.he[2]).toLocaleString() 
                );
	console.log( "pkt ENP:", (stats.enp[5]-base.enp[5]).toLocaleString()
        	, "  BR0:", (stats.br0[5]-base.br0[5]).toLocaleString()
                , "  HE:", (stats.he[5]-base.he[5]).toLocaleString() 
                );
	console.log( "p*b ENP:", ((stats.enp[5]-base.enp[5])*1452).toLocaleString()
        	, "  BR0:", ((stats.br0[5]-base.br0[5])*1452).toLocaleString()
                , "  HE:", ((stats.he[5]-base.he[5])*1452).toLocaleString()
		);
	setTimeout( readCounters, 300000 );
}

readCounters();
