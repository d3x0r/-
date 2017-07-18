
class SystemObject : public node::ObjectWrap {
public:
	static v8::Persistent<v8::Function> constructor;

public:

	static void Init( Handle<Object> exports );
	SystemObject( const char *dsn, Isolate* isolate, Local<Object> o );

	static void New( const FunctionCallbackInfo<Value>& args );

	static void loadLibrary( const FunctionCallbackInfo<Value>& args );  // load a DLL
	static void unload( const FunctionCallbackInfo<Value>& args ); // unload a DLL

   ~SystemObject();
};

