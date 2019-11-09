
import {server} from "./testWsHttp.mjs"
import {accrual} from "./accrual.mjs"

server.messageProcessor = accrual.messageProcessor;
server.on( "connect", accrual.connect );
server.on( "disconnect", accrual.disconnect );


