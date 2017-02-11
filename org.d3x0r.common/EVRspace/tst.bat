goto %1


:1
node "evrtest.js" >err.1.txt 2>&1
goto :eof

:2
del graph.db
node "evrtest+sql.js" >err.2.txt 2>&1
node "evrtest+sql.js" >err2.2.txt 2>&1

goto :eof

:3
node "evrtest+bio.js" "./evrTest-2Mesh.js" >err.3.txt 2>&1
