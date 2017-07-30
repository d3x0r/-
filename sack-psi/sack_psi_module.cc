
#include "global.h"

#include <psi.h>
#include <psi/console.h>

static struct psiLocal {
	PLIST registrations;
	uv_async_t async; // keep this instance around for as long as we might need to do the periodic callback
	PLINKQUEUE events;
} psiLocal;

Persistent<Function> ControlObject::constructorDisplay;
Persistent<Function> ControlObject::constructor;
Persistent<Function> ControlObject::constructor2;
Persistent<Function> ControlObject::constructor3;



static void asyncmsg( uv_async_t* handle ) {
	// Called by UV in main thread after our worker thread calls uv_async_send()
	//    I.e. it's safe to callback to the CB we defined in node!
	v8::Isolate* isolate = v8::Isolate::GetCurrent();
	
	RenderObject* myself = (RenderObject*)handle->data;

	HandleScope scope(isolate);
	//lprintf( "async message notice. %p", myself );
	{
		struct event *evt;

		while( evt = (struct event *)DequeLink( &psiLocal.events ) ) {

			//Local<Value> object = ProcessEvent( isolate, evt, myself );
			Local<Value> argv[] = { Local<Object>::New( isolate, evt->data.control.control->state ) };
			Local<Function> cb;
			switch( evt->type ){
			case Event_Control_Mouse:
				//evt->data.controlMouse.target
				cb = Local<Function>::New( isolate, evt->data.control.type->cbMouseEvent );

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


int MakePSIEvent( enum eventType type, ... ) {
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
	EnqueLink( &psiLocal.events, &e );
	uv_async_send( &psiLocal.async );

	while( !e.flags.complete ) WakeableSleep( 1000 );

	return e.success;
}


void ControlObject::Init( Handle<Object> exports ) {

	MemSet( &psiLocal.async, 0, sizeof( &psiLocal.async ) );
	uv_async_init( uv_default_loop(), &psiLocal.async, asyncmsg );

		Isolate* isolate = Isolate::GetCurrent();
		Local<FunctionTemplate> psiTemplate;
		Local<FunctionTemplate> psiTemplateDisplay;
		Local<FunctionTemplate> psiTemplate2;
		Local<FunctionTemplate> psiTemplate3;

		// Prepare constructor template
		//psiTemplateDisplay = FunctionTemplate::New( isolate, NewDisplay );
		//psiTemplateDisplay->SetClassName( String::NewFromUtf8( isolate, "sack.PSI.Display" ) );
		//psiTemplateDisplay->InstanceTemplate()->SetInternalFieldCount( 1 ); // 1 internal field for wrap

		// Prepare constructor template
		psiTemplate = FunctionTemplate::New( isolate, New );
		psiTemplate->SetClassName( String::NewFromUtf8( isolate, "sack.PSI.Frame" ) );
		psiTemplate->InstanceTemplate()->SetInternalFieldCount( 1 ); // 1 internal field for wrap

		// Prepare constructor template
		psiTemplate2 = FunctionTemplate::New( isolate, NewControl );
		psiTemplate2->SetClassName( String::NewFromUtf8( isolate, "sack.PSI.Control" ) );
		psiTemplate2->InstanceTemplate()->SetInternalFieldCount( 1 );// 1 internal field for wrap

		// Prepare constructor template
		psiTemplate3 = FunctionTemplate::New( isolate, RegistrationObject::NewRegistration );
		psiTemplate3->SetClassName( String::NewFromUtf8( isolate, "sack.PSI.Registration" ) );
		psiTemplate3->InstanceTemplate()->SetInternalFieldCount( 1 );// 1 internal field for wrap

      NODE_SET_PROTOTYPE_METHOD( psiTemplate3, "setCreate", RegistrationObject::setCreate );
      NODE_SET_PROTOTYPE_METHOD( psiTemplate3, "setDraw", RegistrationObject::setDraw );
      NODE_SET_PROTOTYPE_METHOD( psiTemplate3, "setMouse", RegistrationObject::setMouse );
      NODE_SET_PROTOTYPE_METHOD( psiTemplate3, "setKey", RegistrationObject::setKey );
      NODE_SET_PROTOTYPE_METHOD( psiTemplate3, "setTouch", RegistrationObject::setTouch );

		// Prototype
		NODE_SET_PROTOTYPE_METHOD( psiTemplate, "Control", ControlObject::NewControl );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate, "Frame", ControlObject::createFrame );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate, "show", ControlObject::show );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate, "hide", ControlObject::show );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate, "reveal", ControlObject::show );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate, "close", ControlObject::show );


		NODE_SET_PROTOTYPE_METHOD( psiTemplate2, "Control", ControlObject::NewControl );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate2, "createFrame", ControlObject::createFrame );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate2, "createControl", ControlObject::NewControl );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate2, "show", ControlObject::show );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate2, "hide", ControlObject::show );
		NODE_SET_PROTOTYPE_METHOD( psiTemplate2, "reveal", ControlObject::show );

      //registerControl
		//constructorDisplay.Reset( isolate, psiTemplateDisplay->GetFunction() );
		//exports->Set( String::NewFromUtf8( isolate, "Display" ),
		//	psiTemplateDisplay->GetFunction() );

		constructor.Reset( isolate, psiTemplate->GetFunction() );
		exports->Set( String::NewFromUtf8( isolate, "Frame" ),
			psiTemplate->GetFunction() );

		constructor2.Reset( isolate, psiTemplate2->GetFunction() );
		//exports->Set( String::NewFromUtf8( isolate, "Control" ),
		//				 psiTemplate2->GetFunction() );

		constructor3.Reset( isolate, psiTemplate3->GetFunction() );
		exports->Set( String::NewFromUtf8( isolate, "Registration" ),
			psiTemplate3->GetFunction() );
	}

ControlObject::ControlObject( ControlObject *over, const char *type, const char *title, int x, int y, int w, int h )  {
   frame = over;
   if( title )
	control = MakeNamedControl( over->control, type, x, y, w, h, 0 );
    else
	control = MakeNamedCaptionedControl( over->control, type, x, y, w, h, 0, title );
}

ControlObject::ControlObject( const char *title, int x, int y, int w, int h, int border, ControlObject *over )  {
	frame = over;
	control = ::CreateFrame( title, x, y, w, h, border, over?over->control:(PSI_CONTROL)NULL );
}

ControlObject::ControlObject( const char *type, ControlObject *parent, int32_t x, int32_t y, uint32_t w, uint32_t h ) {
	control = ::MakeNamedControl( parent->control, type, x, y, w, h, -1 );
}

ControlObject::~ControlObject() {

}
ControlObject::ControlObject() {
	frame = NULL;
	control = NULL;
}


	void ControlObject::New( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.IsConstructCall() ) {
			char *type;

			char *title = "Node Application";
			char *tmpTitle = NULL;
			int x = 0, y = 0, w = 1024, h = 768, border = 0;
			int arg_ofs = 0;
			ControlObject *parent = NULL;

			int argc = args.Length();
			if( argc > 0 ) {
				String::Utf8Value fName( args[0]->ToString() );
				type = StrDup( *fName );
				arg_ofs++;
			}
			else {
				ControlObject* obj = new ControlObject( );
				obj->Wrap( args.This() );
				args.GetReturnValue().Set( args.This() );
				return;
			}
			if( argc > (arg_ofs+0) ) {
				if( args[arg_ofs + 0]->IsString() ) {
					String::Utf8Value fName( args[arg_ofs + 0]->ToString() );
					if( tmpTitle )
						Deallocate( char*, title );
					tmpTitle = title = StrDup( *fName );
					arg_ofs++;
				}
			}
			if( argc > (arg_ofs + 0) ) {
				x = (int)args[arg_ofs + 0]->NumberValue();
			}
			if( argc > (arg_ofs + 1) ) {
				y = (int)args[arg_ofs + 1]->NumberValue();
			}
			if( argc > (arg_ofs + 2) ) {
				w = (int)args[arg_ofs + 2]->NumberValue();
			}
			if( argc > (arg_ofs + 3) ) {
				h = (int)args[arg_ofs + 3]->NumberValue();
			}

			if( argc > (arg_ofs + 4) ) {
				border = (int)args[arg_ofs+4]->NumberValue();
			}
			/*
			if( argc > 6 ) {
				parent = (int)args[5]->NumberValue();
				}
			*/
			// Invoked as constructor: `new MyObject(...)`
			
			ControlObject* obj = new ControlObject( title, x, y, w, h, border, NULL );
			obj->Wrap( args.This() );
			args.GetReturnValue().Set( args.This() );
			if( tmpTitle )
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


	void ControlObject::NewDisplay( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.IsConstructCall() ) {
			char *type;

			char *title = "SACK-PSI-Node Application";
			int x = 0, y = 0;
			uint32_t w = 1024, h = 768, border = BORDER_NONE;
			int arg_ofs = 0;
			ControlObject *parent = NULL;
         GetDisplaySizeEx( 0, &x, &y, &w, &h );

			int argc = args.Length();
			if( argc > 0 ) {
				String::Utf8Value fName( args[0]->ToString() );
				type = StrDup( *fName );
				arg_ofs++;
			}
			else {
				ControlObject* obj = new ControlObject( );
				obj->Wrap( args.This() );
				args.GetReturnValue().Set( args.This() );
				return;
			}
			if( argc > (arg_ofs+0) ) {
				if( args[arg_ofs + 0]->IsString() ) {
					String::Utf8Value fName( args[arg_ofs + 0]->ToString() );
					title = StrDup( *fName );
					arg_ofs++;
				}
			}
			if( argc > (arg_ofs + 0) ) {
				x = (int)args[arg_ofs + 0]->NumberValue();
			}
			if( argc > (arg_ofs + 1) ) {
				y = (int)args[arg_ofs + 1]->NumberValue();
			}
			if( argc > (arg_ofs + 2) ) {
				w = (int)args[arg_ofs + 2]->NumberValue();
			}
			if( argc > (arg_ofs + 3) ) {
				h = (int)args[arg_ofs + 3]->NumberValue();
			}

			if( argc > (arg_ofs + 4) ) {
				border = (int)args[arg_ofs+4]->NumberValue();
			}
			/*
			if( argc > 6 ) {
				parent = (int)args[5]->NumberValue();
				}
			*/
			// Invoked as constructor: `new MyObject(...)`
			
			ControlObject* obj = new ControlObject( title, x, y, w, h, border, NULL );
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

  Local<Object> ControlObject::NewWrappedControl( Isolate* isolate, PSI_CONTROL pc ) {
		// Invoked as plain function `MyObject(...)`, turn into construct call.
	
		Local<Function> cons = Local<Function>::New( isolate, constructor2 );

		Local<Object> c = cons->NewInstance( 0, 0 );
		ControlObject *me = ObjectWrap::Unwrap<ControlObject>( c );
		me->control = pc;
		return c;
	}


	void ControlObject::writeConsole( const FunctionCallbackInfo<Value>& args) {
		ControlObject *c = ObjectWrap::Unwrap<ControlObject>( args.This() );
		if( args.Length() > 0 )
		{
				String::Utf8Value fName( args[0]->ToString() );
				pcprintf( c->control, "%s", (const char*)*fName );
		}
	}

	void ControlObject::setConsoleRead( const FunctionCallbackInfo<Value>& args ) {
		ControlObject *c = ObjectWrap::Unwrap<ControlObject>( args.This() );
		if( args.Length() > 0 )
		{
			Isolate* isolate = args.GetIsolate();
			c->cbConsoleRead.Reset( isolate, Handle<Function>::Cast( args[0] ) );
			//args[0]->ToFunction
			//PSIConsoleInputEvent( c->control,
		}
	}

	static void ProvideKnownCallbacks( Isolate *isolate, Local<Object>c, ControlObject *obj ) {
		CTEXTSTR type = GetControlTypeName( obj->control );
		if( StrCmp( type, "PSI Console" ) == 0 ) {
			c->Set( String::NewFromUtf8( isolate, "write" ), Function::New( isolate, ControlObject::writeConsole ) );
			c->Set( String::NewFromUtf8( isolate, "setRead" ), Function::New( isolate, ControlObject::setConsoleRead ) );
		}
		else if( StrCmp( type, NORMAL_BUTTON_NAME ) == 0 ) {

		}
		else if( StrCmp( type, IMAGE_BUTTON_NAME ) == 0 ) {

		}
		else if( StrCmp( type, CUSTOM_BUTTON_NAME ) == 0 ) {

		}
		else if( StrCmp( type, RADIO_BUTTON_NAME ) == 0 ) {

		}
		else if( StrCmp( type, SCROLLBAR_CONTROL_NAME ) == 0 ) {

		}
	}

	void ControlObject::NewControl( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		ControlObject *container = ObjectWrap::Unwrap<ControlObject>( args.This() );

			char *type = NULL;
			char *title = NULL;
			int x = 0, y = 0, w = 1024, h = 768, border = 0;
			int argOffset = 0;
			ControlObject *parent = NULL;

			int argc = args.Length();
			if( argc == 0 ) {
				isolate->ThrowException( Exception::Error( String::NewFromUtf8( isolate, "Required parameter 'controlType' missing." ) ) );
				return;
			}
			if( argc > 0 ) {
				String::Utf8Value fName( args[0]->ToString() );
				type = StrDup( *fName );
			}
			{
				if( argc > 1 && args[1]->IsString() ) {
					String::Utf8Value fName( args[1]->ToString() );
					title = StrDup( *fName );
					argOffset = 1;
				}
				else {
					ControlObject *parent = ObjectWrap::Unwrap<ControlObject>( args[1]->ToObject() );
					if( argc > 5 ) {
						x = (int)args[2]->NumberValue();
						y = (int)args[3]->NumberValue();
						w = (int)args[4]->NumberValue();
						h = (int)args[5]->NumberValue();
					}
					else {
						x = g.nextControlCreatePosition.x;
						y = g.nextControlCreatePosition.y;
						w = g.nextControlCreatePosition.w;
						h = g.nextControlCreatePosition.h;
					}
					ControlObject* obj = new ControlObject( type, parent, x, y, w, h );
					ProvideKnownCallbacks( isolate, args.This(), obj );
					g.nextControlCreatePosition.control->pc = obj->control;
					g.nextControlCreatePosition.resultControl = obj->control;
					obj->Wrap( args.This() );
					args.GetReturnValue().Set( args.This() );
					return;
				}
			}
			if( argc > (1+argOffset) ) {
				x = (int)args[1+argOffset]->NumberValue();
			}
			if( argc > (2+argOffset) ) {
				y = (int)args[2+argOffset]->NumberValue();
			}
			if( argc > (3+argOffset) ) {
				w = (int)args[3+argOffset]->NumberValue();
			}
			if( argc > (4+argOffset) ) {
				h = (int)args[4+argOffset]->NumberValue();
			}

			// Invoked as constructor: `new MyObject(...)`
			ControlObject* obj = new ControlObject( container, type, title, x, y, w, h );
			obj->Wrap( args.This() );
			args.GetReturnValue().Set( args.This() );

			Deallocate( char*, type );
			if( title )
				Deallocate( char*, title );
	}

	void ControlObject::createFrame( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.IsConstructCall() ) {

			char *title = "Node Application";
			int x = 0, y = 0, w = 1024, h = 768, border = 0;
			ControlObject *parent = NULL;

			int argc = args.Length();
			if( argc > 0 ) {
				String::Utf8Value fName( args[0]->ToString() );
				title = StrDup( *fName );
			}
			if( argc > 1 ) {
				x = (int)args[1]->NumberValue();
			}
			if( argc > 2 ) {
				y = (int)args[2]->NumberValue();
			}
			if( argc > 3 ) {
				w = (int)args[3]->NumberValue();
			}
			if( argc > 4 ) {
				h = (int)args[4]->NumberValue();
			}
			if( argc > 5 ) {
				border = (int)args[5]->NumberValue();
			}
         /*
			if( argc > 6 ) {
				parent = (int)args[5]->NumberValue();
				}
           */
			// Invoked as constructor: `new MyObject(...)`
			ControlObject* obj = new ControlObject( title, x, y, w, h, border, NULL );
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

			Local<Function> cons = Local<Function>::New( isolate, constructor2 );
			args.GetReturnValue().Set( cons->NewInstance( argc, argv ) );
         delete argv;
		}
	}


	void ControlObject::show( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		ControlObject *me = ObjectWrap::Unwrap<ControlObject>( args.This() );

		DisplayFrame( me->control );
	}


RegistrationObject::RegistrationObject( const char *name ) {
	MemSet( &r, 0, sizeof( r ) );
	r.name = name;
	r.stuff.stuff.width = 32;
	r.stuff.stuff.height = 32;
	r.stuff.extra = sizeof( uintptr_t );
	r.stuff.default_border = BORDER_NORMAL;
	AddLink( &psiLocal.registrations, this );
	DoRegisterControl( &r );

}


	void RegistrationObject::NewRegistration( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.IsConstructCall() ) {
			int argc = args.Length();
			char *title = NULL;
			if( argc > 0 ) {
				String::Utf8Value fName( args[0]->ToString() );
				title = StrDup( *fName );

				// Invoked as constructor: `new MyObject(...)`
				RegistrationObject* obj = new RegistrationObject( title );

				obj->Wrap( args.This() );
				args.GetReturnValue().Set( args.This() );
			}
		}
		else {
			// Invoked as plain function `MyObject(...)`, turn into construct call.
			int argc = args.Length();
			Local<Value> *argv = new Local<Value>[argc];
			for( int n = 0; n < argc; n++ )
				argv[n] = args[n];

			Local<Function> cons = Local<Function>::New( isolate, ControlObject::constructor3 );
			args.GetReturnValue().Set( cons->NewInstance( argc, argv ) );
			delete argv;
		}
	}

RegistrationObject::~RegistrationObject() {
}


static RegistrationObject *findRegistration( CTEXTSTR name ) {
	RegistrationObject *obj;
	INDEX idx;
	LIST_FORALL( psiLocal.registrations, idx, RegistrationObject *, obj ) {
		if( StrCmp( obj->r.name, name ) == 0 )
         break;
	}
   return obj;
}

//-------------------------------------------------------

static int CPROC onCreate( PSI_CONTROL pc ) {
	CTEXTSTR name = GetControlTypeName( pc );
	RegistrationObject *obj = findRegistration( name );
	ControlObject *me = ControlData( ControlObject *, pc );
	return MakePSIEvent( Event_Control_Create, obj, me );
}

void RegistrationObject::setCreate( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RegistrationObject *obj = ObjectWrap::Unwrap<RegistrationObject>( args.This() );
	TEXTCHAR buf[256];
	lprintf( "Define Create Control %s", obj->r.name );
	snprintf( buf, 256, "psi/control/%s/rtti", obj->r.name );
	SimpleRegisterMethod( buf,  onCreate
							  , "int", "init", "(PSI_CONTROL)" );
	obj->cbInitEvent.Reset( isolate, Handle<Function>::Cast( args[0] ) );
}

//-------------------------------------------------------

static int CPROC onDraw( PSI_CONTROL pc ) {
	CTEXTSTR name = GetControlTypeName( pc );
	RegistrationObject *obj = findRegistration( name );
	ControlObject *me = ControlData( ControlObject *, pc );
   return MakePSIEvent( Event_Control_Draw, obj, me );
}

void RegistrationObject::setDraw( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RegistrationObject *obj = ObjectWrap::Unwrap<RegistrationObject>( args.This() );

	TEXTCHAR buf[256];
	lprintf( "Define Create Control %s", obj->r.name );
	snprintf( buf, 256, "psi/control/%s/rtti", obj->r.name );
	SimpleRegisterMethod( buf,  onDraw
							  , "int", "draw", "(PSI_CONTROL)" );

	obj->cbDrawEvent.Reset( isolate, Handle<Function>::Cast( args[0] ) );

}

//-------------------------------------------------------


static int CPROC cbMouse( PSI_CONTROL pc, int32_t x, int32_t, uint32_t b ) {
	CTEXTSTR name = GetControlTypeName( pc );
	RegistrationObject *obj = findRegistration( name );

	return MakePSIEvent( Event_Control_Mouse, obj, pc );
}

void RegistrationObject::setMouse( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	RegistrationObject *obj = ObjectWrap::Unwrap<RegistrationObject>( args.This() );

	TEXTCHAR buf[256];
	lprintf( "Define Create Control %s", obj->r.name );
	snprintf( buf, 256, "psi/control/%s/rtti", obj->r.name );
	SimpleRegisterMethod( buf, cbMouse
							  , "int", "mouse", "(PSI_CONTROL,int32_t,int32_t,uint32_t)" );

	obj->cbMouseEvent.Reset( isolate, Handle<Function>::Cast( args[0] ) );

}
void RegistrationObject::setKey( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
}
void RegistrationObject::setTouch( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
}


