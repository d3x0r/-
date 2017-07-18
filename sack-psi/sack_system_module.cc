
#include "global.h"
#include <pssql.h>
#include <sqlgetoption.h>
//#include 

Persistent<Function> SystemObject::constructor;

//-----------------------------------------------------------
//   SQL Object
//-----------------------------------------------------------


void SystemObject::Init( Handle<Object> exports ) {
	Isolate* isolate = Isolate::GetCurrent();

	Local<FunctionTemplate> systemTemplate;
	// Prepare constructor template
	systemTemplate = FunctionTemplate::New( isolate, New );
	systemTemplate->SetClassName( String::NewFromUtf8( isolate, "sack.System" ) );
	systemTemplate->InstanceTemplate()->SetInternalFieldCount( 7 );  // have to add 1 implicit constructor.

	// Prototype
	NODE_SET_PROTOTYPE_METHOD( systemTemplate, "load", loadLibrary );

	constructor.Reset( isolate, systemTemplate->GetFunction() );
	exports->Set( String::NewFromUtf8( isolate, "Systemite" ),
		systemTemplate->GetFunction() );
}

//-----------------------------------------------------------

void SystemObject::New( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	if( args.IsConstructCall() ) {
		char *dsn;
		String::Utf8Value arg( args[0] );
		dsn = *arg;
		SystemObject* obj;
		if( args.Length() < 2 ) {
			obj = new SystemObject( dsn, isolate, args.Holder() );
		}
		else {
			obj = new SystemObject( dsn, isolate, args[1]->ToObject() );
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

void SystemObject::loadLibrary( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();



	args.GetReturnValue().Set( True( isolate ) );
}

//-----------------------------------------------------------


SystemObject::SystemObject( const char *dsn, Isolate* isolate, Local<Object> o ) 
{
}

SystemObject::~SystemObject() {
}

//-----------------------------------------------------------
//-----------------------------------------------------------

