
EVR  (Work in progress, no solid defintion)
    Exotic Vaccuum Reactor
    Encrypted Volume Repository
    EVR Space (just there's always space?)
    
    Endless Variation 



#EVR API
    
    var EVR = require( "evr" );

    EVR Factory Methods
        () 
            EVR() creates a new mesh.

        on
            setup for events on all graphs

        once
            setup for events that fire only once on all graphs
        emit
            emit an event for all graphs.

        addLocalStorage  (driver)
            Add a driver; these are meant to be synchronous...

        addRemoteStorage  (driver)
            Add a driver; these are meant to be async drivers...

    EVR Events
        None.

--EVR Instance

##EVR Instance

    var evr = EVR();

    EVR Instance Methods
        get   (path)
            return an EVR Node.
        
        on   ( eventType, callback )
            attach an event listener to a specific graph.

        once   ( eventType, callback )
            attach an event listener to a specific graph that fires once.

        emit   ( eventType, callback )
            generate events for a specific graph.

    EVR Instance Internals
        evr.graph
            a map from node.key to node.
        evr.objectMap 
            a map from node._ to node.

##EVR Node/Link

    EVR Node Methods / EVR Link Methods
        get  ( path, key )
            get a node in this node... navigate deeper into a mesh
            key optional parameter is meant for drivers to specify the node key from a remote; otherwise a random key is generated.
            returns an EVR Link

        path  ( path )
            splits path on '.' and get()s each part; returning the final link.
            returns final EVR Node.get() result.  (an EVR Link)

        put   ( object/node )
            if the parameter is an object, each property in the object is created/updated on the node.
            if the property is an object, a new path is created from this node, and the properties in that are added recursively...
            if the parameter is a node, the node that this link points to as a child is replaced with the specified node.
            returns 'this'.  (if called from link, returns link, if from node, returns node.)

        not  (cb)
            if the node is empty, emit the callback.
            returns 'this'  (if called from link, returns link, if from node, returns node.)

        map   (cb)   cb( val, field )
            define a callback to be called when fields in this node are created/modified.
            triggers drivers to readahead.
            if the map returns an object as the value, the object may not be FULLY loaded, and will have to be further mapped to make sure it has its content.
            returns 'this'.  (if called from link, returns link, if from node, returns node.)

        on    (cb)    cb( val, field )
            define a callback to be called when fields in this node are created/modified.
            does not trigger drivers.
            returns 'this'.  (if called from link, returns link, if from node, returns node.)

        getProp (name, initialValue )
            This creates a field in a node; this is used internally by put().
            returns new EVR field created.
        
        value   [get]
            get the object that this EVR Node/link represents.
            returns an object.

        isEmpty   [get]
            getter that returns true  if there are any fields or nodes in this node.

        tick   [get/set]
            state of the node; setting tick triggers write of the node.


    EVR Field Methods
		 update   ( val, tick ) 
            set the value and tick of a field  
        
        node : the node this field is in
        field : the text name of this field
        value : the value of the field
        tick : last update of the field
        opts : option space for drivers.

        And then related is the setter/getter in a node's object (_)






##Driver Events

    init  (evr)
        Initialize driver for a graph.

    initNode  (evr,node)
        Allow driver to initialize for a node in a graph.

    read  (evr,node)
        Ask driver to read information about a path node.

    initField (evr,node,field)
        Alow driver to initialize for a field in a node.

    write  (evr,node,field)
        Update the value in a field to storage.

    onMap (evr, node)
        received on a graph node that is being mapped.  Allows driver to read-ahead and fetch fields/nodes in the node.

    updateKey ( evr, node, oldKey )
        replace the key of a node with the specified value.  The node received already has the new key; so the old key is passed as parameter.
        update nodemap set key = node.key where key=oldkey

    replace ( evr, parent, oldChild, newChild )
        replace the relation from (parent to old child) to (parent to new child)

