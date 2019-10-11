rm -f log.bak
mv log log.bak
:node --inspect-brk ../node/mynode.js startup.js >log 2>&1
node ../common/myNode.js Auth0 startup.js >log 2>&1
