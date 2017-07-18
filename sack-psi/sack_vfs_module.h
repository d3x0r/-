

class VolumeObject : public node::ObjectWrap {
public:
	struct volume *vol;
	static v8::Persistent<v8::Function> constructor;
	
public:

	static void Init( Handle<Object> exports );
	VolumeObject( const char *mount, const char *filename, const char *key, const char *key2 );

	static void New( const FunctionCallbackInfo<Value>& args );

   ~VolumeObject();
};


class FileObject : public node::ObjectWrap {
	struct sack_vfs_file *file;
   //Local<Object> volume;
   Persistent<Object> volume;
public:
	static v8::Persistent<v8::Function> constructor;
	static void Init(  );

	static void openFile( const FunctionCallbackInfo<Value>& args );
	static void readFile( const FunctionCallbackInfo<Value>& args );
	static void writeFile( const FunctionCallbackInfo<Value>& args );
	static void seekFile( const FunctionCallbackInfo<Value>& args );

	//static void readFile( const FunctionCallbackInfo<Value>& args );

	static void Emitter( const FunctionCallbackInfo<Value>& args );

	FileObject( VolumeObject* vol, const char *filename, Isolate*, Local<Object> o );
   ~FileObject();
};
