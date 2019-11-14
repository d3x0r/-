# rdb-dataset
Node JS Package for Relational DataBase Dataset

```
var rdb = require( "rdb-dataset" );
```

# RDB Interface

| type | Usage |
|-----|----|
| DataSet | This is a related set of tables.  
| Graph | This is a related set of nodes.  (basically an alias for DataSet).
| DataTable | This represents a SQL table with named columns and types for data | 
| DataColumn | This is a column in a DataTable; it's usually not utilized directly |

# RDB methods

| Method | Arguments | Description |
|----|:----:|----|
| stringify | DataSet or DataTable \[ , where \[, order by \]\] | returns a JSON string |
| parse | DataSet or DataTable \[ , where \[, order by \]\] | returns a JS object |
| write | DataSet or DataTable \[ , where \[, order by \]\]  | not really any storage... write to where?  Options to mark tables temp or non-writable? |

## DataSet/Graph methods

| Method | Arguments | Description |
|----|:----:|----|
| Table |  String:Table Name  | Create or get a table in the dataset.  This adds the member 'Table Name' to the dataset.  `dataset['Table Name']` |
| Class |  String:Class Identity  | Create a node type for use in the dataset.  Can used as a type in other classes; will create an edge. |
| Node |  String:Node Identity  | Create or get a graph root in the dataset.  This adds the member 'Node Identity' to the dataset.  `dataset['Node Identity']` |
| Relation | {property object with at least : Name, (Column(from), Column(to)) or (Columns(from),columns(to))} | Defines a relationship between tables (foreign keys) |

### DataSet properties

| Property | Type | Description |
|----|:----:|----|
| prefix | string | a prefix used on the table name when translating to the database; default blank |
| name | string | the name of this table; this should be variable name friendly; default blank |
| classes | array of Class | classes defined in this Graph |
| &lt;table names&gt;| DataTable | A table. |
| tables | \[ DataTable \] | An array of tables this dataset has. |
| &lt;relation names&gt;| DataRelation | A relation |
| relations | \[ DataRelation \] | An array of constraints this table has. |

prefix and name can be done to referenece server for prefix and database as name.    users,  transactions,  options etc... 
prefix could be used for tmp_users, tmp_transactions, tmp_options....


## DataTable methods

| Method | Arguments | Description |
|----|:----:|----|
| Column | { column defintion option object (see column properties for option values | Create a table in the dataset.  This adds the member 'Table Name' to the dataset.  `dataset['Table Name']` or dataset.tableName. (not sanitized; if you used a space, you'd have to reference as a string.
| Index | ... | (TBD) This is a way to define a multi-part index, or an index that includes multiple columns. ('Index,Constraint,Column,prefix,name,dataset' as constraint names)
| Constraint | .... | (TBD) Constraints on tables (can be foriegn key definitions, for multi-column relations).  Also specified things like UNIQUE.  do not use ('Index,Constraint,Column,prefix,name,dataset' as constraint names)
| push | { data row } | appends a row to a table. |
| commit | () | mark all changes, clear all historical marks; on this table |
| rollback | () | clear all changes, set all current values to initial values |



### DataTable properties

| Property | Type | Description |
|----|:----:|----|
| dataset | DataSet | the dataset this table is contained in |
| prefix | string | a prefix used on the table name when translating to the database |
| name | string | the name of this table; this should be variable name friendly |
| &lt;constraint names&gt;| DataConstraint | constraint.  
| constraints | \[ DataConstraint \] | An array of constraints this table has.
| &lt;index names&gt;| DataConstraint | constraint.  
| indexes | \[ DataConstraint \] | An array of constraints this table has.

### DataColumn properties

| Property | Type | Description |
|----|:----:|----|
| table | DataTable | The DataTable this column belongs to. |
| primaryKey | bool | is this the primary key? |
| unique | bool | is this unique? |
| precision | int | the optional precition of a type in SQL ... INT(precision) DATE(precision) |
| type | string | the type of this column (in abstract types.... should be SQL types for portability |
| default | value | An expression to use for the default value for the create or alter table |
| name | string | the name of this column.

## Usage

Track a set of data.  Data in dataset may have enough information to
create structures in a relational database.  Otherwise data can be
shipped and shared using JSON (PREVIOUSLY there was WriteXML in .NET).

```
{ 
dataset : {
	relation_delete_rules : { 
                none: 0
                , cascade : 1
                , setNull : 2
                , setDefault : 3
        }
	relation_update_rules : { none: 0, cascade : 1, setNull : 2, setDefault : 3 }
	row_version : { unchanged: 0, added : 1, modified : 2 }
        
	prefix : ""
	tables : [ {
        	tableName : ""
                prefix : ""
                dataset : {/*outer dataset*/}
                columns : [ {
                	name
                        type
                        precision
			unique
			primaryKey
			indexed
                        default } ]
                ${index.name}.rows : { binary_list(rows) }
                rows : [ {
                	table : { ... table... }
                	colname1 : val
                	colname2 : val
                	colname3 : val
                        /*
                        ${relation_name} : [ rows ]
                        ${relation_name} : rows
                        ...
                	data : [ {
                        	value : ...
                                , old_value : undefined
                                , version : unchanged
                                , ]
                        //datamap : []
                	} ]
                } ]
	relations : [ {
        	name : ""
                parent_table : ""
                parent_columns : []
                child_table : ""
                child_columns : []
                delete_rule : rdb.constants.[NoAction : 1,Cascade : 2,SetNull : 3,SetDefault : 4,Restrict : 5]

                update_rule : rdb.constants.[NoAction : 1,Cascade : 2,SetNull : 3,SetDefault : 4,Restrict : 5]
                } ]
	}
}



var ds = Dataset( );
var table = ds.addTable( "Tablename" );
var table2 = Table( "TableName2" ); ds.Tables.push( table2 );

table2.Columns.push( DataColumn( "name", "type" ) );
table2.Rows.push( ["jimmy"] );

```



```
var optiondb = rdb.DataSet();
optiondb.Table( "option_name" );

var col = optiondb.option_name.Column( { 
	type: "guid", 
	primaryKey : true, 
	autoKey : ()=>Math.random() 
} );
var namecol = optiondb.option_name.Column( { 
	isName : true, 
	type: "string", 
	unique : true 
} )

optiondb.Table( "option_map" );
var idcol = optiondb.option_map.Column( {
	type : "guid",
	primaryKey : true,
	autoKey : ()=>Math.random()
} );
var nameidx = optiondb.option_map.Column( {
	type : "guid",
	indexed : true,
	foreign: {
		table : optiondb.option_name,
		column: optiondb.option_name.id,
		onUpdate:rdb.constants.Cascade,
		onDelete:rdb.constants.Cascade
	}
} );
var parentidcol = optiondb.option_map.Column( {
	name : "parent_option_id",
	type : "guid",
	foreign: {
		table : optiondb.option_map,
		column: optiondb.option_map.id,
		onUpdate:rdb.constants.Cascade,
		onDelete:rdb.constants.Cascade
	}
} );

optiondb.Table( "option_value" );
optiondb.option_value.Column( {
	name : "option_id",
	type: "guid",
	foreign: {
		table : optiondb.option_map,
		column: optiondb.option_map.id,
		onUpdate:rdb.constants.Cascade,
		onDelete:rdb.constants.Cascade
	}
} );
optiondb.option_value.Column( {
	name : "number",
	type: "int"
} );


console.log(" So then we have:", optiondb.option_map.getCreate() )
console.log(" So then we have:", optiondb.option_name.getCreate() )
console.log(" So then we have:", optiondb.option_value.getCreate() )

var nameRow = optiondb.option_name.Row( { [namecol.name] : "first name" } );
var optionRow = optiondb.option_map.Row( { option_id : "0000", parent_option_id : "0000", option_name_id: nameRow.option_name_id } );


console.log( "then?", nameRow );
console.log( "then?", optionRow );

optiondb.getValue = function( path, Default ) { 
	var option_path = path.split( '/' );
        
}
```
