
#include "global.h"

static struct local {
   PLIST volumes;
} l;


static void moduleExit( void *arg ) {
	InvokeExits();
}

void VolumeObject::Init( Handle<Object> exports ) {
	InvokeDeadstart();
	node::AtExit( moduleExit );
	{
		//extern void Syslog
	}
		Isolate* isolate = Isolate::GetCurrent();
		Local<FunctionTemplate> volumeTemplate;
		FileObject::Init();
		SqlObject::Init( exports );
		// Prepare constructor template
		volumeTemplate = FunctionTemplate::New( isolate, New );
		volumeTemplate->SetClassName( String::NewFromUtf8( isolate, "sack.vfs.Volume" ) );
		volumeTemplate->InstanceTemplate()->SetInternalFieldCount( 2 );

		// Prototype
		NODE_SET_PROTOTYPE_METHOD( volumeTemplate, "File", FileObject::openFile );
		//NODE_SET_PROTOTYPE_METHOD( volumeTemplate, "Sqlite", SqlObject::New );

		constructor.Reset( isolate, volumeTemplate->GetFunction() );
		exports->Set( String::NewFromUtf8( isolate, "Volume" ),
			volumeTemplate->GetFunction() );
	}

VolumeObject::VolumeObject( const char *mount, const char *filename, const char *key, const char *key2 )  {
	vol = sack_vfs_load_crypt_volume( filename, key, key2 );
	sack_mount_filesystem( mount, sack_get_filesystem_interface( SACK_VFS_FILESYSTEM_NAME )
			, 2000, (uintptr_t)vol, TRUE );
}


void logBinary( char *x, int n )
{
	int m;
	for( m = 0; m < n; ) {
		int o;
		for( o = 0; o < 16 && m < n; o++, m++ ) {
			printf( "%02x ", x[m] );
		}
		m -= o;
		for( o = 0; o < 16 && m < n; o++, m++ ) {
			printf( "%c", (x[m]>32 && x[m]<127)?x[m]:'.' );
		}
	}
}

	void VolumeObject::New( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.IsConstructCall() ) {
			char *mount_name;
			char *filename = "default.vfs";
			char *key = NULL;
			char *key2 = NULL;
			int argc = args.Length();
			if( argc > 0 ) {
				String::Utf8Value fName( args[0]->ToString() );
				mount_name = StrDup( *fName );
			}
			if( argc > 1 ) {
				String::Utf8Value fName( args[1]->ToString() );
				filename = StrDup( *fName );
			}
			if( argc > 2 ) {
				String::Utf8Value k( args[2] );
				key = StrDup( *k );
			}
			if( argc > 3 ) {
				String::Utf8Value k( args[3] );
				key2 = StrDup( *k );
			}
			// Invoked as constructor: `new MyObject(...)`
			VolumeObject* obj = new VolumeObject( mount_name, filename, key, key2 );
			obj->Wrap( args.This() );
			args.GetReturnValue().Set( args.This() );

			Deallocate( char*, mount_name );
			Deallocate( char*, filename );
			Deallocate( char*, key );
			Deallocate( char*, key2 );
		}
		else {
			// Invoked as plain function `MyObject(...)`, turn into construct call.
			int argc = args.Length();
		   Local<Value> *argv = new Local<Value>[argc];
			for( int n = 0; n < argc; n++ )
            argv[n] = args[n];

			Local<Function> cons = Local<Function>::New( isolate, constructor );
			args.GetReturnValue().Set( cons->NewInstance( argc, argv ) );
         delete argv;
		}
	}


void FileObject::Emitter(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = Isolate::GetCurrent();
	//HandleScope scope;
	Handle<Value> argv[2] = {
		v8::String::NewFromUtf8( isolate, "ping"), // event name
		args[0]->ToString()  // argument
	};

	node::MakeCallback(isolate, args.This(), "emit", 2, argv);
}


void FileObject::readFile(const FunctionCallbackInfo<Value>& args) {

}

void FileObject::writeFile(const FunctionCallbackInfo<Value>& args) {

}

void FileObject::seekFile(const FunctionCallbackInfo<Value>& args) {

}


	void FileObject::Init(  ) {
		Isolate* isolate = Isolate::GetCurrent();

		Local<FunctionTemplate> fileTemplate;
		// Prepare constructor template
		fileTemplate = FunctionTemplate::New( isolate, openFile );
		fileTemplate->SetClassName( String::NewFromUtf8( isolate, "sack.vfs.File" ) );
		fileTemplate->InstanceTemplate()->SetInternalFieldCount( 13 );

		// Prototype
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "read", readFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "write", writeFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "seek", seekFile );
		// read stream methods
		//NODE_SET_PROTOTYPE_METHOD( fileTemplate, "dir", getDirectory );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "pause", openFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "resume", openFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "setEncoding", openFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "unpipe", openFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "unshift", openFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "wrap", openFile );
		// write stream methods
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "cork", openFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "uncork", openFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "end", openFile );
		NODE_SET_PROTOTYPE_METHOD( fileTemplate, "setDefaultEncoding", openFile );

		//NODE_SET_PROTOTYPE_METHOD( fileTemplate, "isPaused", openFile );

		constructor.Reset( isolate, fileTemplate->GetFunction() );
		//exports->Set( String::NewFromUtf8( isolate, "File" ),
		//	fileTemplate->GetFunction() );
	}

	void FileObject::openFile( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.Length() < 1 ) {
			isolate->ThrowException( Exception::TypeError(
				String::NewFromUtf8( isolate, "Requires filename to open" ) ) );
			return;
		}
		VolumeObject* vol;
		char *filename;
		String::Utf8Value fName( args[0] );
		filename = *fName;

		if( args.IsConstructCall() ) {
			// Invoked as constructor: `new MyObject(...)`
			FileObject* obj;
			if( args.Length() < 2 ) {
				vol = ObjectWrap::Unwrap<VolumeObject>( args.Holder() );
				obj = new FileObject( vol, filename, isolate, args.Holder() );
			}
			else {
				vol = ObjectWrap::Unwrap<VolumeObject>( args[1]->ToObject() );
				obj = new FileObject( vol, filename, isolate, args[1]->ToObject() );
			}
			obj->Wrap( args.This() );
			args.GetReturnValue().Set( args.This() );
		}
		else {
			const int argc = 2;
			Local<Value> argv[argc] = { args[0], args.Holder() };
			Local<Function> cons = Local<Function>::New( isolate, constructor );
			args.GetReturnValue().Set( cons->NewInstance( argc, argv ) );
		}
	}

	FileObject::FileObject( VolumeObject* vol, const char *filename, Isolate* isolate, Local<Object> o ) : 
		volume( isolate, o )
	{
		file = sack_vfs_openfile( vol->vol, filename );
	}


Persistent<Function> VolumeObject::constructor;
Persistent<Function> FileObject::constructor;

VolumeObject::~VolumeObject() {
	//printf( "Volume object evaporated.\n" );
	sack_vfs_unload_volume( vol );
}

FileObject::~FileObject() {
	//printf( "File object evaporated.\n" );
	sack_vfs_close( file );
	volume.Reset();
}


