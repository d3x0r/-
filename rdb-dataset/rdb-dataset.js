// Relational Data Base - Data Set 
//
// Provides mapping of related SQL tables.  
// Table schema representation
//
// var rdb = rdb.DataSet();
// rdb.Table( "tableName" );
// rdb.tableName.Column( { ... Column Definition ... } );
// rdb.Table( "Table Name" );  // not the preferred usage.
// rdb["Table Name"].Column( { ... Column Definition ... } );  // not the preferred usage.
//
//
//  Column Definition
//   name : column name
//   type : column type + precision
//   defaultValue : default value
//   allowNul : specifically allow NULL, else NOT NULL is built into table definition
//   foreign : {        foreign key (single column) 
//        table : table name this column references
//        column : column name this column references
//        onUpdate: constants.Delete .... 
//        onDelete:
//   }
//   primaryKey : column is the primary key  (auto increment) of this table
//   autoKey : (callback)  this is called when the value for a new row is needed.
//   unique :  column should be unqiue
//   
//   
//   


const constants = {
	NoAction : 1,
	Cascade : 2,
	SetNull : 3,
	SetDefault : 4,
	Restrict : 5,
};

module.exports = exports = {
   constants : constants,
   DataSet: DataSet,
  DataTable : DataTable,
  DataColumn : DataColumn,
}

	function singularize( string ) {
		if( string.endsWith( "ies" ) )
        		return string.substr( 0, string.length-3 ) + "y";
		//if( string.endsWith( "es" ) )
        	//	return string.substr( 0, string.length-1 );
		if( string.endsWith( "s" ) )
        		return string.substr( 0, string.length-1 );
		return string;
	}
        

function DataSet() {
	var ds = {
        	prefix : ""
                , name : ""
		, tables : []
        	, Table : Table
		, push : push
        }
        function Table( name ) {
        	var table = DataTable( name );
		return this.push( table );
        }
	function push( table ) {
        	ds.tables.push( table );
		ds[table.name] = table;
                table.dataSet = ds;
                return table;
	}
        return ds;
}

function newRow( table ) {
	var row = Object.assign( {}, table.rowProto );
	row.table = table;
	//console.log( "NEW ROW" );
	table.columns.forEach( (col,idx)=>{
		var value = col.defaultValue
		if( col.autoKey )
			value = col.autoKey();
		
		//console.log( "For the record; value is:", value );
		row._cells.push( DataCell( row, value ) );
		//console.log( "new property: ", col.name );
		Object.defineProperty( row, col.name, {
			enumerable : true,
			
			get () {
				//console.log( "THIS:", idx, row._cells[idx] );
				return row._cells[idx].Value;
			},
			set (value) {
				//console.log( "This should also be setting value...", idx, value );
				row._cells[idx].Value = value;
			}
		} ); 
		//row[col.name] = value;
	} );
	return row;
}

function mapHistory( row ) {
	var fields = Object.keys( row );
	var history = {};
	//historyData.push( history );
	fields.forEach( (field)=>{
		history[field] = { values:[row[field]], current : 0 };
	});
	return row;
}

function DataCell( row, value ) {
	return {
		events : {},
		on(event,handler) {
			if( typeof handler === "function" ) {
				if( event in events ) events[event].push( handler );
				else events[event] = [handler];
			} else {
				if( event in events ) events[event]( handler );
			}
		},
		row: row,
		versions : 0,
		history : [ value ],
		value : value,
		get Value() {
			return this.value;
		},
		set Value(value) {
			console.log( "Data Cell has data change" );
			if( this.value === value ) return;
			this.history.push( this.value = value );
			this.on( "changed", value );
		},
		get versions() {
			return this.history.length;
		},
		get Values() {
			return this.history;
		},
		revert() {
			if( this.history.length > 1 ) {
				this.value = this.history[0];
				this.history.length = 1;
				this.on( "changed", value );
			}
		},
		commit() {
			if( this.history.length > 1 ) {
				this.history[0] = this.value = this.history[this.history.length-1];
				this.history.length = 1;
				this.on( "changed", value );
			}
		}
	}
}

function DataTable( tableName ) {
	var historyData = [];
        var rowData = []; // private variable for row data.
	var tableObject = { 
        	prefix : ""
        	, name : tableName
		, dataSet : null
		, get fullName() {
			return this.dataSet.prefix + this.dataSet.name + this.prefix + this.name;
		}
        	, columns : []
		, changedRows : []
                , get rows() {
			 return {
				get value()  {
					return rowData;
				}
			}
		}
                , rowProto : {
			_rowState : 0,
			_cells : [],
			table : null,
		}
                , Row( data ) { 
			var dataKeys = Object.keys( data );
			var row = newRow( this );
			dataKeys.forEach( field=> {
				console.log( "Override old values with:", field, data[field] );
				newRow[field] = data[field];
			} );
			rowData.push( row );
			historyData.push( mapHistory(row) );
			this.changedRows.push( row );
			return row;			
		}
                , Column : function( def ) { 
	        	if( def.isName )
        	        	def.name = singularize( this.name ) + "_name";
	        	else if( !def.hasOwnProperty( "name" ) )
        	        	def.name = singularize( this.name ) + "_id";
			if( !this.rowProto.table )
				this.rowProto.table = this;
			this.rowProto[def.name] = def.defaultValue;
			var column = DataColumn( def );
			this.columns.push( column );
			this[def.name] = column;
			return column;
		}
		, Fill( db, condition ) {
			rowData = db.do( "select * from [${this.name}]" + condition?"WHERE "+condition:"" );
			historyData = rowData.map( mapHistory );
			this.rows = rowData.map( (row)=>{
				return row;
			} );
		}
		, commit() {
			this.changedRows.forEach( row => row.commit() );
			this.changedRows.length = 0;
		}
		, reject() {
			this.changedRows.forEach( row => row.reject() );
			this.changedRows.length = 0;
		}
		, getCreate() {
			var stmt = "CREATE TABLE [" + this.name + "](";
			this.columns.forEach( (col,idx)=>{
				var t = col.type;
				if( t == 'guid' ) {
					t = "char";
				}
				if( t == 'decimal' ) {
					t = "float";
				}
				if( idx > 0 ) stmt += ",";
				stmt += (col.name + " " + t 
					+ ( ("defaultValue" in col)?" "  + col.defaultValue:"") 
					+ (col.allowNull?"" : " NOT NULL" )
					+ (col.primaryKey?" PRIMARY KEY":"" ) );
				
			} );
			this.columns.forEach( (col,idx)=>{
				if( col.foreign ) {
					//if( col.foreign.
					// some databases require constraint before foriegn key
					// stmt += "CONSTRAINT '" + "SomeNameHere" + "' ";			
					stmt += ",";
					stmt += "FOREIGN ([" + col.name + "])REFERENCES [" + col.foreign.table + "]([" + col.foreign.column + "])";
					switch( col.foreign.onDelete ) {
					case constants.NoAction:
						stmt += " ON DELETE NO ACTION";
						break;
					case constants.Cascade:
						stmt += " ON DELETE CASCADE";
						break;
					case constants.SetNull:
						stmt += " ON DELETE SET NULL";
						break;
					case constants.SetDefault:
						stmt += " ON DELETE SET DEFAULT";
						break;
					case constants.Restrict:
						stmt += " ON DELETE RESTRICT";
						break;
					}
					switch( col.foreign.onUpdate ) {
					case constants.NoAction:
						stmt += " ON UPDATE NO ACTION";
						break;
					case constants.Cascade:
						stmt += " ON UPDATE CASCADE";
						break;
					case constants.SetNull:
						stmt += " ON UPDATE SET NULL";
						break;
					case constants.SetDefault:
						stmt += " ON UPDATE SET DEFAULT";
						break;
					case constants.Restrict:
						stmt += " ON UPDATE RESTRICT";
						break;
					}
				}
			} );
			stmt += ")  -- extra";
			return stmt;
		}
        }
        return tableObject;
}

function DataColumn( coldef ) {
	return Object.assign( {}, coldef );
}


