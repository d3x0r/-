set_property(GLOBAL PROPERTY USE_FOLDERS On)
set_property(GLOBAL PROPERTY QUIET_INSTALL On)
set(CMAKE_INSTALL_MESSAGE "LAZY")
cmake_minimum_required(VERSION 3.6)

string( REPLACE "\\" "/" CMAKE_JS_LIB ${CMAKE_JS_LIB} )
project (sack_psi_module)

set(ROOT_SACK_BUILD "H:/build/sack-vs14-x64" CACHE STRING "Set Root of sack build tree")
OPTION( ROOT_SACK_BUILD "Set Root of sack build tree" ${ROOT_SACK_BUILD} )

if( ${CMAKE_BUILD_TYPE} MATCHES "[dD][eE][bB][uU][gG]" )
message( "configure debug..." )
set( SACK_SDK_ROOT_PATH ${ROOT_SACK_BUILD}/debug_out/core )
set( INTERSHELL_ROOT_PATH ${ROOT_SACK_BUILD}/debug_out/intershell )
else()
message( "configure release..." )
set( SACK_SDK_ROOT_PATH ${ROOT_SACK_BUILD}/release_out/core )
set( INTERSHELL_ROOT_PATH ${ROOT_SACK_BUILD}/release_out/intershell )
endif()
if( NOT SACK_SDK_ROOT_PATH )
message( "get from registry ( fail)" )
GET_FILENAME_COMPONENT(SACK_SDK_ROOT_PATH "[HKEY_LOCAL_MACHINE\\SOFTWARE\\Freedom Collective\\SACK;Install_Dir]" ABSOLUTE CACHE)
else( NOT SACK_SDK_ROOT_PATH )
message( "Set ${SACK_SDK_ROOT_PATH}" )
set(SACK_SDK_ROOT_PATH ${SACK_SDK_ROOT_PATH} CACHE STRING "SACK SDK Root" )
endif( NOT SACK_SDK_ROOT_PATH )

if( NOT INTERSHELL_ROOT_PATH )
message( "get from registry ( fail)" )
GET_FILENAME_COMPONENT(INTERHSELL_ROOT_PATH "[HKEY_LOCAL_MACHINE\\SOFTWARE\\Freedom Collective\\InterShell;Install_Dir]" ABSOLUTE CACHE)
else( NOT INTERSHELL_ROOT_PATH )
message( "Set ${INTERSHELL_SDK_ROOT_PATH}" )
set(INTERSHELL_ROOT_PATH ${INTERSHELL_ROOT_PATH} CACHE STRING "InterShell SDK Root" )
endif( NOT INTERSHELL_ROOT_PATH )

string( REPLACE "\\" "/" SACK_SDK_ROOT_PATH ${SACK_SDK_ROOT_PATH} )


include( ${SACK_SDK_ROOT_PATH}/CMakePackage )
include_directories( ${SACK_INCLUDE_DIR} )
LINK_DIRECTORIES( ${SACK_LIBRARY_DIR} )

include( ${INTERSHELL_ROOT_PATH}/CMakePackage )
include_directories( ${INTERSHELL_INCLUDE_DIR} )
#LINK_DIRECTORIES( ${SACK_LIBRARY_DIR} )

set( DESTINATION ${CMAKE_CURRENT_SOURCE_DIR} )

set( CMAKE_JS_INC_CACHED ${CMAKE_JS_INC} CACHE STRING "Save path passed so we can reuse it without npm" )

include_directories( "../node_modules/nan" )

if( CMAKE_SIZEOF_VOID_P EQUAL 8 )
    ADD_DEFINITIONS( -D__64__ )
endif( CMAKE_SIZEOF_VOID_P EQUAL 8 )

include_directories( ${CMAKE_JS_INC_CACHED} )


add_executable( fakenode fakenode.cc )

add_library(${PROJECT_NAME} SHARED 
        sack_module.cc 
	sack_image_module.cc
	sack_render_module.cc
	sack_psi_module.cc
        sack_vfs_module.cc
        sack_sql_module.cc
		sack_intershell_module.cc
		sack_system_module.cc
        )


set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
set_target_properties(${PROJECT_NAME} PROPERTIES COMPILE_DEFINITIONS "TARGETNAME=\"${PROJECT_NAME}.node\"" )
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})

target_link_libraries(${PROJECT_NAME} ${SACK_LIBRARIES} sack_vfs.pp.module )


EXECUTE_PROCESS(COMMAND cmake -E make_directory ${CMAKE_BINARY_DIR}/${CMAKE_BUILD_TYPE} )
foreach( lib ${sack_libfile_list} ${sack_literal_libfile_list} )
    EXECUTE_PROCESS(COMMAND cmake -E copy_if_different ${lib} ${CMAKE_BINARY_DIR}/${CMAKE_BUILD_TYPE} )
endforeach()

