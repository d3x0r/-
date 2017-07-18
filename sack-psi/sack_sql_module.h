
class SqlObject : public node::ObjectWrap {
public:
	PODBC odbc;
   int optionInitialized;
	static v8::Persistent<v8::Function> constructor;
	int columns;
	CTEXTSTR *result;
	CTEXTSTR *fields;

public:

	static void Init( Handle<Object> exports );
	SqlObject( const char *dsn, Isolate* isolate, Local<Object> o );

	static void New( const FunctionCallbackInfo<Value>& args );

	static void query( const FunctionCallbackInfo<Value>& args );
	static void option( const FunctionCallbackInfo<Value>& args );
	static void setOption( const FunctionCallbackInfo<Value>& args );
	static void makeTable( const FunctionCallbackInfo<Value>& args );

   ~SqlObject();
};

