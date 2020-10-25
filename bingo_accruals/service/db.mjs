

/* 
 *
 *

Table structure
  - There came to be a variatin 'accrual_group_input_id' and 'accrual_input_group_id' ...


- accrual_input_groups 
   - This is the names of inputs that go into groups; they are clocks that tick a value.

- accrual_groups
   - this is the defition of prize by name.
   - tables
     - accruals
        - accrual_house
        - accrual_kitty
     - accrual_group_inputs - relates accrual_group_id and accrual_input_group_id as accrual_group_input_id

*/

const debug_ = false;
const debugVerbose_ = false;
const hardReset = false;

const reset = false;
const useMySQL = true;

import sack from "sack.vfs";
//var sack = require( "sack.vfs" );

var idGen = ()=> sack.SaltyRNG.id(4).substr( 0, 16 );

//var vol = sack.Volume( "db", "accruals.dat", "key1", "key2" );
//var db = vol.Sqlite( "bingo_accruals.db" );
var db = sack.Sqlite( "nodeTest" );

db.function( "UID", ()=>{ return idGen(); } );

function initTables()  {
	const keyDefault = useMySQL ? "" : " DEFAULT (UID())";
	const keyType = useMySQL ? " char(44)" : "";
	const nameType = useMySQL ? " char(64)" : "";
	const nameUnique = useMySQL ? " UNIQUE" : " CONSTRAINT nameKey UNIQUE ON CONFLICT FAIL";

	if( hardReset ) {
		db.do( "drop database nodeTest" );
		db.do( "create database nodeTest" );
		db.do( "use nodeTest" );
	}

	if( reset ) {
		db.do( "drop table if exists accrual_kitty" );
		db.do( "drop table if exists accrual_house" );
		db.do( "drop table if exists accrual_input" );
		db.do( "drop table if exists accrual_payouts" );
		db.do( "drop table if exists accruals" );
		db.do( "drop table if exists accrual_group_inputs" );
		db.do( "drop table if exists accrual_group_activations" );
		db.do( "drop table if exists accrual_groups" );
		db.do( "drop table if exists accrual_activities" );
		db.do( "drop table if exists accrual_input_groups" );
		process.exit(0);
	}

	debugVerbose_ && console.log( db.do( "show tables" ) );

	db.makeTable( "create table accrual_activities (  accrual_activity_id" + keyType + " PRIMARY KEY" + keyDefault + ", \
			name" + nameType + nameUnique + " \
			  )" );


	// , daily, weekly, weekly_day,
	db.makeTable( "create table accrual_input_groups( accrual_input_group_id" + keyType + " PRIMARY KEY" + keyDefault + ", \
			name" + nameType + nameUnique + ", \
			defaultAmount int default 0, \
			fixedAmount int  default 0, \
			scalePrice int  default 0, \
			minimum int default 0, \
			useMinimum int(1) default 0,     \
			useScalePrice int(1) default 0, \
			useDefault int(1) default 0, \
			isDaily int(1) default 0,      \
			isWeekly int(1) default 0,     \
			isIncrements int(1) default 0, \
			sqlStatement char(1024) default 0 \
			)" ) 

	db.makeTable( "create table accrual_input( accrual_input_id" + keyType + " PRIMARY KEY" + keyDefault + ", \
			accrual_input_group_id" + keyType + ",  \
			inputTime datetime,      \
			amount int,              \
			borrowed_amount int,              \
			accrual_group_house_id" + keyType + ",  \
			accrual_group_kitty_id" + keyType + ",  \
			 \
	        	FOREIGN KEY (accrual_input_group_id) REFERENCES accrual_input_groups(accrual_input_group_id) ON DELETE CASCADE ON UPDATE CASCADE \
			)" )
	db.makeTable( "create table accrual_groups( accrual_group_id" + keyType + " PRIMARY KEY " + keyDefault + ", \
	        	name" + nameType + nameUnique + ", pricePerPack int, \
			everyTally int(1), startingValue int, \
			housePercent int DEFAULT 0, \
			last_accrual_set_id " + keyType + ", \
			last_accrual_id " + keyType + "  \
		 )" )

	db.makeTable( "create table accrual_activation (  accrual_activity_id" + keyType + ",  \
			accrual_group_id " + keyType + ", \
			rowOrder int default 0, \
        		CONSTRAINT activation_activity_fk FOREIGN KEY (accrual_activity_id) REFERENCES accrual_activities(accrual_activity_id) ON DELETE CASCADE ON UPDATE CASCADE, \
			CONSTRAINT activation_group_fk FOREIGN KEY (accrual_group_id) REFERENCES accrual_groups(accrual_group_id) ON DELETE CASCADE ON UPDATE CASCADE \
			  )" );


	db.makeTable( "create table accrual_group_inputs( accrual_group_id" + keyType + ", accrual_input_group_id" + keyType + ",   \
			gain int default ( 10000 ), \
			UNIQUE  keypair ( accrual_group_id, accrual_input_group_id ),  \
	        	CONSTRAINT group_input_input_group_fk FOREIGN KEY (accrual_input_group_id) REFERENCES accrual_input_groups(accrual_input_group_id) ON DELETE CASCADE ON UPDATE CASCADE, \
	        	CONSTRAINT group_input_group_fk FOREIGN KEY (accrual_group_id) REFERENCES accrual_groups(accrual_group_id) ON DELETE CASCADE ON UPDATE CASCADE \
		)" );

	db.makeTable( "create table accrual_kitty ( id" + keyType + " PRIMARY KEY" + keyDefault + ",accrual_group_id" + keyType + ", \
		  accrual_id" + keyType + " UNIQUE, delta int, total int, \
        	CONSTRAINT kitty_group_fk FOREIGN KEY (accrual_group_id) REFERENCES accrual_groups(accrual_group_id) ON DELETE CASCADE ON UPDATE CASCADE \
                )" );
		  
	db.makeTable( "create table accrual_house ( id" + keyType + " PRIMARY KEY" + keyDefault + ",accrual_group_id" + keyType + ", \
		 accrual_id" + keyType + " UNIQUE, delta int, total int, \
		transaction_type_id int, trancation_type char(16), \
        	CONSTRAINT house_group_fk FOREIGN KEY (accrual_group_id) REFERENCES accrual_groups(accrual_group_id) ON DELETE CASCADE ON UPDATE CASCADE \
                )" );

	db.makeTable( "create table accrual_sets ( accrual_set_id" + keyType + " PRIMARY KEY" + keyDefault + ", accrual_group_id" + keyType + ", \
			prior_accrual_id" + keyType + ",  \
			'date' DATE,  \
			posted int(1), closed int(1),      \
			updateTime DATETIME, \
        	constraint set_group_fk FOREIGN KEY (accrual_group_id) REFERENCES accrual_groups(accrual_group_id) ON DELETE CASCADE ON UPDATE CASCADE \
                )" );

	db.makeTable( "create table accruals ( accrual_id" + keyType + " PRIMARY KEY" + keyDefault + ", accrual_group_id" + keyType + ", \
			prior_accrual_id" + keyType + ",  \
			accrual_set_id" + keyType + ",   \
			'primary_start' int default 0, 'secondary_start' int default 0,'tertiary_start' int default 0,  \
			'primary_end' int default 0, 'secondary_end' int default 0,'tertiary_end' int default 0, \
			posted int(1), closed int(1),      \
			        	\
        	CONSTRAINT accrual_group_fk FOREIGN KEY (accrual_group_id) REFERENCES accrual_groups(accrual_group_id) ON DELETE CASCADE ON UPDATE CASCADE \
                )" );

	db.makeTable( "create table accrual_inputs ( accrual_inputs_id" + keyType + " PRIMARY KEY" + keyDefault + ", \
			accrual_id" + keyType + ",  \
			accrual_input_id" + keyType + ",  \
			portionUsed int default 0, \
	        	CONSTRAINT input_input_fk FOREIGN KEY (accrual_input_id) REFERENCES accrual_input(accrual_input_id) ON DELETE CASCADE ON UPDATE CASCADE, \
	        	CONSTRAINT input_accrual_fk1 FOREIGN KEY (accrual_id) REFERENCES accruals(accrual_id) ON DELETE CASCADE ON UPDATE CASCADE \
		)" );

        db.makeTable( "create table accrual_group_percents( accrual_group_id" + keyType + ",row_order int, threshold int, primary_percent int, secondary_percent int, tertiary_percent int, house int, kitty int, \
		constraint group_percent_pk unique key(accrual_group_id,row_order)  \
		 )" );
        db.makeTable( "create table accrual_payouts( accrual_payout_id" + keyType + " PRIMARY KEY" + keyDefault + " \
        	)" );
        
        var asdf;
}


initTables();



function loadAccruals( cb ) {
	var accruals = {
        	activities : [],
            groups : [],
			inputs : [],
			activity(id) {
				return this.activities.find(o=>o.accrual_activity_id===id );
			},
			group(id) {
				return this.groups.find(o=>o.accrual_group_id===id );
			},
			input(id) {
				return this.inputs.find(o=>o.accrual_input_group_id===id );
			},
        }
        
        accruals.activities = db.do( "select * from accrual_activities" );
        accruals.activities.forEach( activity=>{
        	activity.groups = [];
        	activity.inputs = [];
        } );
        accruals.groups= db.do( "select * from accrual_groups" );
        accruals.groups.forEach( group=>{
        	group.activities = [];
                group.inputs = [];
                group.thresholds = [];
        } );
        
        accruals.inputs = db.do( "select * from accrual_input_groups" );
console.log( "RELOADED:", accruals.inputs );
        accruals.inputs.forEach( input=>{
        	input.groups = [];
        	input.activities = [];
		} );
		
		var activations = db.do( "select * from accrual_activation" );
		//console.log( "activations:", activations );
        activations.forEach( active=>{
        	var group = accruals.group( active.accrual_group_id );
        	var activity = accruals.activity( active.accrual_activity_id );
            group.activities.push( activity );
            activity.groups.push( group );
		} );
		

        var group_inputs = db.do( "select * from accrual_group_inputs" );
        group_inputs.forEach( input=>{        	
        	var group = accruals.group( input.accrual_group_id );
        	var input = accruals.input( input.accrual_input_group_id );
                group.inputs.push( input );
				input.groups.push( group );
				
                group.activities.forEach( activity=>{
                	if( !activity.inputs.find( testInput=>testInput===input ) )
                       	activity.inputs.push( input );
                } );
        } );

	var percents = db.do( "select * from accrual_group_percents" );
        percents.forEach( percent=>{
        	var group = accruals.groups.find( group=>group.accrual_group_id=percent.accrual_group_id );
                group.thresholds.push( percent );
        } );
        cb(accruals);
}

function terminate() {
	console.log( "A database makes an event loop" );
//terminate();
	db.close();
}


function dateStr(date) {
			var tzo = -date.getTimezoneOffset(),
				dif = tzo >= 0 ? '+' : '-',
				pad = function(num) {
					var norm = Math.floor(Math.abs(num));
					return (norm < 10 ? '0' : '') + norm;
				};
			return [date.getFullYear() ,
				'-' , pad(date.getMonth() + 1) ,
				'-' , pad(date.getDate()) ,
				'T' , pad(date.getHours()) ,
				':' , pad(date.getMinutes()) ,
				':' , pad(date.getSeconds()) ,
				dif , pad(tzo / 60) ,
				':' , pad(tzo % 60)].join("");
		} 




function createHouse( baseAccrual ) {
	do {
		var house = db.do( "select total,total-delta as prior_total from accrual_house where accrual_id=?", baseAccrual.accrual_id );
		if( !house ){
			baseAccrual = baseAccrual.prior || ( baseAccrual.prior = dbInterface.loadAccrualRecord( baseAccrual.prior_accrual_id ) );
		}	
			else break;
	} while( true );
		
	if( house ) {
		var newHouse = Object.assign( {}, house[0] );
		newHouse.accrual_house_id = idGen();
		//newHouse.accrual_id = 
		newHouse.prior_total = total;
		return newHouse;
	}
}

function createKitty( baseAccrual ) {
	do {
		var house = db.do( "select total,total-delta as prior_total from accrual_house where accrual_id=?", baseAccrual.accrual_id );
		if( !house ){
			baseAccrual = baseAccrual.prior || ( baseAccrual.prior = dbInterface.loadAccrualRecord( baseAccrual.prior_accrual_id ) );
		}	
			else break;
	} while( true );
		
	if( house ) {
		var newHouse = Object.assign( {}, house[0] );
		newHouse.accrual_house_id = idGen();
		//newHouse.accrual_id = 
		newHouse.prior_total = total;
		return newHouse;
	}
}

function activity(row) {
	row.groups = [];
	row.inputs = [];
	return row;
}
function group(row) {
	row.activities = [];
	row.inputs = [];
	return row;
}
function input(row) {
	row.activities = [];
	row.groups = [];
	return row;
}

const dbInterface = {
	createActivity( name ) {	
		var existing = db.do( "select * from accrual_activities where name=?", name );
		if( existing && existing.length ) return false;//activity(existing[0]);
		var newId = idGen();
		if( !db.do( "insert into accrual_activities( accrual_activity_id, name ) values ( ?, ? ) ", newId, name ) ) {
			
			var err = db.error;
			console.log( "Insert failed:", err );
			throw new Error( err );
		}
		return activity( db.do( "select * from accrual_activities where accrual_activity_id=?", newId )[0] );

	},	
	updateActivity(activity) {
		db.do( "update accrual_activities set name=? where accrual_activity_id=?"
			, activity.name, activity.accrual_activity_id
		)
	},
	createInput( name ) {	
		var existing = db.do( "select * from accrual_input_groups where name=?", name );
		if( existing && existing.length ) return false;//return input(existing[0]);
		var newId = idGen();
		if( !db.do( "insert into accrual_input_groups( accrual_input_group_id, name ) values ( ?, ? ) ", newId, name ) ) {
			
			var err = db.error;
			console.log( "Insert failed:", err );
			throw new Error( err );
		}
		return input(db.do( "select * from accrual_input_groups where accrual_input_group_id=?", newId )[0]);
	},
	updateInput(input) {
		console.log( "Update input:", input );
		db.do( "update accrual_input_groups set name=?,defaultAmount=?,fixedAmount=?,isDaily=?,isIncrements=?,isWeekly=?,minimum=?,useMinimum=?,sqlStatement=? where accrual_input_group_id=?"
			, input.name, input.defaultAmount, input.fixedAmount, input.isDaily
			, input.isIncrements, input.isWeekly, input.minimum, input.useMinimum
			, input.sqlStatement
			, input.accrual_input_group_id
		)
	},
	createGroup( name ) {
		var existing = db.do( "select * from accrual_groups where name=?", name );
		if( existing && existing.length ) return false;//return group(existing[0]);
		var newId = idGen();
		if( !db.do( "insert into accrual_groups( accrual_group_id, name ) values ( ?, ? ) ", newId, name ) ) {
			var err = db.error;
			console.log( "Insert failed:", err );
			throw new Error( err );
		}
		return group(db.do( "select * from accrual_groups where accrual_group_id=?", newId )[0]);
	},
	updateGroup(group) {
		db.do( "update accrual_groups set name=?,everyTally=?,housePercent=?,startingValue=? where accrual_group_id=?",
			group.name, group.everyTally, group.housePercent, group.startingValue, group.accrual_group_id
		)
	},

	assignGroup( activity, group ) {
		db.do( "replace into accrual_activation (accrual_activity_id,accrual_group_id) values (?,?)", activity.accrual_activity_id, group.accrual_group_id );
		if( debug_) return db.do( "select * from accrual_activation where accrual_group_id=? and accrual_activity_id = ?", group.accrual_group_id, input.accrual_activity_id )[0];
	},
	unassignGroup( activity, group ) {
		db.do( "delete from accrual_activation where accrual_activity_id=? and accrual_group_id=?", activity.accrual_activity_id, group.accrual_group_id );
	},

	assignInput( group, input ) {
		db.do( "replace into accrual_group_inputs (accrual_group_id,accrual_input_group_id) values (?,?)", group.accrual_group_id, input.accrual_input_group_id );
		if( debug_) return db.do( "select * from accrual_group_inputs where accrual_group_id=? and accrual_input_group_id = ?", group.accrual_group_id, input.accrual_input_group_id )[0];
	},
	unassignInput( group, input ) {
		db.do( "delete from accrual_group_inputs where accrual_input_group_id=? and accrual_input_group_id=?", group.accrual_group_id, input.accrual_input_group_id );
	},

	getThresholds( group ) {
		return db.do( "select * from accrual_group_percents where accrual_group_id=? order by row_order", group.accrual_group_id );
	},
	setThreshold( group, row_id, threhold ) {
		db.do( "replace into accrual_group_percents where accrual_group_id=? and row_order=? (threhold,primary_percent,secondary_percent,tertiary_percent,house,kitty) values (?,?,?,?,?,?)"
			, group.accrual_group_id, row_id,threshold.threshold, threshold.primary_percent, threshold.secondary_percent, threshold.tertiary_percent, threshold.house, threshold.kitty );
	},
	clearThresholds( group, last_row_id ) {
		db.do( "delete from accrual_group_percents where accrual_group_id=? and row_order>?"
			, group.accrual_group_id, row_id );
	},

	processActivity( activity ) {
	},
        loadAccruals: loadAccruals,

	loadAccrual( group ) {
		//var last = db.do( "select lastAccrual from accrual_groups where accrual_group_id=?", group.accrual_group_id );
			if( group.lastAccrual ) {
				var lastRecord = db.do( "select * from accruals where accrual_id=?", last[0].lastAccrual );
				
			} else {
				var newId;
				db.do( "insert into accruals (accrual_id) values (?)", newId = idGen() );
				db.do( "select * from accruals where accrual_id=?", newId );
				db.do( "update accrual_groups set lastAccrual=? where accrual_group_id=?", newId, group.accrual_group_id );
				group.lastAccrual = newId;
			}
	},
	loadPriorAccrualRecord( accrual ) {
		//var last = db.do( "select lastAccrual from accrual_groups where accrual_group_id=?", group.accrual_group_id );
			if( group.lastAccrual ) {
				var lastRecord = db.do( "select * from accruals where accrual_id=?", last[0].lastAccrual );
				
			} else {
				var newId;
				db.do( "insert into accruals (accrual_id) values (?)", newId = idGen() );
				db.do( "select * from accruals where accrual_id=?", newId );
				db.do( "update accrual_groups set lastAccrual=? where accrual_group_id=?", newId, group.accrual_group_id );
				group.lastAccrual = newId;
			}
	},
	storeAccrual( accrual ) {
		db.do( "replace into accruals(accrual_id,accrual_group_id,primary_start,primary_end,secondary_start,secondary_end,tertiary_start,tertiary_end,updateTime,posted,closed) values (?,?,?,?,?,?,?,?,?,?,?)"
			, accrual.accrual_id
			, accrual.accrual_group_id
			, accrual.primary_start
			, accrual.primary_end
			, accrual.secondary_start
			, accrual.secondary_end
			, accrual.tertiary_start
			, accrual.tertiary_end
			, accrual.updateTime
			, accrual.posted
			, accrual.closed );
	},
	assignInput( group, input ) {
		db.do( "replace into accrual_group_inputs (accrual_group_id,accrual_input_group_id) values (?,?)", group.accrual_group_id, input.accrual_input_group_id );
		if( debug_) return db.do( "select * from accrual_group_inputs where accrual_group_id=? and accrual_input_group_id = ?", group.accrual_group_id, input.accrual_input_group_id )[0];
	},
	newAccrual( accrual ) {
		var newAccrual = Object.assign( {}, accrual );
			
		newAccrual.input = 0;
		newAccrual.primary_start = newAccrual.primary_end;
		newAccrual.secondary_start = newAccrual.secondary_end;
		newAccrual.tertiary_start = newAccrual.tertiary_end;
		newAccrual.date = new Date();
		newAccrual.accrual_id = idGen();

	},
	

		
}

export {dbInterface as db};

/*
import {Module} from "module";

console.log( "Test:", process.argv[1] === import.meta, process.argv[1], import.meta.url );
console.log( "Magic:", sack.JSOX.stringify(global.module))
console.log( "Module:", sack.JSOX.stringify( process) );
*/
const runTest = false;
if( runTest ) {
	function test() {
		console.log( "Genereating some test garbage" );

		dbInterface.loadAccruals( (accruals)=>{
			
			var ballcount = accruals.inputs.find(i=>i.name==="Ball Ticker") || dbInterface.createInput( "Ball Ticker" );
			var validations = accruals.inputs.find(i=>i.name==="Validations") || dbInterface.createInput( "Validations" );
			var packs = accruals.inputs.find(i=>i.name==="Better Action Pack Count") || dbInterface.createInput( "Better Action Pack Count" );
			
			console.log( "Erm?", ballcount );
			console.log( "Erm?", packs );
			var group;
			console.log( "Group", group = dbInterface.createGroup( "Sunday Jackpot" ) );

			console.log( "Assignment:", dbInterface.assignInput( group, packs ) );
			

			var activity = dbInterface.createActivity( "Schedule 1" );
		} );
	}
	test();
//	dbInterface.Create

}