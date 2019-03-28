

var vfs = require( "sack.vfs" );

var raw = vfs.Volume();
var db = vfs.Sqlite( "traffic2.db" );

db.makeTable( "create table traffic_stats ( date TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
	+", relative int"
	+", in_bytes int, out_bytes int"
        +", in_packets int, out_packets int"
	+", br_in_bytes int, br_out_bytes int"
        +", br_in_packets int, br_out_packets int"
        +", INDEX timekey(date)" );


console.log( "dir?", raw.dir( "/sys/class/net" ) );

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
        } else if( baseStart.getDate() != (new Date()).getDate() ) {
        	db.do( `insert into traffic_stats (date,in_bytes,out_bytes,in_packets,out_packets,br_in_bytes,br_out_bytes,br_in_packets,br_out_packets,relative) 
                	values ('${1900+baseStart.getYear()}-${1+baseStart.getMonth()}-${baseStart.getDate()}'
                        	,${stats.enp[0]-base.enp[0]},${stats.enp[1]-base.enp[1]}
                                ,${stats.enp[3]-base.enp[3]},${stats.enp[4]-base.enp[4]}
                        	,${stats.br0[0]-base.br0[0]},${stats.br0[1]-base.br0[1]}
                                ,${stats.br0[3]-base.br0[3]},${stats.br0[4]-base.br0[4]},1)`);
                                
        	db.do( `insert into traffic_stats (date,in_bytes,out_bytes,in_packets,out_packets,br_in_bytes,br_out_bytes,br_in_packets,br_out_packets,relative) 
                	values ('${1900+baseStart.getYear()}-${1+baseStart.getMonth()}-${baseStart.getDate()}'
                        	,${stats.enp[0]},${stats.enp[1]}
                                ,${stats.enp[3]},${stats.enp[4]}
                        	,${stats.br0[0]},${stats.br0[1]}
                                ,${stats.br0[3]},${stats.br0[4]},0)`);
        	base = stats;
                baseStart = new Date();               
        }
        return stats;
}

function restorePrior() {
	var lastRec = db.do( "select * from traffic_stats where relative=0 order by date desc limit 1" );
        lastRec = lastRec[0];
        var rec={ enp: [lastRec.in_bytes,
                	lastRec.out_bytes,,
                	lastRec.in_packets,
                	lastRec.out_packets,,],
                he: [ 0,0,,0,0,,],
                br0:[ lastRec.br_in_bytes,
                	lastRec.br_out_bytes,,
                	lastRec.br_in_packets,
                	lastRec.br_out_packets,,]
        	};
        rec.enp[2] = rec.enp[0] + rec.enp[1];
        rec.enp[5] = rec.enp[3] + rec.enp[4];
        rec.he[2] = rec.he[0] + rec.he[1];
        rec.he[5] = rec.he[3] + rec.he[4];
        rec.br0[2] = rec.br0[0] + rec.br0[1];
        rec.br0[5] = rec.br0[3] + rec.br0[4];
	{
        	var parts = lastRec.date.split('-');
                var date = new Date( parts[0], parseInt(parts[1])-1, parseInt(parts[2])+1 );
                baseStart = date;
        }
        base = rec;
        //console.log( "read:", baseStart, baseStart.getDate(), (new Date()).getDate() );
        //console.log( "read:", lastRec );
        //console.log( "conv:", rec );
}

function readCounters() {
	var stats = readAll();
if(false) {
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
                
	var records = db.do( 'select * from traffic_stats order by date');
        console.log( "data:\n", records );
}
	setTimeout( readCounters, 300000 );
}

restorePrior();
readCounters();
