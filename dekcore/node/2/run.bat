del /q log.bak
rename log log.bak
:node --inspect-brk ..\node\mynode.js startup.js >log 2>&1
node ..\node\mynode.js Auth1 AuthStartup.js >log 2>&1