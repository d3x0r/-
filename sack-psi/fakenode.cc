#include <windows.h>
#include <stdint.h>
#include <stdio.h>

static HMODULE node;


int main( int argc, const char **argv ) {
	// HINSTANCE h = LoadLibraryEx( "node.exe", NULL, DONT_RESOLVE_DLL_REFERENCES );
	printf( "loading library\n") ;
	if(0)
	{
		HMODULE x = LoadLibrary( "\\\\?\\M:\\javascript\\sack-psi\\native\\build\\Debug\\sack_psi_module.node" );
		printf( "magic handle is %p %d", x, GetLastError() );
		 x = LoadLibrary( "\\\\.\\M:\\javascript\\sack-psi\\native\\build\\Debug\\sack_psi_module.node" );
		printf( "magic handle is %p %d", x, GetLastError() );
		x = LoadLibrary( "build\\Debug\\sack_psi_module.node" );
		printf( "magic handle is %p %d", x, GetLastError() );
	}
	//Sleep( 10000 );
	
	{
		HINSTANCE h = node = LoadLibrary( "node.dll" );
			char *names[] = {   "?Start@node@@YAHHQAPAD@Z",  // 32bit
			"?Start@node@@YAHHQEAPEAD@Z" }; // 64bit
      printf( "getting addres...\n" );
		{
			void *p = GetProcAddress( h, names[0] );
			void(WINAPI*entry_point)(HINSTANCE,HINSTANCE,LPSTR,int);
         if( !p )
            p = GetProcAddress( h, names[1] );
			//entry_point = (void(WINAPI*)(HINSTANCE,HINSTANCE,LPSTR,int))(LoadLibraryFromMemory( "library", h, 0, 0, NULL ));

			printf( "%p  %p\n", h, p );

			((int(*)(int,const char**))p)( argc, argv );
 //entry_point( h, h, "node.exe", 0 );

	printf( "%p  %p", h, p );
		}
	}
   return 0;
}


