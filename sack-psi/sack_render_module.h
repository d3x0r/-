

class RenderObject : public node::ObjectWrap{

public:
	PRENDERER r; // this control
	int drawn; 
	int closed;
	Persistent<Object> surface; // used to pass to draw callback

	static v8::Persistent<v8::Function> constructor;
	static v8::Persistent<v8::Function> constructor2;

public:

	static void Init( Handle<Object> exports );
	RenderObject( const char *caption, int w, int h, int x, int y, RenderObject *parent );

	static void New( const FunctionCallbackInfo<Value>& args );

	static void show( const FunctionCallbackInfo<Value>& args );

	static void hide( const FunctionCallbackInfo<Value>& args );
	static void reveal( const FunctionCallbackInfo<Value>& args );
	static void redraw( const FunctionCallbackInfo<Value>& args );
	static void update( const FunctionCallbackInfo<Value>& args );

	static void setDraw( const FunctionCallbackInfo<Value>& args );
	static void setMouse( const FunctionCallbackInfo<Value>& args );
	static void setKey( const FunctionCallbackInfo<Value>& args );
	static void close( const FunctionCallbackInfo<Value>& args );
	static void getImage( const FunctionCallbackInfo<Value>& args );

   ~RenderObject();

	uv_async_t async; // keep this instance around for as long as we might need to do the periodic callback

	//1) Expose a function in the addon to allow Node to set the Javascript cb that will be periodically called back to :
	Persistent<Function, CopyablePersistentTraits<Function>> cbInitEvent; // event callback        ()  // return true/false to allow creation
	Persistent<Function, CopyablePersistentTraits<Function>> cbMouse; // event callback        ()  // return true/false to allow creation
	Persistent<Function, CopyablePersistentTraits<Function>> cbKey; // event callback        ()  // return true/false to allow creation
	Persistent<Function, CopyablePersistentTraits<Function>> cbDraw; // event callback        ()  // return true/false to allow creation


	PLINKQUEUE receive_queue;


};


