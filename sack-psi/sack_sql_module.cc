
#include "global.h"
#include <pssql.h>
#include <sqlgetoption.h>
//#include 

Persistent<Function> SqlObject::constructor;

//-----------------------------------------------------------
//   SQL Object
//-----------------------------------------------------------


void SqlObject::Init( Handle<Object> exports ) {
	Isolate* isolate = Isolate::GetCurrent();

	Local<FunctionTemplate> sqlTemplate;
	// Prepare constructor template
	sqlTemplate = FunctionTemplate::New( isolate, New );
	sqlTemplate->SetClassName( String::NewFromUtf8( isolate, "sack.Sqlite" ) );
	sqlTemplate->InstanceTemplate()->SetInternalFieldCount( 7 );  // have to add 1 implicit constructor.

	// Prototype
	NODE_SET_PROTOTYPE_METHOD( sqlTemplate, "do", query );
	NODE_SET_PROTOTYPE_METHOD( sqlTemplate, "op", option );
	NODE_SET_PROTOTYPE_METHOD( sqlTemplate, "getOption", option );
	//NODE_SET_PROTOTYPE_METHOD( sqlTemplate, "so", setOption );
	NODE_SET_PROTOTYPE_METHOD( sqlTemplate, "so", setOption );
	NODE_SET_PROTOTYPE_METHOD( sqlTemplate, "setOption", setOption );
	//NODE_SET_PROTOTYPE_METHOD( sqlTemplate, "makeTable", makeTable );
	NODE_SET_PROTOTYPE_METHOD( sqlTemplate, "makeTable", makeTable );
	constructor.Reset( isolate, sqlTemplate->GetFunction() );
	exports->Set( String::NewFromUtf8( isolate, "Sqlite" ),
		sqlTemplate->GetFunction() );
}

//-----------------------------------------------------------

void SqlObject::New( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	if( args.IsConstructCall() ) {
		char *dsn;
		String::Utf8Value arg( args[0] );
		dsn = *arg;
		SqlObject* obj;
		if( args.Length() < 2 ) {
			obj = new SqlObject( dsn, isolate, args.Holder() );
		}
		else {
			obj = new SqlObject( dsn, isolate, args[1]->ToObject() );
		}
		obj->Wrap( args.This() );
		args.GetReturnValue().Set( args.This() );
	} else {
		const int argc = 2;
		Local<Value> argv[argc] = { args[0], args.Holder() };
		Local<Function> cons = Local<Function>::New( isolate, constructor );
		args.GetReturnValue().Set( cons->NewInstance( argc, argv ) );
	}
}

//-----------------------------------------------------------

void SqlObject::query( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();

	char *query;
	String::Utf8Value tmp( args[0] );
	query = StrDup( *tmp );


	SqlObject *sql = ObjectWrap::Unwrap<SqlObject>( args.This() );
	sql->fields = 0;
	if( !SQLRecordQuery( sql->odbc, query, &sql->columns, &sql->result, &sql->fields ) ) {
		const char *error;
		FetchSQLError( sql->odbc, &error );
		isolate->ThrowException( Exception::Error(
			String::NewFromUtf8( isolate, error ) ) );
		return;
	}
	if( sql->columns )
	{
		Local<Array> records = Array::New( isolate );
		Local<Object> record = Object::New( isolate );
		if( sql->result ) {
			int row = 0;
			do {
				record = Object::New( isolate );
				for( int n = 0; n < sql->columns; n++ ) {
					record->Set( String::NewFromUtf8( isolate, sql->fields[n] )
						, String::NewFromUtf8( isolate, sql->result[n] ) );
				}
				records->Set( row++, record );
			} while( FetchSQLRecord( sql->odbc, &sql->result ) );
		}
		args.GetReturnValue().Set( records );
	}
	else
	{
		SQLEndQuery( sql->odbc );
		args.GetReturnValue().Set( True( isolate ) );
	}
	Deallocate( char*, query );
}

//-----------------------------------------------------------


SqlObject::SqlObject( const char *dsn, Isolate* isolate, Local<Object> o ) 
{
   odbc = ConnectToDatabase( dsn );
   optionInitialized = FALSE;
}

SqlObject::~SqlObject() {
	CloseDatabase( odbc );
}

//-----------------------------------------------------------

void SqlObject::option( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();

	int argc = args.Length();
	char *sect;
	char *optname;
	char *defaultVal;

	if( argc > 0 ) {
		String::Utf8Value tmp( args[0] );
		defaultVal = StrDup( *tmp );
	}
	else
		defaultVal = "";

	if( argc > 1 ) {
		String::Utf8Value tmp( args[1] );
		sect = defaultVal;
		defaultVal = StrDup( *tmp );
	}
	else
		sect = NULL;

	if( argc > 2 ) {
		String::Utf8Value tmp( args[2] );
		optname = defaultVal;
		defaultVal = StrDup( *tmp );
	}
	else
		optname = NULL;

	TEXTCHAR readbuf[1024];

	SqlObject *sql = ObjectWrap::Unwrap<SqlObject>( args.This() );
	sql->fields = 0;

	if( !sql->optionInitialized ) {
		//SetOptionDatabaseOption( sql->odbc, 2 );
		sql->optionInitialized = TRUE;
	}

	SACK_GetPrivateProfileStringExxx( sql->odbc
		, sect
		, optname
		, defaultVal
		, readbuf
		, 1024
		, NULL
		, TRUE
		DBG_SRC
		);

	Local<String> returnval = String::NewFromUtf8( isolate, readbuf );
	args.GetReturnValue().Set( returnval );

	Deallocate( char*, optname );
	Deallocate( char*, sect );
	Deallocate( char*, defaultVal );
}

//-----------------------------------------------------------

void SqlObject::setOption( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();

	int argc = args.Length();
	char *sect;
	char *optname;
	char *defaultVal;

	if( argc > 0 ) {
		String::Utf8Value tmp( args[0] );
		defaultVal = StrDup( *tmp );
	}
	else
		defaultVal = "";

	if( argc > 1 ) {
		String::Utf8Value tmp( args[1] );
		sect = defaultVal;
		defaultVal = StrDup( *tmp );
	}
	else
		sect = NULL;

	if( argc > 2 ) {
		String::Utf8Value tmp( args[2] );
		optname = defaultVal;
		defaultVal = StrDup( *tmp );
	}
	else
		optname = NULL;

	TEXTCHAR readbuf[1024];

	SqlObject *sql = ObjectWrap::Unwrap<SqlObject>( args.This() );
	sql->fields = 0;

	SACK_WriteOptionString( sql->odbc
		, sect
		, optname
		, defaultVal
	);

	Local<String> returnval = String::NewFromUtf8( isolate, readbuf );
	args.GetReturnValue().Set( returnval );

	Deallocate( char*, optname );
	Deallocate( char*, sect );
	Deallocate( char*, defaultVal );
}

//-----------------------------------------------------------

void SqlObject::makeTable( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();

	int argc = args.Length();
	char *tableCommand;

	if( argc > 0 ) {
		PTABLE table;
		String::Utf8Value tmp( args[0] );
		tableCommand = StrDup( *tmp );

		SqlObject *sql = ObjectWrap::Unwrap<SqlObject>( args.This() );

		table = GetFieldsInSQLEx( tableCommand, false DBG_SRC );
		if( CheckODBCTable( sql->odbc, table, CTO_MERGE ) )
			args.GetReturnValue().Set( True(isolate) );
		args.GetReturnValue().Set( False( isolate ) );

		DestroySQLTable( table );
	}
	//args.GetReturnValue().Set( returnval );
	args.GetReturnValue().Set( False( isolate ) );
}

//-----------------------------------------------------------

