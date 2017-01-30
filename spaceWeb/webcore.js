// create a 'main' for this project...

const DEBUG_ALL = false;
const debugBreakLink= false || DEBUG_ALL;
const debugInvalidate = false || DEBUG_ALL;
const debugValidate = false || DEBUG_ALL;
const debugMigrate = false || DEBUG_ALL;
const debugWithin = false || DEBUG_ALL;
const debugPreval = false || DEBUG_ALL;
const debugRelink = false || DEBUG_ALL;
const DEBUG_MIGRATE = debugMigrate;

const paranoidLinkTest = false; // used to make sure all links from one side are also on the other (and not just figments)

const INVALID_INDEX = -1;

var orphanCounter = 0;

var levels;
var paint = 0;


var webLinkDataPool = [];
var makeWebLinkData = ()=>{
    var linkData = webLinkDataPool.pop();
    if( !linkData ) 
        linkData = {
                paint:0, // when drawing.. mark the links as drawn.
                plane : { o:[0,0,0],
                        n:[0,0,0],
                        t:[0,0,0],
                        ends:[0,0],
                        bounds:[] },
                from : null, // weblink
                to : null,  // WEBLINK
                delete : ()=>webLinkDataPool.push( linkData ),
        }
    else {
        linkData.from = null;
        linkData.to = null;
        linkData.paint = null;
    }
    return linkData;
}

var webLinkPool_ = [];
var webLinkPool = [];
var makeWebLink = (i,node,data)=>{ 
    var link = i?webLinkPool_.pop():webLinkPool.pop();
    if( !link ) {
        link = {
            node:node,
            // plus characteristics of the link may imply... like
            //  target link - solves as a distant relative, something I might like to get to
            //  elasticity, spring, gravitation, repulsion
            //  the link is shared between the two nodes.
            data : data, // shared between both - links exest on both sides independantly... reduces need compare if (this or other)
            invert : i,
            get to() { return (link.invert?link.data.from:link.data.to).node },
            delete : ()=>{ if( link.invert ) webLinkPool_.push( link ); else webLinkPool.push(link) },
        };
        ["invert"].forEach( (key)=>{
            Object.defineProperty( link, key, {configurable:false,writable:false,enumerable:true })
        })
        Object.seal( link );
    } else {
        link.node = node;
        link.data = data;
    }
    return link;
};


var webNodePool = [];
function makeWebNode( web ) {
    //struct spaceweb_node
    var node= webNodePool.pop();

    if( !node ) 
        node = {
        point : [0,0,0],
        radius : 1, // how big this area is... areas cannot overlap either?
        t : 0, // internal usage... keeps last computed t
        flags : { 
            bLinked : 1,
            bDeleted : 1,
            bBucketed : 1,
            bNegative : 1, // two negatives are a null, two postiives are a null, a positive is allowed entity space.
        },
        // island is a debug check - it's a color to make sure all nodes are within the web.
        // all nodes are contained in a seperate list for debug purposes...
        island : 0|0,
        paint : 0,
        near_count : 0,
        id : 0,
        // keep this, but migrate the name... otherwise we'll miss translation points...
        //PLIST near_nodes,  // link through an edge

        links : [],

        web : web, // have to find root node to find islands (please make this go awawy)
        data : null,
        countNear : ()=>{
            var n = 0;
            node.links.forEach( l=>{if(l)n++} )
            return n;
        },

        isOrphan : ()=>{
            if( node.flags.bLinked )
            {
                orphanCounter++;
                var c = node.countNear( node );
                return (c == 0)?thisnode:0;
            }
            return 0;
        },
        isIsland : (  psv )=>
        {
            // seek root...
            if( node.island && node.island !== psv )
            {
                console.log( "Node %p not signed.", node );
                return node;
            }
            return 0;
        },
        signIsland : ( value )=>
        {
            if( node.flags.bLinked )
            {
                if( node.island == value )
                    return;
                if ( DEBUG_ALL )
                    console.log( ("node %p is island %d"), node, value );
                node.island = value;
                node.links.forEach( l=>l&&l.node.signIsland( value ))
            }
        },
        unsignIsland : ( old_value, value )=>
        {
            if( node.flags.bLinked )
            {
                if( node.island != old_value )
                    return;
                if ( DEBUG_ALL )
                    console.log( ("node %p is island %d"), node, value );

                node.island = value;
                node.links.forEach( l=>{ if( l.node.island === old_value ) l.node.unsignIsland( old_value, value ) } );
            }
        },
        findIslands : ()=>
        {
            var web = node.web;
            var orphan;
            orphanCounter = 0;
            web.zzz++;
            web.root.signIsland( web.zzz );
            return web.nodes.find( n=>n.isIsland( web.zzz ) );
        },
        relinkANode : (  came_from,  newNode,  final )=>
        {
            var current = node;
            var linked = false;
            list = [];
            // just mkae sure it's really not linked to anything.

            if( !levels )
            {
                paint++;
            }
            if( newNode.paint == paint )
            {
                console.log( ("We already checked this locale.") );
                return;
            }
            current.paint = paint;
            levels++;

            // the second list is where we came from, don't think I need that...
            var path = [];
            var boundLinks = [];
            FindNearest( list, path, boundLinks, null, node, newNode.point, paint );
            if( debugRelink ) console.log( "Find found", list );
            {
                list.forEach( (near_node,idx)=>{
                    var near2;
                    if( !near_node ) return;
                    //console.log( "nearest is %d %d %d", GetMemberIndex( SPACEWEB_NODE, &near_node.web.nodes, near_node ),
                    //    (int32_t)newNode.point[0], (int32_t)newNode.point[2] );
                    for( var idx2 = idx+1; idx2 < list.length; idx2++ ) {
                        var near2 = list[idx2];
                        if( !near2 ) continue;
                        if( !IsWithin( newNode, near_node, near2 ) )
                        {
                            if( debugRelink ) console.log( ("oh, near2 is no good, near1 obsoletes") );
                            list[idx2] = null;
                        }
                        if( !IsWithin( newNode, near2, near_node ) )
                        {
                            if( debugRelink ) console.log( ("oh, near1 is no good, near2 obsoletes") );
                            list[idx2] = null;
                        }
                    }
                })

                list.forEach( (near_node,idx)=>{ 
                    if( !near_node ) return;
                    // in this place, I am near myself... but
                    // I should never link myself to me
                    if( near_node == newNode ) {
                        console.log( 'found self')
                        return;
                    }
                    
                    if( debugRelink )console.log( "make real link")
                    near_node.link( newNode );
                    ValidateLink( near_node, null,newNode );
                })
                newNode.invalidateLinks( null, 1 );

                        boundLinks.forEach( (link)=>{
                            var from = link.data.from.node;
                            var to = link.data.to.node;
                            
                                var p;
                                var t;
                                console.log( "Checking boundary that was ", NodeIndex( from ), NodeIndex( to ), NodeIndex(newNode) );
                                p = sub( newNode.point, from.point );
                                t = PointToPlaneT( p, from.point, to.point );
                                if( t > 1 )  {
                                    from.breakSingleNodeLink( to );
                                }
                                if(  t < 0 )
                                throw new Error( "should do something with this?")
                        })
            }

            //console.log( "Finished RelinkANode" );
            levels--;
        },
        getLink : ( other )=>
        {
            var link = node.links.findIndex( link=> link && ( link.to === other || link.from === other ) )
            if( link >= 0 )
            {
                var result = other.links.findIndex( link=> link && (link.to === node || link.from === node ) )
                if( result < 0 )
                    throw new Error( "Node is not a reflected link", node, other );
                return {a:node.links[link],b:other.links[result],ai:link,bi:result};
            }
            else
            {
                var result = other.links.find( link=>{
                    if( !link ) return false;
                    if( link.to == node )
                        throw new Error( "Node is not a reflected link", node, other );
                });
            }
            return null;
        },
        isLinked : ( other )=>
        {
            var link = node.links.findIndex( link=> link && ( link.to === other || link.from === other ) )
            if( link >= 0 )
            {
                if( paranoidLinkTest ) {
                    var result = other.links.find( link=> link && (link.to === node || link.from === node ) )
                    if( result < 0 )
                        throw new Error( "Node is not a reflected link", node, other );
                }
                return true;
            }
            else
            {
                var result = other.links.find( link=>{
                    if( !link ) return false;
                    if( link.to == node )
                        throw new Error( "Node is not a reflected link", node, other );
                });
            }
            return null;
        },

        migrateLink : ( p_dest )=>
        {
            var any_node = null;
            var check;

            if( debugMigrate )
                console.log( ("------ Begin a migration(%d) ----------"), NodeIndex( node ) );

            {
                var any_near = null;
                var check;

                // self's links maybe invalid now... so, use the regular check on this node
                check = node.links.find( (check, idx)=>{
                    if( !check ) return;
                    var p;
                    var t;
                    var idx2 = idx;
                    p = sub( check.node.point, node.point );
                    t = PointToPlaneT( p, node.point, p_dest );
                    if( debugMigrate ) console.log( ("%d.%d  %g"), NodeIndex( node ), NodeIndex( check.node ), t );
                    if( t > 1 )
                        return true;
                    return false;
                })

                if( check )
                {
                    // bad.
                    var pListNear = [];

                    // have never testwed the case that the motion put the point outside
                    // of its current locale.  (high density points?)
                    //DebugBreak();
                    if( debugMigrate ) console.log( ("Fell outside the lines... best to orphan, and rebuild (probably)") );
                    var boundLinks = []
                    FindNearest( pListNear, null, boundLinks, null, node, p_dest, 0 );
                    {
                        var idx;
                        var near_node;
                        var near_link;
                        var idx2;
                        var near2;
                        pListNear.forEach( (near_node)=>{
                            if( debugMigrate ) console.log( "node is near...", NodeIndex( near_node ) );
                        })
                        node.links.forEach( near_link=>{
                            node.breakSingleNodeLink(  near_link.node );
                        })

                        node.links.forEach( (near_link)=>{
                            var near2 = pListNear.find( (near2)=>{
                                if( near2 == near_link.node )
                                {
                                    return near2;
                                }
                                return false;
                            })
                            if( !near2 )
                            {
                                if( debugMigrate ) console.log( ("%d is no longer near... break link."), NodeIndex( near_node ) );
                                node.breakSingleNodeLink(  near_node );
                            }

                        })
                            //DebugBreak();
                        pListNear.forEach( (near2)=>{
                            var near_node = node.links.forEach( (near_link)=>{
                                if( near2 ==- near_link.node )
                                {
                                    return near2;
                                }
                            });
                            if( !near_node )
                            {
                                if( debugMigrate ) console.log( ("%d was not a link... adding it"), NodeIndex( near2 ) );
                                node.link(near2 );
                            }
                        })
                        boundLinks.forEach( (link)=>{
                            var from = link.data.from;
                            var to = link.data.to;
                            
                                var p;
                                var t;
                                var idx2 = idx;
                                p = sub( from.point, node.point );
                                t = PointToPlaneT( p, node.point, to.point );
                                if( t > 0 && t < 1 )  {
                                    from.breakSingleNodeLink( to );
                                }
                        })
                    }

                }
                else
                {
                    // okay it's still within it's local region... probably just update point
                    // and be done with it... though it can cause some of my nears to invalidate others
                    //console.log( ("Still within my own bounds, should validate that my nears are still valid.") );

                    var pListNear = [];
                    var boundLinks = [];
                    FindNearest( pListNear, null, boundLinks, null, node, p_dest, 0 );
                    {
                        pListNear.forEach( (near_node)=>{
                            if( near_node == node )
                                return;
                            if( debugMigrate ) console.log( ("node %d is near..."), NodeIndex( near_node ) );
                            if( IsNodeWithin( node, p_dest, near_node ) )
                            {
                                near_node.link( node );
                                ValidateLink( near_node, p_dest, node );
                            }
                            else
                                if( debugMigrate ) console.log( ("yeah... but it's not within our bounds...") );

                        })
                    }

                    node.invalidateLinks( p_dest, 0 );

                }

                SetPoint( node.point, p_dest );

                migrating = 0;
                return;
            }

            // migrate this node...
            if( debugMigrate ) console.log( ("migration - first - check validity uhhmm... between node(near) and node(near(near)) from (near) to (near(near)) vs point") );
            node.links.forEach( (check)=>{
                var idx2;
                var check2;
                if ( DEBUG_MIGRATE )
                if( NEAR( node.point, check.point ) )
                {
                    // points are invalid, cause they are the same point.
                    console.log( ("die...") );
                }
                check.node.links.forEach( check2=>{

                    if( check2.node == node )
                        return;

                    {
                        var t = PointToPlaneT( sub( check2.node.point, check.node.point ), check2.node.point, node.point );
                        if ( DEBUG_MIGRATE )
                            console.log( ("point is %g ..."), t );

                        if( t >= 2.0 )
                        {
                            if ( DEBUG_MIGRATE )
                                console.log( ("point is invalid.  checknode is above another plane near node") );
                            node.unlink();
                            if ( DEBUG_MIGRATE )
                                console.log( (" -- unlink finished, now to link... ") );
                            check2.node.link( node );
                            //RelinkANode( check2, node );
                            {
                                var c = 0;
                                node.links.forEach( (tmp)=>{if( tmp ) c++} );
                                if( c == 0 )
                                {
                                    console.log( (" *** Oops dropped the node entirely.") ) ;
                                    check.node.relinkANode( null, node, 0 );
                                }
                            }
                            migrating = 0;
                            return;
                            //break;
                        }
                        else
                            if( debugMigrate ) console.log( ("safe - link %p to %p?") );
                    }
                })
            })

            if( any_node )
            {
                if( debugMigrate ) console.log( ("attach node to any node...") );
            }

            {
                node.links.forEach( (check,idx)=>{
                    for( var idx2 = idx+1; idx2 < node.links.length; idx2++ )
                    {
                        check2 = node.links[idx2];
                        if( debugMigrate ) console.log( ("compare %d v %d"), idx2, idx );
                        // this is certainly one way to do this :)
                        if( check.data != check2.data )
                        {
                            var okay = 1;
                            var idx3;
                            var check3;
                            var p;
                            var t;
                            check.node.links.find( (check3)=>{
                                t = PointToPlaneT( sub( check3.node.point, check.node.point ), check.node.point, check2.node.point );
                                if( t > 2.0 )
                                {
                                    if ( DEBUG_MIGRATE )
                                        console.log( ("Fail.") );
                                    okay = 0;
                                    return true;
                                }
                                return false;

                            })
                            if( okay )
                            {
                                check2.node.links.find( (check3)=>{

                                    t = PointToPlaneT( sub( check3.node.point, check2.node.point ), check2.node.point, check.node.point );
                                    if( t > 2.0 )
                                    {
                                        if ( DEBUG_MIGRATE )
                                            console.log( ("Fail.(2)") );
                                        okay = 0;
                                        return true;
                                    }
                                    return false;
                                })
                            }
                            if( okay )
                            {
                                console.log( ("check and check2 should link now.") );
                                check.node.link( check2.node );
                                check2.node.invalidateLinks( null, 0 );
                            }
                        }
                    }
                })
            }
            migrating = 0;
        },

        breakSingleNodeLink:( other )=>
        {
            if( debugBreakLink )
                console.log( ("Seperate nodes %d and %d"), NodeIndex( node ), NodeIndex( other ) );
            var link;
            if( link = node.getLink( other ) )
            {
                other.links[link.bi] = null;
                other.near_count--;

                node.links[link.ai] = null;
                node.near_count--;

                // delete is just a push into a pool.
                link.a.delete();
                link.b.delete();
                link.a.data.delete();
            }
            else
                if( debugBreakLink )
                    console.log( ("Link didn't exist."), NodeIndex( node ), NodeIndex( other ) );
        },

    // this does have an 'affinity' or directionality...
        link : ( linkto )=>
        {
            var linked_data;
            if( node == linkto )
                throw new Error( "Attempt to link to itself" );

            if( node.isLinked(  linkto ) )
            {
                //console.log( ("Link already exists...(%d to %d)"), NodeIndex( node ), NodeIndex( linkto ) );
                return 0;
            }
            //console.log( ("link %d to %d"), NodeIndex( node ), NodeIndex( linkto ) );

            {
                var data = makeWebLinkData( );
                var link = makeWebLink( false, node, data );

                SetPoint( data.plane.o, node.point );
                data.plane.n = sub( linkto.point, node.point );
                data.plane.t = [data.plane.n[2], data.plane.n[1],-data.plane.n[0] ];
                data.plane.ends[0] = -2.5;
                data.plane.ends[1] = 2.5;

                addscaled( data.plane.o, data.plane.o, data.plane.n, 0.5 );

                data.from = link;

                push( node.links, link );
                node.near_count++;

                link = makeWebLink( true, linkto, data );
                data.to = link;

                push( linkto.links, link );
                linkto.near_count++;
            }
            return 1;
        },

        unlink : ()=>
        {
            var idx;
            var needs_someone = null;
            var anyone_else = null;
            var linked;
            var linked_list = [];
            var prior = node.island;

            if( node.web.root == node )
            {
                if ( DEBUG_ALL )
                    console.log( ("Going to have to pivot root.") );
                linked_list.forEach( linked=>{
                    if( !anyone_else )
                    {
                        if ( DEBUG_ALL )
                            console.log( ("new root is first one %p"), linked );
                        anyone_else = linked;
                    }
                    else
                        anone_else.node.link( linked.node );
                    linked_list.push( linked );
                } )

                linked_list.forEach( linked=>{
                    if ( DEBUG_ALL )
                        console.log( ("Safely break each link between %p and %p"), node, linked );
                    node.breakSingleNodeLink( linked.node );
                })
                linked_list.forEach( linked=>{
                    linked.node.invalidateLinks(null, 0 );
                })
                node.web.root = anyone_else.node;
            }

            anyone_else = null;
            if ( DEBUG_ALL )
                console.log( ("Eiher we pivoted the root, and have no links, or search naers...") );

            node.links.forEach( linked=>{
                if( anyone_else )
                {
                    if ( DEBUG_ALL )
                        console.log( ("Someone else is %p... going to link %p"), anyone_else, linked );
                    anyone_else.node.link( linked.node );
                }
                linked_list.push( linked )
                anyone_else = linked;
            })

            linked_list.forEach( linked=>{
                if ( DEBUG_ALL )
                    console.log( ("okay now we can break all links... %p to %p"), node, linked );
                node.breakSingleNodeLink( linked.node );
            })
            linked_list.forEach( linked=>{
                linked.node.invalidateLinks( null, 0 );
            })
        //		DeleteLink( &linked.near_nodes, node );
        // 	SetLink( &node.near_nodes, idx, null );

            linked_list.forEach( linked=>{
                if ( DEBUG_ALL )
                    console.log( ("Validate %p"), linked );
                linked.node.invalidateLinks(  null, 0 );
            })

            if ( DEBUG_ALL )
                console.log( ("Reinsert %p"), node );
        },
        invalidateLinks : ( new_point, bPrevalLink )=>
        {

            node.links.forEach( (_check,idx)=>{
                if( !_check ) return;
                var check = (_check.to);
                var _check2;
                var p;
                p = sub( check.point, new_point?new_point:node.point );
                for( var idx2 = idx + 1; idx2 < node.links.length; idx2++ )
                {
                    var _check2  = node.links[idx2];
                    if( !_check2 ) continue;
                    var check2 = (_check2.to);
                    // test check2 point above node.check1
                    var other = check2;
                    var t = PointToPlaneT( p, new_point || node.point, other.point );
                    var p2;
                    {
                        // test check point above node.check2
                        var t2 = PointToPlaneT( p2=sub( other.point, new_point||node.point ), new_point||node.point, check.point );
                        //#if ( DEBUG_ALL )
                        if( debugInvalidate )
                            console.log( ("Hrm..%d(base) %d vs %d %g  %g"), NodeIndex( node ), NodeIndex( check ), NodeIndex( other ), t, t2 );
                        
                        if( t < 0 && t2 < 0 ){
                            if( debugInvalidate )
                                console.log( "should break link between outer....");
                            check2.breakSingleNodeLink( check );
                        }
                        else if( t >= 1  || t <= -1 )
                        {
                            //#if ( DEBUG_ALL )
                            if( debugInvalidate ) console.log( ("Removing node to check2...") );
                            // check is between check2 and node, so we should link check2 and check and
                            // remove check2 from self...

                            // remove self, so linking won't fail. (though, if link fails... do we get orphans)
                            if( !PrevalLink( check, check2, node, new_point ) ) {
                                check2.breakSingleNodeLink( node );
                            }
                            //else
                            //	console.log( ("nevermind, it was already linked with a via.") );
                            //invalidateLinks( check );
                            //invalidateLinks( check2 );
                        }
                        else if( t2 >= 1 || t2 <= -1 )
                        {
                            //#if ( DEBUG_ALL )
                            if( debugInvalidate ) console.log( ("Removing node to check...") );
                            if( PrevalLink( check2, check, node, new_point ) )
                            {
                                node.links.forEach( (near_node)=>{

                                    if( !near_node || near_node.node == check2 )
                                        return;
                                    if( near_node.node == check )
                                        return;
                                    if( CameThrough( node, null, check, near_node.node ) )
                                    {
                                    }

                                    if( CameThrough( node, new_point, check, near_node.node ) )
                                    {
                                        if( debugInvalidate ) console.log( ("maybe we have to spare this link?") );
                                    }
                                })
                                check.breakSingleNodeLink( node );
                            }
                            //PrevalLink( check, check2 );
                            //else
                            //	console.log( ("nevermind, it was already linked with a via.") );
                            //invalidateLinks( check );
                            //invalidateLinks( check2 );
                        }
                    }
                }
                idx = idx2;
            })
        },


        move : ( v )=>
        {
            node.migrateLink( v );
            node.web.findOrphans(  );
            if( node.web.root.findIslands( ) )
                DebugBreak();
        },
        delete : ()=>{ webNodePool.push( node ); }

        }

    else {

    }
    push( node.web.nodes, node );

    return node;
};

    function makeWeb() {
    //struct spaceweb
            var ok = 0;
    var web = {
        nodes : [],
        root : null,
        links : [],
        link_data : [],
        zzz : 0,
        
    //--------------------------------------------------------------------------------------------
    // tests and validations 
    //--------------------------------------------------------------------------------------------

        findOrphans : ()=>{
            orphanCounter = 0;
            if(  web.nodes.forEach( orphan=>orphan.isOrphan() ) ) 
            {
                if( ok )
                    throw new Error( "Orphaned.")
                    //debugger;
            }
            // if we orphanCounter to more than 1... then we can break if fail.
            if( orphanCounter > 1 )
                ok = 1;
        },
        insert : (  pt, psv )=>{
            var node = makeWebNode(web);
            node.point = [pt[0],pt[1],pt[2]];
            node.web = web;
            node.data = psv;
            //logFind = 0;
            web.relinkNode( node );
            //logFind = 0;
            node.flags.bLinked = 1;
            return node;
        },
        relinkNode(node )
        {
            var current = web.root;
            if( !current )
            {
                //console.log( ("First node ever.") );
                web.root = node;
                return;
            }
            current.relinkANode( null, node, 0 );
        },
        rebuild()
            {
                web.nodes.forEach( (n)=>{
                    n.links.forEach( linked=>linked && n.breakSingleNodeLink( linked.to ) );
                } );
                web.root = null;
                web.nodes.forEach( (n)=>{
                    web.relinkNode( n );
                })
                return;
            }

    };
    return web;
}




var update_pause = 50000;

// return the(a) node that invalidates this link... (it's beyond this. (may be others))
function IsNodeWithinEx(  node, new_point,  test_node, new_test_point )
{
    var link = node.links.find( (link)=>{
        var p;
        if( !link || link.node == test_node )
            return false;

        p = sub( link.node.point, new_point?new_point:node.point );
        {
            var t;
            t = PointToPlaneT( link.data.plane.n, link.data.plane.o, new_test_point?new_test_point:test_node.point );
            if( link.invert )
                t = -t;
            if( t > 0.5 )
                return true;
        }
        return false;
        //console.log( ("node %d is near..."), NodeIndex( link.node ) );
    });
    if( link ) return link.data;

	return null;
}

function IsNodeWithin(  node, new_point, test_node )
{
	// if ex returns a node, it was aborted, and not valid.
	if( IsNodeWithinEx( node, new_point, test_node, null ) )
		return false;
	return true;
}


// confirm that node to check1 and check2 is valid...
function IsWithin(  node, check1, check2 )
{
    var t;
    var p;
    t = PointToPlaneT( p = sub( check1.point, node.point ), check1.point, check2.point );
    if( debugWithin ) {
        PrintVector( "check1.point", check1.point );
        PrintVector( "check2.point", check2.point );
        PrintVector( "p", p );
        console.log( ("one is %g"), t );
    }
    if( t > 0 )
    {
        return false;
    }

	return true;
}


// confirm that node to check1 and check2 is valid...
function CameThrough(  node,  new_point,  check1,  check2 )
{
	//console.log( ("checking to see if %d<.%d<.%d"), NodeIndex( check1 ), NodeIndex( node ), NodeIndex( check2 ) );
	
	{
		var t;

		t = PointToPlaneT( sub( check1.point, new_point?new_point:node.point ), new_point?new_point:node.point, check2.point );
		//console.log( ("one is "), t );
		if( t < 0 )
		{
			//console.log( ("Goes through (definatly from check1 to node before check2. (from check1))") );
			return true;
		}
	}
	//console.log( ("does not go through.") );
	return false;
}

// confirm that node to check1 and check2 is valid...
function IsBeyond(  node,  new_point, check1, check2 )
{
	//console.log( ("checking to see if %d<.%d<.%d"), NodeIndex( node ), NodeIndex( check1 ), NodeIndex( check2 ) );
	
	{
		var t;
		t = PointToPlaneT( sub( check1.point, new_point?new_point:node.point ), check1.point, check2.point );
		console.log( ("one is %g"), t );
		if( t > 0 )
		{
			console.log( ("Goes check2 beyond check1.") );
			return true;
		}
	}
	console.log( ("check2 is not beyond check1 - may be vice versa.") );
	return false;
}


function PrevalLink(  check,  check2,  removing,  new_point )
{
	var keep_link = 0;
	var okay = 1;
    if( debugPreval )
	console.log( ("Check to see that linking %d to %d is ok, was near %d"), NodeIndex( check ), NodeIndex(check2 ), NodeIndex( removing ) );
	{
		var idx;
		var p3;
		var check_near;
		var a, b;
		// have to check if it's going to come through this point


		a=CameThrough( removing, null, check, check2 );
		b=CameThrough( removing, new_point, check, check2 );
		if( (a) && (b) )
		{
			if( debugPreval ) console.log( "check  vs  check2 is a chain, and check to check2 should not be kept." );
			keep_link = 0;
			okay = 0;
			//console.log( ("we also need to do this link, if it's valid.") );
		}
		else if( !a && !b ) {
			keep_link = 1;
			okay = 1;
			//console.log( ("we also need to do this link, if it's valid.") );
		}else {
			if( !a && b )
			{
				if( debugPreval ) console.log( ("wasn't related, and now is") );
				keep_link= 0;
			}
			else
			{
				if( debugPreval ) console.log( ("a and !b? was a passthrough and now isn't?") );
				//okay = 0;
			}
		}
		if( okay )
		{
			p3=sub( check2.point, check.point );
            check2.links.find( (check_near)=>{
				var t3;
				if( !check_near || check_near.node == removing )
					return false;
				t3 = PointToPlaneT( p3=sub( check_near.node.point, check2.point )
										, check_near.node.point, check.point );
				//console.log( ("%d.%d v %d = %g"), NodeIndex( check ), NodeIndex( check2 ), NodeIndex( check_near ), t3 );
				if( t3 > 0 )
				{
					okay = 0;
					return true;
				}
            } )
		}
		if( okay )
		{
			p3=sub( check.point, check2.point );
            check.links.find( (check_near)=>{
				var t3;
				if( !check_near || check_near.node == removing )
					return false;

				t3 = PointToPlaneT( p3=sub( check_near.node.point, check.point )
												 , check_near.node.point, check2.point );
				//console.log( ("%d.%d v %d = %g"), NodeIndex( check2 ), NodeIndex( check ), NodeIndex( check_near ), t3 );
				if( t3 > 0 )
				{
					okay = 0;
					return true;
				}
            });
		}

	}
	if( okay )
		check.link( check2 );

	return keep_link;
}



// makes suare all links from here are valid for myself
// (if they are valid for what they are linked to, they must also stay
// near_node
function ValidateLink( resident, new_point, node )
{
	var idx2;
	var near2;
	var link;
	var p;
	// node was recently linked to this resident node (already belongs to the web).

	// this checks all other links from near_point (the resident)
	// versus this new point, if the point is beyond this new point, then
	// migrate a link to node from the resident

	// from resident . node delta
	p = sub( new_point?new_point:node.point, resident.point );

    resident.links.forEach( (link)=>{
        if( !link ) return;
		var t;
		var data = link.data;
		// don't check the node against itself.
		near2 = link.to;
		if( near2 == node )
			return;

		// compare node base point versus near2 (the relative of near that I'm linked against)
		t = PointToPlaneT( data.plane.o, data.plane.n, near2.point );
		if( link.invert ) t = -t;

        if( debugValidate )
		    console.log( ("%d.%d v %d is"), NodeIndex( resident ), NodeIndex( node ), NodeIndex( near2 ), t );
		if( t > 1)
		{
            if( debugValidate )
	    		console.log( ("So we steal the link to me %d , and remove from resident %d  (%d)")
		    			, NodeIndex( node ), NodeIndex( resident ), NodeIndex( near2 ) );
			// one for one exchange
			/*
			link( node, resident );
			//BreakSingleNodeLink( resident, near2 );

			if( IsNodeWithin( near2, null, resident ) )
				BreakSingleNodeLink( resident, near2 );
			console.log( ("And again validate my own links? considering the near2 as resident and me new") );
			//ValidateLink( near2, null, node );
			*/
		}
		else
            if( debugValidate )
    			console.log( ("ok..") );
    })
}


/* these won't really work for 3d.....

function computerIntersections( node ){
    node.links.forEach( l=>{
        var toLink = l.to
        var n = sub( toLink.node.point, node.point );
        var mid = scale( add( node.point, toLink.node.point ), 0.5 );
        var v = [n[2],n[1],-n[0]];

    })
}
*/


function findNodeRing(node) {
    var segs = [];

    for( var n = 0; n < node.links.length; n++ ) {
        var l1 = node.links[n]; 
        var n1 = l1.to.node;


        for( var m = 0; m < node.links.length; m++ ) {
            var l2 = node.links[m];
            var n2 = l2.to.node;
            if( n1.links.find( l=>l.to.node===n2 ) )
                segs.push( {prior:-1,next:-1,from:n1,to:n2} );
        }
    }
    for( var n = 0; n < segs.length; n++ ) {
        for( var m = 0; m < segs.length; m++ ) {
            if( segs[n].from === segs[m].to ) {
                segs[m].next = n;
                segs[n].prior = m;
            } else if( segs[n].to === segs[m].from ) {
                segs[n].next = m;
                segs[m].prior = n;
            }
            else if( segs[n].from === segs[m].from ) {
                if( segs[n].next === -1 && segs[n].prior === -1 ) {
                    var tmp = segs[n].from;
                    segs[n].from = segs[n].to;
                    segs[n].to = tmp;

                    segs[n].next = m;
                    segs[m].prior = n;
                }
                else if( segs[n].next === -1 && segs[n].prior === -1 ) {
                    var tmp = segs[m].from;
                    segs[m].from = segs[m].to;
                    segs[m].to = tmp;

                    segs[m].next = n;
                    segs[n].prior = m;
                }
                else {
                    // both segments linked, neither can singly flip;
                    throw new Error( "Could not reconcile ordering...");
                }
            }
            else if( segs[n].to === segs[m].to ) {
                if( segs[n].next === -1 && segs[n].prior === -1 ) {
                    var tmp = segs[n].from;
                    segs[n].from = segs[n].to;
                    segs[n].to = tmp;

                    segs[n].prior = m;
                    segs[m].next = n;

                }
                else if( segs[n].next === -1 && segs[n].prior === -1 ) {
                    var tmp = segs[m].from;
                    segs[m].from = segs[m].to;
                    segs[m].to = tmp;

                    segs[n].next = m;
                    segs[m].prior = n;
                }
                else {
                    // both segments linked, neither can singly flip;
                    throw new Error( "Could not reconcile ordering...");
                }
            }
        }
    }
    var n = 0;
    var outlinks = [];
    do {
        outlinks.push( segs[n].from )
        n = segs[n].next;
    }while( n != 0 )
}


// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.
var logFind = 0;

function FindNearest( nodes, came_from, boundaries, checked, from,  to,  paint )
{
	var idx;
	var moved;
	var successes = 0;
	var current = from;  // starting at some known point (web.root)
	var maybe = [];// CreateLinkQueue();
	if( logFind ) console.log( ("-------------------- Begin Find. ------------------ ") );

	if( !came_from ) came_from = [];
    if( !checked ) checked = [];
    nodes.length = 0;

	do
	{
		var okay = 1;
		moved = 0;

        came_from.push( current );

		if( logFind ) console.log( ("Begin check %d"), NodeIndex( current ) );
        var follow = current.links.find( check=>{
            if( !check ) return false;
			var p;
			var t;
			var otherCheck = check.to;

			if( logFind ) console.log( ("checking near %d"), NodeIndex( otherCheck ) );
            // we came from the other side; don't really check it....
            if( came_from[came_from.length-1] === otherCheck || came_from.find( l=>l===otherCheck ) )
			{
				t = PointToPlaneT( p=sub( otherCheck.point, current.point ), current.point, to );
            	if( logFind ) console.log( "already checked...; but do check to invalidate this one...", t );
				if( t > 1.0 )
				{
					if( logFind ) console.log( ("might not have been checked in this direction, so checked, and discovered it's not a valid near.") );
					okay = 0;
                    // from current to 
    				return true; // can top the 'search' here.... have at least one path forward....
				}
                // check next in  current.links.find
				return false; // can top the 'search' here.... have at least one path forward....
			}

            // from here along the link to check....
			t = PointToPlaneT( p=sub( otherCheck.point, current.point ), current.point, to );

			if( logFind ) console.log( `??${to} vs ${current}.${check} is ${t}` );

            if( t > 1 ) {
                if( logFind ) console.log( 'point is beyond this segment...; only the far end is relavent.')
                maybe.push( otherCheck )
                okay = 0;
                return false; // might have others that can be followed...
            }
			else if( t > 0 ) //|| ( successes == 0 && t < 1 ) )
			{
                //boundaries.push( check );
                otherCheck.paint = paint;
                if( logFind ) console.log( ("Adding check to maybe.. (other)") );
                if( !maybe.find( n=>n===otherCheck) )
                    maybe.push( otherCheck );
                    
                //if( log ) console.log( ("Adding check to maybe..(this)") );
                //if( !maybe.find( n=>n===check.node) )
                //    maybe.push( check.node );
			}
            else if( t < 0 ) {
                if( logFind ) console.log( "isn't towards this; and 'this' isn't nessecarily near...")
            }

            return false;
        })
		if( okay )
		{
			if( logFind ) console.log( ("Add nearest as %d"), NodeIndex( current ) );
            
			if( !nodes.find( (n)=>n === current ) )
			{
				successes++;
                nodes.push( current );
			}
            else {
                if( logFind ) console.log( "already in the list of results")
            }
		}

	} while( current = maybe.shift() );
	if( logFind ) console.log( ("Completed find.") );
	return nodes; // returns a list really.
}

function NodeIndex( node ) {
    return node.web.nodes.findIndex( n=>n===node );
}




function GetNodeData( node )
{
	if( node )
		return node.data;
	return null;
}

// ------------- Vector Math Utilities -----------------------------

function scale(v,s) {
    v[0] *= s;
    v[1] *= s;
    v[2] *= s;
}
function sub(a,b) {
    return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
}
function add(a,b) {
    return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
}

function len(v) {
    return Math.sqrt( v[0]*v[0]+v[1]*v[1]+v[2]*v[2] );
}

const e1 = (0.00001);
function NearZero( n ) { return Math.abs(n)<e1 }

function crossproduct(pv1,pv2 )
{
   // this must be limited to 3D only, huh???
   // what if we are 4D?  how does this change??
  // evalutation of 4d matrix is 3 cross products of sub matriccii...
  return [ pv2[2] * pv1[1] - pv2[1] * pv1[2], //b2c1-c2b1
    pv2[0] * pv1[2] - pv2[2] * pv1[0], //a2c1-c2a1 ( - determinaent )
    pv2[1] * pv1[0] - pv2[0] * pv1[1] ]; //b2a1-a2b1 
}
function dotproduct (  pv1, pv2 )
{
  return pv2[0] * pv1[0] +
  		   pv2[1] * pv1[1] +
  		   pv2[2] * pv1[2] ;
}

function addscaled(p,o,n,t) {
    p[0] = o[0] + n[0] * t;
    p[1] = o[1] + n[1] * t;
    p[2] = o[2] + n[2] * t;
}

const EPSILON = 0.00000001

function COMPARE(  n1,  n2 )
{
    return ((a - b) < EPSILON && (b - a) < EPSILON);
}

function SetPoint( o,i) {
    if( i ) {
        o[0] = i[0];
        o[1] = i[1];
        o[2] = i[2];
        return;
    }
    return [o[0],o[1],o[2]];
}

function IntersectLineWithPlane(  Slope, Origin,  // line m, b
									  n, o,  // plane n, o
										timeRef )
//#define IntersectLineWithPlane( s,o,n,o2,t ) IntersectLineWithPlane(s,o,n,o2,t DBG_SRC )
{
	var a,b,c,cosPhi, t; // time of intersection

	// intersect a line with a plane.
    // dot(Slope,n)
	a = ( Slope[0] * n[0] +
			Slope[1] * n[1] +
			Slope[2] * n[2] );

	if( !a ) return 0;

	b = len( Slope );
	c = len( n );
	if( !b || !c )
	{
		console.log( ("Slope and or n are near 0") );
		return 0; // bad vector choice - if near zero length...
	}

	cosPhi = a / ( b * c );

	t = ( n[0] * ( o[0] - Origin[0] ) +
			n[1] * ( o[1] - Origin[1] ) +
			n[2] * ( o[2] - Origin[2] ) ) / a;

//   lprintf( (" a: %g b: %g c: %g t: %g cos: %g pldF: %g pldT: %g \n"), a, b, c, t, cosTheta,
//                  pl->dFrom, pl->dTo );

//   if( cosTheta > e1 ) //global epsilon... probably something custom

//#define 

	if( cosPhi > 0 ||
		 cosPhi < 0 ) // at least some degree of insident angle
	{
		timeRef[0] = t;
		return cosPhi;
	}
	else
	{
		console.log( "Parallel...", cosPhi );
		PrintVector( "Slope", Slope );
		PrintVector( "n", n );
		// plane and line are parallel if slope and normal are perpendicular
		//lprintf(("Parallel...\n"));
		return 0;
	}
}

function PrintVector(n,v) {
    console.log( `${n} = (${v[0]},${v[1]},${v[2]})`);
}

function Invert(v) {
    v[0] = -v[0];
    v[1] = -v[1];
    v[2] = -v[2];
}

// from plane normal,origin to point
function PointToPlaneT(n,o,p) {
    var t = [0];
    var i = [-n[0],-n[1],-n[2]];
    IntersectLineWithPlane( i, p, n, o, t );
    return t[0];

	a = ( -n[0] * n[0] +
			-n[1] * n[1] +
			-n[2] * n[2] );
    var t = -( n[0] * ( o[0] - p[0] ) +
			n[1] * ( o[1] - p[1] ) +
			n[2] * ( o[2] - p[2] ) )/a;
    return t;
}

//----------------------------------------------------------------------------
// list utility - fill in null's then push....

function push( arr, el ){
    var i = arr.findIndex( (e)=>e===null );
    if( i >= 0 ) arr[i] = el;
    else arr.push( el );
}

if( typeof exports === "undefined" ) exports = {};

exports.Web = ()=>{
    return makeWeb();
}

