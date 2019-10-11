:browserify  --ignore-missing --node json6.js salty_random_generator.js u8xor.js id_generator.js config.js protocol.js app.js > app.es6.js
set JSON=jsox.js

set SOURCES=
set SOURCES=%SOURCES% --js=salty_random_generator.js 
set SOURCES=%SOURCES% --js=u8xor.js 
set SOURCES=%SOURCES% --js=id_generator.js
set SOURCES=%SOURCES% --js=%JSON%
set SOURCES=%SOURCES% --js=protocol.js

call google-closure-compiler.cmd --language_out NO_TRANSPILE  %SOURCES%  --js_output_file=protocol.es6.js 
call google-closure-compiler.cmd --language_out NO_TRANSPILE --formatting=pretty_print %SOURCES%  --js_output_file=protocol.es6.dbg.js 

call google-closure-compiler.cmd --language_out ECMASCRIPT3  %SOURCES%  --js_output_file=protocol.es3.js 

goto end

node ../util/crypt/crypt0.js app.es6.js app.es6.e.js
node ../util/crypt/crypt0.es3.js app.es3.js app.es3.e.js
: spread operator fix.
call google-closure-compiler.cmd --language_out ECMASCRIPT3   --js=app.es3.e.js --js_output_file=app.es3.e.es3.js 

copy /B app.header.js+app.es6.e.js+app.footer.js app.es6.all.js


:end