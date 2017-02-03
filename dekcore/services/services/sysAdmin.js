
var permsRequired = ["authorize services"];
var permsRequested = [];


var list = document.getElementById( "serviceList")
var services = [];
var confirm = document.getElementById( "confirmService" );
var deny = document.getElementById( "banService" );

confirm.addEventListener( "click", ()=>{
    if( list.selectedIndex >= 0 ) {
        send( { op: "authService", id: services[list.selectedIndex].id } );
    }
})
deny.addEventListener( "click", ()=>{
    if( list.selectedIndex >= 0 ) {
        send( { op: "banService", id: services[list.selectedIndex].id } );
    }
})
//var ban = 

function ongun( ) {
    var services = gunDb.get( "serviceDef" );
    services.map( setupServices )
}

function setupServices( val, field ) {
    console.log( "got", field, val );
    var service = services.find( svc=>svc.id===field );
    if( !service ) {        
        services.push( service = {id:field,   
                service : val,
                element : document.createElement( "option" )
            } );
        service.element.text = val.name;
        list.add( service.element );
    }
}
