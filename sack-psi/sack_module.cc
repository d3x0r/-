#define DELAYIMP_INSECURE_WRITABLE_HOOKS

#define DEFINE_GLOBAL
#include "global.h"

static void ModuleInit( Handle<Object> exports ) {
	InvokeDeadstart();
	g.pii = GetImageInterface();
	g.pdi = GetDisplayInterface();

	ControlObject::Init( exports );
	{
		//extern void Syslog
		ImageObject::Init( exports );
		RenderObject::Init( exports );
		VolumeObject::Init( exports );
		InterShellObject::Init( exports );
	}
}

  extern "C" {                                      
    static node::node_module _module =              
    {                                               
      51/*NODE_MODULE_VERSION*/,                          
      0,/*flags*/                                        
      NULL,                                         
      __FILE__,                                     
      (node::addon_register_func) (ModuleInit),        
      NULL,                                         
      NODE_STRINGIFY(sack_psi_module),                      
      NULL,/*priv*/                                         
      NULL                                          
    };                                              
    NODE_C_CTOR(_register_sack_psi_module ) {
      node_module_register(&_module);               
    }                                               
  }

#ifdef _MSC_VER

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif


#include <windows.h>

#include <delayimp.h>
#include <string.h>

static FARPROC WINAPI load_exe_hook( unsigned int event, DelayLoadInfo* info ) {
	HMODULE m;
	if( event != dliNotePreLoadLibrary )
		return NULL;

	if( _stricmp( info->szDll, "iojs.exe" ) != 0 &&
		_stricmp( info->szDll, "node.exe" ) != 0 )
		return NULL;
	m = LoadLibrary( "node.dll" );
	//m = GetModuleHandle( NULL );
	return (FARPROC)m;
}

PfnDliHook __pfnDliNotifyHook2 = load_exe_hook;

#endif
