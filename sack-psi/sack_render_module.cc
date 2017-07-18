
#include "global.h"


Persistent<Function> RenderObject::constructor;

static Local<Value> ProcessEvent( Isolate* isolate, struct event *evt, RenderObject *r ) {
	//Local<Object> object = Object::New( isolate );
	Local<Object> object;


	switch( evt->type ) {
	case Event_Render_Mouse:
		{
			static Persistent<Object> mo;
			if( mo.IsEmpty() ) {
				object = Object::New( isolate );
				mo.Reset( isolate, object );
			}
			else
				object = Local<Object>::New( isolate, mo );

			object->Set( String::NewFromUtf8( isolate, "x" ), Number::New( isolate, evt->data.mouse.x ) );
			object->Set( String::NewFromUtf8( isolate, "y" ), Number::New( isolate, evt->data.mouse.y ) );
			object->Set( String::NewFromUtf8( isolate, "b" ), Number::New( isolate, evt->data.mouse.b ) );
		}
		break;
	case Event_Render_Draw:
		if( !r->drawn )
			r->surface.Reset( isolate, ImageObject::NewImage( isolate, GetDisplayImage( r->r ) ) );
		return Local<Object>::New( isolate, r->surface );
	case Event_Render_Key:
		return Number::New( isolate, evt->data.key.code );
	default:
		lprintf( "Unhandled event %d(%04x)", evt->type, evt->type );
		return Undefined( isolate );
	}
	return object;
}

static void asyncmsg( uv_async_t* handle ) {
	// Called by UV in main thread after our worker thread calls uv_async_send()
	//    I.e. it's safe to callback to the CB we defined in node!
	v8::Isolate* isolate = v8::Isolate::GetCurrent();
	
	RenderObject* myself = (RenderObject*)handle->data;

	HandleScope scope(isolate);
	//lprintf( "async message notice. %p", myself );
	{
		struct event *evt;

		while( evt = (struct event *)DequeLink( &myself->receive_queue ) ) {

			Local<Value> object = ProcessEvent( isolate, evt, myself );
			Local<Value> argv[] = { object };
			Local<Function> cb;
			switch( evt->type ){
			case Event_Render_Mouse:
				cb = Local<Function>::New( isolate, myself->cbMouse );
				break;
			case Event_Render_Key:
				cb = Local<Function>::New( isolate, myself->cbKey );
				break;
			case Event_Render_Draw:
				cb = Local<Function>::New( isolate, myself->cbDraw );
				UpdateDisplay( myself->r );
				break;
			}
			Local<Value> r = cb->Call( isolate->GetCurrentContext()->Global(), 1, argv );
			if( evt->waiter ) {
				evt->success = (int)r->NumberValue();
				evt->flags.complete = TRUE;
				WakeThread( evt->waiter );
			}
		}
	}
	//lprintf( "done calling message notice." );
}




void RenderObject::Init( Handle<Object> exports ) {
	{
		//extern void Syslog
	}
		Isolate* isolate = Isolate::GetCurrent();
		Local<FunctionTemplate> renderTemplate;

		// Prepare constructor template
		renderTemplate = FunctionTemplate::New( isolate, New );
		renderTemplate->SetClassName( String::NewFromUtf8( isolate, "sack.Renderer" ) );
		renderTemplate->InstanceTemplate()->SetInternalFieldCount( 1 ); /* one internal for wrap */


		// Prototype
		NODE_SET_PROTOTYPE_METHOD( renderTemplate, "getImage", RenderObject::getImage );
		NODE_SET_PROTOTYPE_METHOD( renderTemplate, "setDraw", RenderObject::setDraw );
		NODE_SET_PROTOTYPE_METHOD( renderTemplate, "setMouse", RenderObject::setMouse );
		NODE_SET_PROTOTYPE_METHOD( renderTemplate, "setKey", RenderObject::setKey );
		NODE_SET_PROTOTYPE_METHOD( renderTemplate, "show", RenderObject::show );
		NODE_SET_PROTOTYPE_METHOD( renderTemplate, "hide", RenderObject::hide );
		NODE_SET_PROTOTYPE_METHOD( renderTemplate, "reveal", RenderObject::reveal );
		NODE_SET_PROTOTYPE_METHOD( renderTemplate, "redraw", RenderObject::redraw );
		NODE_SET_PROTOTYPE_METHOD( renderTemplate, "close", RenderObject::close );


		constructor.Reset( isolate, renderTemplate->GetFunction() );
		exports->Set( String::NewFromUtf8( isolate, "Renderer" ),
			renderTemplate->GetFunction() );

	}

RenderObject::RenderObject( const char *title, int x, int y, int w, int h, RenderObject *over )  {
	r = OpenDisplayAboveSizedAt( 0, w, h, x, y, over?over->r:NULL );
	receive_queue = NULL;
	drawn = 0;
	closed = 0;
}

RenderObject::~RenderObject() {
}

	void RenderObject::New( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.IsConstructCall() && ( args.This()->InternalFieldCount() == 1)  ) {

			char *title = "Node Application";
			int x = 0, y = 0, w = 1024, h = 768, border = 0;
			Local<Object> parent_object;
			RenderObject *parent = NULL;

			int argc = args.Length();
			if( argc > 1 ) {
				String::Utf8Value fName( args[0]->ToString() );
				title = StrDup( *fName );
			}
			if( argc > 2 ) {
				x = (int)args[1]->NumberValue();
			}
			if( argc > 3 ) {
				y = (int)args[2]->NumberValue();
			}
			if( argc > 4 ) {
				w = (int)args[3]->NumberValue();
			}
			if( argc > 5 ) {
				h = (int)args[4]->NumberValue();
			}
			if( argc > 6 ) {
				if( args[5]->IsNull() ) {
					parent = NULL;
				}
				else {
					parent_object = args[5]->ToObject();
					parent = ObjectWrap::Unwrap<RenderObject>( parent_object );
				}
			}
			// Invoked as constructor: `new MyObject(...)`
			RenderObject* obj = new RenderObject( title, x, y, w, h, parent );

			MemSet( &obj->async, 0, sizeof( obj->async ) );
			uv_async_init( uv_default_loop(), &obj->async, asyncmsg );

			obj->async.data = obj;

			obj->Wrap( args.This() );
			args.GetReturnValue().Set( args.This() );

			Deallocate( char*, title );
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

void RenderObject::close( const FunctionCallbackInfo<Value>& args ) {
	RenderObject *r = ObjectWrap::Unwrap<RenderObject>( args.This() );
	if( !r->closed ) {
		r->closed = TRUE;
		lprintf( "Close async" );
		uv_close( (uv_handle_t*)&r->async, NULL );
	}
}

void RenderObject::getImage( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RenderObject *r = ObjectWrap::Unwrap<RenderObject>( args.This() );

	// results as a new Image in result...
	r->surface.Reset( isolate, ImageObject::NewImage( isolate, GetDisplayImage( r->r ) ) );

}

void RenderObject::redraw( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RenderObject *r = ObjectWrap::Unwrap<RenderObject>( args.This() );
	Redraw( r->r );
}

void RenderObject::show( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RenderObject *r = ObjectWrap::Unwrap<RenderObject>( args.This() );
	// UpdateDisplay deadlocks; so use this method instead....
	// this means the display is not nessecarily shown when this returns, but will be.
	RestoreDisplay( r->r );
}

void RenderObject::hide( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RenderObject *r = ObjectWrap::Unwrap<RenderObject>( args.This() );
	HideDisplay( r->r );
}

void RenderObject::reveal( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RenderObject *r = ObjectWrap::Unwrap<RenderObject>( args.This() );
	RestoreDisplay( r->r );
}

static int CPROC doMouse( uintptr_t psv, int32_t x, int32_t y, uint32_t b ) {
	RenderObject *r = (RenderObject *)psv;
	if( !r->closed )
		return MakeEvent( &r->async, &r->receive_queue, Event_Render_Mouse, x, y, b );
	return 0;
}

void RenderObject::setMouse( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RenderObject *r = ObjectWrap::Unwrap<RenderObject>( args.This() );
	Handle<Function> arg0 = Handle<Function>::Cast( args[0] );
	Persistent<Function> cb( isolate, arg0 );
	r->cbMouse = cb;
	SetMouseHandler( r->r, doMouse, (uintptr_t)r );
}

static void CPROC doRedraw( uintptr_t psv, PRENDERER out ) {
	RenderObject *r = (RenderObject *)psv;
	if( !r->closed )
		MakeEvent( &r->async, &r->receive_queue, Event_Render_Draw );
}

void RenderObject::setDraw( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RenderObject *r = ObjectWrap::Unwrap<RenderObject>( args.This() );
	Handle<Function> arg0 = Handle<Function>::Cast( args[0] );
	Persistent<Function> cb( isolate, arg0 );
	SetRedrawHandler( r->r, doRedraw, (uintptr_t)r );
	r->cbDraw = cb;
	
}

static int CPROC doKey( uintptr_t psv, uint32_t key ) {
	RenderObject *r = (RenderObject *)psv;
	if( !r->closed )
		return MakeEvent( &r->async, &r->receive_queue, Event_Render_Key, key );
	return 0;
}


void RenderObject::setKey( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RenderObject *r = ObjectWrap::Unwrap<RenderObject>( args.This() );
	Handle<Function> arg0 = Handle<Function>::Cast( args[0] );
	Persistent<Function> cb( isolate, arg0 );
	SetKeyboardHandler( r->r, doKey, (uintptr_t)r );
	r->cbKey = cb;
}

int MakeEvent( uv_async_t *async, PLINKQUEUE *queue, enum eventType type, ... ) {
	event e;
	va_list args;
	va_start( args, type );
	e.type = type;
	switch( type ) {
	case Event_Render_Mouse:
		e.data.mouse.x = va_arg( args, int32_t );
		e.data.mouse.y = va_arg( args, int32_t );
		e.data.mouse.b = va_arg( args, uint32_t );
		break;
	case Event_Render_Draw:
		break;
	case Event_Render_Key:
		e.data.key.code = va_arg( args, uint32_t );
		break;
	}

	e.waiter = MakeThread();
	e.flags.complete = 0; 
	e.success = 0;
	EnqueLink( queue, &e );
	uv_async_send( async );

	while( !e.flags.complete ) WakeableSleep( 1000 );

	return e.success;
}