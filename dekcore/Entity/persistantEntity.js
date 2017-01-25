"use strict";

var Entity = require( config.run.root + "Entity/entity.js")


function makeEntity( creator, object, name, description ) {
    var e = Entity( creator, name, description );
    e.assign( object );
    {
        value : ( (obj)=>{sanityCheck( obj); return obj;} )(object)
        , Create : (name, description)=>{
            var newObject = Entity( null, name,description );
            newObject.creator = e;
            return newObject;
        }
    }
    return e;
}


function persist( ) {
    var content = {

    }
    return Entity( content );
}
