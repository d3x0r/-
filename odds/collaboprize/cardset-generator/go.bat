

for /F "usebackq tokens=1" %%i in (`get_display_position.exe 1`) do set DISPLAY_POS=%%i 

set POS_X=0
set POS_Y=0
set SCREEN_WIDTH=1920
set SCREEN_HEIGHT=1080
start wshell node c:\general\extra\nodejs\node_modules\npm\bin\npm-cli.js start  --ignore-certificate-errors --js-flags --expose_gc
:node c:\general\extra\nodejs\node_modules\npm\bin\npm-cli.js start  --ignore-certificate-errors


