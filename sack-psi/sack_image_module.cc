#include "global.h"

Persistent<Function> ImageObject::constructor;
Persistent<Function> FontObject::constructor;
Persistent<Function> ColorObject::constructor;

void ImageObject::Init( Handle<Object> exports ) {

	Isolate* isolate = Isolate::GetCurrent();
	Local<FunctionTemplate> imageTemplate;

	// Prepare constructor template
	imageTemplate = FunctionTemplate::New( isolate, New );
	imageTemplate->SetClassName( String::NewFromUtf8( isolate, "sack.Image" ) );
	imageTemplate->InstanceTemplate()->SetInternalFieldCount( 1 ); // 1 required for wrap


	// Prototype
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "Image", ImageObject::NewSubImage );

	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "reset", ImageObject::reset );
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "fill", ImageObject::fill );
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "fillOver", ImageObject::fillOver );
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "line", ImageObject::line );
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "lineOver", ImageObject::lineOver );
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "plot", ImageObject::plot );
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "plotOver", ImageObject::plotOver );
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "putImage", ImageObject::putImage );
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "putImageOver", ImageObject::putImageOver );
	NODE_SET_PROTOTYPE_METHOD( imageTemplate, "imageData", ImageObject::imageData );
	//NODE_SET_PROTOTYPE_METHOD( imageTemplate, "plot", ImageObject:: );



	constructor.Reset( isolate, imageTemplate->GetFunction() );
	exports->Set( String::NewFromUtf8( isolate, "Image" ),
					 imageTemplate->GetFunction() );

	Local<FunctionTemplate> fontTemplate;
	fontTemplate = FunctionTemplate::New( isolate, FontObject::New );
	fontTemplate->SetClassName( String::NewFromUtf8( isolate, "sack.Font" ) );
	fontTemplate->InstanceTemplate()->SetInternalFieldCount( 4+1 );


	// Prototype
	NODE_SET_PROTOTYPE_METHOD( fontTemplate, "measure", FontObject::measure );


	FontObject::constructor.Reset( isolate, fontTemplate->GetFunction() );
	exports->Set( String::NewFromUtf8( isolate, "Font" ),
					 fontTemplate->GetFunction() );

}

ImageObject::ImageObject( const char *filename )  {
   image = LoadImageFile( filename );
}
ImageObject::ImageObject( Image image ) {
	this->image = image;
}

ImageObject::ImageObject( int x, int y, int w, int h, ImageObject * within )  {
	if( within )
	{
		container = within;
		image = MakeSubImage( within->image, x, y, w, h );
	}
	else {
		container = NULL;
		image = MakeImageFile( w, h );
	}
}

ImageObject::~ImageObject(void) {
   UnmakeImageFile( image );
}

	void ImageObject::New( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.IsConstructCall() ) {

			int x = 0, y = 0, w = 1024, h = 768;
			Local<Object> parentImage;
			ImageObject *parent = NULL;
			char *filename = NULL;

			int argc = args.Length();
			if( argc > 0 ) {
				if( args[0]->IsNumber() )
					w = (int)args[0]->NumberValue();
				else {
					String::Utf8Value fName( args[0]->ToString() );
					filename = StrDup( *fName );
				}
			}
			if( !filename ) {
				if( argc > 1 ) {
					h = (int)args[1]->NumberValue();
				}
				if( argc > 2 ) {
					parentImage = args[2]->ToObject();
					parent = ObjectWrap::Unwrap<ImageObject>( parentImage );
				}
				if( argc > 3 ) {
					x = (int)args[3]->NumberValue();
				}
				if( argc > 4 ) {
					y = (int)args[4]->NumberValue();
				}
			}
			// Invoked as constructor: `new MyObject(...)`
			ImageObject* obj;
			if( filename )
				obj = new ImageObject( filename );
			else
				obj = new ImageObject( x, y, w, h, parent );

			obj->Wrap( args.This() );
			args.GetReturnValue().Set( args.This() );

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

void ImageObject::NewSubImage( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.IsConstructCall() ) {

			int x = 0, y = 0, w = 1024, h = 768;
			Local<Object> parentImage;
			ImageObject *parent = ObjectWrap::Unwrap<ImageObject>( args.This() );
			int argc = args.Length();
			int arg_ofs = 0;
			if( argc > 0 ) {
				if( args[0]->IsObject() ) {
					ImageObject *parent = ObjectWrap::Unwrap<ImageObject>( args[0]->ToObject() );
					arg_ofs = 1;
				}
			if( (argc+arg_ofs) > 0 )
				x = (int)args[0+arg_ofs]->NumberValue();
			}
			if( (argc + arg_ofs) > 1 ) {
				y = (int)args[1 + arg_ofs]->NumberValue();
			}
			if( (argc + arg_ofs) > 2 ) {
				w = (int)args[2 + arg_ofs]->NumberValue();
			}
			if( (argc + arg_ofs) > 3 ) {
				h = (int)args[3 + arg_ofs]->NumberValue();
			}

			// Invoked as constructor: `new MyObject(...)`
			ImageObject* obj;
			obj = new ImageObject( x, y, w, h, parent );

			obj->Wrap( args.This() );
			args.GetReturnValue().Set( args.This() );
		}
		else {
			// Invoked as plain function `MyObject(...)`, turn into construct call.
			int argc = args.Length();
			Local<Value> *argv = new Local<Value>[argc+1];
			int n;
			for( n = 0; n < argc; n++ )
				argv[n+1] = args[n];
			argv[0] = args.Holder();

			Local<Function> cons = Local<Function>::New( isolate, constructor );
			args.GetReturnValue().Set( cons->NewInstance( argc, argv ) );
			delete argv;
		}
	}


Local<Object> ImageObject::NewImage( Isolate*isolate, Image image ) {
	// Invoked as constructor: `new MyObject(...)`
	ImageObject* obj;

	int argc = 0;
	Local<Value> *argv = new Local<Value>[argc];
	Local<Function> cons = Local<Function>::New( isolate, constructor );
	Local<Object> lo = cons->NewInstance( argc, argv );
	obj = ObjectWrap::Unwrap<ImageObject>( lo );
	obj->image = image;
	return lo;
}


	void ImageObject::reset( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		args[3]->ToObject();
		ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );
		ClearImage( io->image );
	}

	void ImageObject::fill( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );
		int argc = args.Length();
		int x, y, w, h, c;
		if( argc > 0 ) {
			x = (int)args[0]->NumberValue();
		}
		if( argc > 1 ) {
			y = (int)args[1]->NumberValue();
		}
		if( argc > 2 ) {
			w = (int)args[2]->NumberValue();
		}
		if( argc > 3 ) {
			h = (int)args[3]->NumberValue();
		}
		if( argc > 4 ) {
			c = (int)args[4]->NumberValue();
		}
		BlatColor( io->image, x, y, w, h, c );
	}

	void ImageObject::fillOver( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		int argc = args.Length();
		ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );
		int x, y, w, h, c;
		if( argc > 0 ) {
			x = (int)args[0]->NumberValue();
		}
		if( argc > 1 ) {
			y = (int)args[1]->NumberValue();
		}
		if( argc > 2 ) {
			w = (int)args[2]->NumberValue();
		}
		if( argc > 3 ) {
			h = (int)args[3]->NumberValue();
		}
		if( argc > 4 ) {
			c = (int)args[4]->NumberValue();
		}
		BlatColorAlpha( io->image, x, y, w, h, c );
	}

	void ImageObject::plot( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		int argc = args.Length();
		ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );
		int x, y, c;
		if( argc > 0 ) {
			x = (int)args[0]->NumberValue();
		}
		if( argc > 1 ) {
			y = (int)args[1]->NumberValue();
		}
		if( argc > 2 ) {
			c = (int)args[2]->NumberValue();
		}
		g.pii->_plot( io->image, x, y, c );
	}

	void ImageObject::plotOver( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		int argc = args.Length();
		ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );
		int x, y, c;
		if( argc > 0 ) {
			x = (int)args[0]->NumberValue();
		}
		if( argc > 1 ) {
			y = (int)args[1]->NumberValue();
		}
		if( argc > 2 ) {
			c = (int)args[2]->NumberValue();
		}
		plotalpha( io->image, x, y, c );
	}

	void ImageObject::line( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		int argc = args.Length();
		ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );
		int x, y, xTo, yTo, c;
		if( argc > 0 ) {
			x = (int)args[0]->NumberValue();
		}
		if( argc > 1 ) {
			y = (int)args[1]->NumberValue();
		}
		if( argc > 2 ) {
			xTo = (int)args[2]->NumberValue();
		}
		if( argc > 3 ) {
			yTo = (int)args[3]->NumberValue();
		}
		if( argc > 4 ) {
			c = (int)args[4]->NumberValue();
		}
		if( x == xTo )
			do_vline( io->image, x, y, yTo, c );
      else if( y == yTo )
			do_hline( io->image, y, x, xTo, c );
      else
			do_line( io->image, x, y, xTo, yTo, c );
	}

	void ImageObject::lineOver( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );
		int argc = args.Length();
		int x, y, xTo, yTo, c;
		if( argc > 0 ) {
			x = (int)args[0]->NumberValue();
		}
		if( argc > 1 ) {
			y = (int)args[1]->NumberValue();
		}
		if( argc > 2 ) {
			xTo = (int)args[2]->NumberValue();
		}
		if( argc > 3 ) {
			yTo = (int)args[3]->NumberValue();
		}
		if( argc > 4 ) {
			c = (int)args[4]->NumberValue();
		}
		if( x == xTo )
			do_vlineAlpha( io->image, x, y, yTo, c );
		else if( y == yTo )
			do_hlineAlpha( io->image, y, x, xTo, c );
		else
			do_lineAlpha( io->image, x, y, xTo, yTo, c );
	}

	// {x, y output
	// w, h} output
	// {x, y input
	// w, h} input
	void ImageObject::putImage( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );
		int argc = args.Length();
		ImageObject *ii;// = ObjectWrap::Unwrap<ImageObject>( args.This() );
		int x = 0, y= 0, xAt, yAt;
		int w, h;
		if( argc > 0 ) {
			ii = ObjectWrap::Unwrap<ImageObject>( args[0]->ToObject() );
			w = ii->image->width;
			h = ii->image->height;
		}
		else {
			// throw error ?
			return;
		}
		if( argc > 1 ) {
			x = (int)args[1]->NumberValue();
		}
		if( argc > 2 ) {
			y = (int)args[2]->NumberValue();
		}
		if( argc > 3 ) {
			xAt = (int)args[3]->NumberValue();

			if( argc > 4 ) {
				yAt = (int)args[4]->NumberValue();
			}
			if( argc > 5 ) {
				w = (int)args[5]->NumberValue();
			}
			if( argc > 6 ) {
				h = (int)args[6]->NumberValue();
			}
			if( argc > 7 ) {
				int ow, oh;

				ow = xAt;
				oh = yAt;
				xAt = w;
				yAt = h;
				if( argc > 7 ) {
					w = (int)args[7]->NumberValue();
				}
				if( argc > 8 ) {
					h = (int)args[8]->NumberValue();
				}
				BlotScaledImageSizedEx( io->image, ii->image, x, y, ow, oh, xAt, yAt, w, h, 1, BLOT_COPY );
			}
			else
				BlotImageSizedEx( io->image, ii->image, x, y, xAt, yAt, w, h, 0, BLOT_COPY );
		}
		else
			BlotImageEx( io->image, ii->image, x, y, 0, BLOT_COPY );
	}

	void ImageObject::putImageOver( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );
		ImageObject *ii;// = ObjectWrap::Unwrap<ImageObject>( args.This() );
		int argc = args.Length();
		int x, y, xTo, yTo, c;
		if( argc > 0 ) {
  			ii = ObjectWrap::Unwrap<ImageObject>( args[0]->ToObject() );
		}
		if( argc > 1 ) {
			x = (int)args[1]->NumberValue();
		}
		if( argc > 2 ) {
			y = (int)args[2]->NumberValue();
		}
		if( argc > 2 ) {
			xTo = (int)args[2]->NumberValue();

			if( argc > 3 ) {
				yTo = (int)args[3]->NumberValue();
			}
			if( argc > 4 ) {
				c = (int)args[4]->NumberValue();
			}
			else {
			}
		}
		else
         BlotImageEx( io->image, ii->image, x, y, ALPHA_TRANSPARENT, BLOT_COPY );
	}

void ImageObject::imageData( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	
	ImageObject *io = ObjectWrap::Unwrap<ImageObject>( args.This() );

	//Context::Global()
	size_t length;
	Local<SharedArrayBuffer> ab =
		SharedArrayBuffer::New( isolate,
			GetImageSurface( io->image ),
			length = io->image->height * io->image->pwidth );
	Local<Uint8Array> ui = Uint8Array::New( ab, 0, length );

	args.GetReturnValue().Set( ui );
}



FontObject::~FontObject() {
}
FontObject::FontObject( const char *filename, int w, int h, int flags ) {
   font = InternalRenderFontFile( filename, w, h, NULL, NULL, flags );
}

	void FontObject::New( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		if( args.IsConstructCall() ) {

			int w = 24, h = 24;
         int flags;
         Local<Object> parentFont;
			FontObject *parent = NULL;
         char *filename = NULL;

			int argc = args.Length();

			if( argc > 0 ) {
  				String::Utf8Value fName( args[0]->ToString() );
				filename = StrDup( *fName );
			}

			if( argc > 1 ) {
				w = (int)args[1]->NumberValue();
			}
			if( argc > 2 ) {
				h = (int)args[2]->NumberValue();
			}
			if( argc >3 ) {
				flags = (int)args[3]->NumberValue();
			}
			else
				flags = 3;

			// Invoked as constructor: `new MyObject(...)`
			FontObject* obj;
			if( filename )
				obj = new FontObject( filename, w, h, flags );

			obj->Wrap( args.This() );
			args.GetReturnValue().Set( args.This() );

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


void FontObject::measure( const FunctionCallbackInfo<Value>& args ) {
		Isolate* isolate = args.GetIsolate();
		FontObject *fo = ObjectWrap::Unwrap<FontObject>( args.This() );
		int argc = args.Length();

}




ColorObject::~ColorObject() {
}
ColorObject::ColorObject( int r,int grn, int b, int a ) {
	color = MakeAlphaColor( r, grn, b, a );
}
ColorObject::ColorObject( int r ) {
	color = r;
}

void ColorObject::New( const FunctionCallbackInfo<Value>& args ) {
	Isolate* isolate = args.GetIsolate();
	if( args.IsConstructCall() ) {
		int r, grn, b, a;
		int argc = args.Length();

		ColorObject* obj;
		if( argc == 1 ) {
			if( args[0]->IsObject() ) {
				Local<Object> o = args[0]->ToObject();
				r = (int)o->Get( String::NewFromUtf8( isolate, "r" ) )->NumberValue();
				grn = (int)o->Get( String::NewFromUtf8( isolate, "g" ) )->NumberValue();
				b = (int)o->Get( String::NewFromUtf8( isolate, "b" ) )->NumberValue();
				a = (int)o->Get( String::NewFromUtf8( isolate, "a" ) )->NumberValue();
				obj = new ColorObject( r,grn,b,a );

			}
			else if( args[0]->IsNumber() ) {
				r = (int)args[0]->NumberValue();
				obj = new ColorObject( r );
			}
			else if( args[0]->IsString() ) {
				// parse string color....
				//Config
			}

		}
		if( argc == 4 ) {
			r = (int)args[0]->NumberValue();
			grn = (int)args[1]->NumberValue();
			b = (int)args[2]->NumberValue();
			a = (int)args[3]->NumberValue();
			obj = new ColorObject( r, grn, b, a );
		}

		obj->Wrap( args.This() );
		args.GetReturnValue().Set( args.This() );

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


