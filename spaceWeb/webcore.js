// create a 'main' for this project...

const DEBUG_ALL = false;
const INVALID_INDEX = -1;

var count = 0;

var levels;
var paint = 0;



var makeWebLinkData = ()=>({
        paint:0, // when drawing.. mark the links as drawn.
        plane : {o:[0,0,0],n:[0,0,0]},
        from : null,
        to : null,  // WEBLINK
})

var makeWebLink = ()=>{ var link = {
        node:null,
        // plus characteristics of the link may imply... like
        //  target link - solves as a distant relative, something I might like to get to
        //  elasticity, spring, gravitation, repulsion
        //  the link is shared between the two nodes.
        data : null, // shared between both - links exest on both sides independantly... reduces need compare if (this or other)
        invert : false,
        get from() { return (link.invert?link.data.from:link.data.to).node }
}; return link};



function makeWebNode( web ) {
//struct spaceweb_node
var node= {
     point : [0,0,0],
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
        return node.links.length;
    },

    isOrphan : ()=>{
        if( node.flags.bLinked )
        {
            count++;
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
            node.links.forEach( l=>l.node.signIsland( value ))
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
        count = 0;
        web.zzz++;
        SignIsland( web.root, zzz );
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
        FindNearest( list, path, boundLinks, node, newNode.point, paint );
        console.log( "Find found", list );
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
                        console.log( ("oh, near2 is no good, near1 obsoletes") );
                        list[idx2] = null;
                    }
                    if( !IsWithin( newNode, near2, near_node ) )
                    {
                        console.log( ("oh, near1 is no good, near2 obsoletes") );
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
                console.log( "make real link")
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

        console.log( ("Finished RelinkANode") );
        levels--;
    },
    isLinked : ( other )=>
    {
        var link = node.links.find( link=>{
            if( !link ) return false;
            if( (link.invert?link.data.from:link.data.to).node === other )
                return true;
            return false;
        })
        if( link )
        {
            var result = other.links.find( link=>{
                if( !link ) return false;
                if( (link.invert ? link.data.from : link.data.to).node == node )
                    return link.data;
            });
            if( !result )
                throw new Error( "Node is not a reflected link", node, other );
            return result;
        }
        else
        {
            var result = other.links.find( link=>{
                if( !link ) return false;
                if( (link.invert ? link.data.from : link.data.to).node == node )
                    throw new Error( "Node is not a reflected link", node, other );
            });
        }
        return null;
    },

    migrateLink : ( p_dest )=>
    {
        var any_node = null;
        var check;
        
        if(0)
        {
            node.web.nodes.forEach( (n)=>{
                MakeOrphan( n, 0 );
            } );
            node.web.root = null;
            node.web.nodes.forEach( (n)=>{
                RebuildOrphan( n, 0 );
            })
            return;
        }

        console.log( ("------ Begin a migration(%d) ----------"), NodeIndex( node ) );

        {
            var any_near = null;
            var check;

            // self's links maybe invalid now... so, use the regular check on this node
            check = node.links.find( check, idx=>{
                var p;
                var t;
                var idx2 = idx;
                p = sub( check.node.point, node.point );
                t = PointToPlaneT( p, node.point, p_dest );
                console.log( ("%d.%d  %g"), NodeIndex( node ), NodeIndex( check.node ), t );
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
                console.log( ("Fell outside the lines... best to orphan, and rebuild (probably)") );
                var boundLinks = []
                FindNearest( pListNear, null, boundLinks, node, p_dest, 0 );
                {
                    var idx;
                    var near_node;
                    var near_link;
                    var idx2;
                    var near2;
                    pListNear.forEach( (near_node)=>{
                         console.log( ("node %d is near..."), NodeIndex( near_node ) );
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
                            console.log( ("%d is no longer near... break link."), NodeIndex( near_node ) );
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
                            console.log( ("%d was not a link... adding it"), NodeIndex( near2 ) );
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
                FindNearest( pListNear, null, boundLinks, node, p_dest, 0 );
                {
                    pListNear.forEach( (near_node)=>{
                        if( near_node == node )
                            return;
                        console.log( ("node %d is near..."), NodeIndex( near_node ) );
                        if( IsNodeWithin( node, p_dest, near_node ) )
                        {
                            near_node.link( node );
                            ValidateLink( near_node, p_dest, node );
                        }
                        else
                            console.log( ("yeah... but it's not within our bounds...") );

                    })
                }

                node.invalidateLinks( p_dest, 0 );

            }

            SetPoint( node.point, p_dest );

            migrating = 0;
            return;
        }

        // migrate this node...
        console.log( ("migration - first - check validity uhhmm... between node(near) and node(near(near)) from (near) to (near(near)) vs point") );
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
                        console.log( ("safe - link %p to %p?") );
                }
            })
        })

        if( any_node )
        {
            console.log( ("attach node to any node...") );
        }

        {
            node.links.forEach( (check,idx)=>{
                for( var idx2 = idx+1; idx2 < node.links.length; idx2++ )
                {
                    check2 = node.links[idx2];
                    console.log( ("compare %d v %d"), idx2, idx );
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
        console.log( ("Seperate nodes %d and %d"), NodeIndex( node ), NodeIndex( other ) );
        var link;
        if( link = node.isLinked( other ) )
        {
            if( other.links.find( (l,i)=>{
                if( !l ) return;
                if( (l.invert?l.data.from:l.data.to).node === node ) {
                    other.links[i] = null;
                    return true;
                }
                return false;
            }) && 
            node.links.find( (l,i)=>{
                if( !l ) return false;
                if( (l.invert?l.data.from:l.data.to).node === other ) {
                //if( l.node === other ) {
                    node.links[i] = null;
                    return true;
                }
                return false;
            }) ) {
            
            }
            else
                throw new Error( "Failure that direction too?!");
        }
        else
            console.log( ("Link didn't exist.") );
    },

// this does have an 'affinity' or directionality...
    link : ( linkto )=>
    {
        var linked_data;
        if( node == linkto )
            DebugBreak();
        if( linked_data = node.isLinked(  linkto ) )
        {
            //DebugBreak();
            if( linkto == linked_data.from.node ||
                linkto == linked_data.to.node
                )
            {
                /*
                if( !linked_data.secondary )
                    linked_data.secondary = linkto;
                if( linked_data.valence == 1 )
                    linked_data.valence = 2;
                */
            }
            //linked_data.valence += 0x10;
            console.log( ("Link already exists...(%d to %d)"), NodeIndex( node ), NodeIndex( linkto ) );
            return 0;
        }
        console.log( ("link %d to %d"), NodeIndex( node ), NodeIndex( linkto ) );

        {
           var link = makeWebLink();
           var data = makeWebLinkData();
            SetPoint( data.plane.o, node.point );
            data.plane.n = sub( linkto.point, node.point );
            addscaled( data.plane.o, data.plane.o, data.plane.n, 0.5 );

            data.from = link;

            link.node = node;
            link.data = data;
            link.invert = false;

            push( node.links, link );
            node.near_count++;

            link = makeWebLink();
            data.to = link;

            link.node = linkto;
            link.data = data;
            link.invert = true;
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
           var check = (_check.invert ? _check.data.from : _check.data.to);
            var _check2;
            var p;
            p = sub( check.node.point, new_point?new_point:node.point );
            for( var idx2 = idx + 1; idx2 < node.links.length; idx2++ )
            {
                var _check2  = node.links[idx2];
                var check2 = (_check2.invert ? _check2.data.from : _check2.data.to);
                // test check2 point above node.check1
                var other = check2.node;
                var t = PointToPlaneT( p, new_point?new_point:node.point, other.point );
                var p2;
                {
                // test check point above node.check2
                var t2 = PointToPlaneT( p2=sub( other.point, new_point?new_point:node.point ), new_point?new_point:node.point, check.node.point );
    //#if ( DEBUG_ALL )
                console.log( ("Hrm..%d(base) %d vs %d %g  %g"), NodeIndex( node ), NodeIndex( check.node ), NodeIndex( other ), t, t2 );
                //#endif

                if( t >= 1  || t <= -1 )
                {
    //#if ( DEBUG_ALL )
                    console.log( ("Removing node to check2...") );
                    //#endif
                    // check is between check2 and node, so we should link check2 and check and
                    // remove check2 from self...

                    // remove self, so linking won't fail. (though, if link fails... do we get orphans)
                    if( PrevalLink( check, check2, node, new_point ) ) {
                        check2.node.breakSingleNodeLink( node );
                    }
                    //else
                    //	console.log( ("nevermind, it was already linked with a via.") );
                    //invalidateLinks( check );
                    //invalidateLinks( check2 );
                }
                else if( t2 >= 1 || t2 <= -1 )
                {
    //#if ( DEBUG_ALL )
                    console.log( ("Removing node to check...") );
    //#endif
                    if( PrevalLink( check2, check, node, new_point ) )
                    {
                        node.links.forEach( (near_node)=>{
                            if( near_node.node == check2.node )
                                return;
                            if( near_node.node == check.node )
                                return;
                            if( CameThrough( node, null, check.node, near_node.node ) )
                            {
                            }

                            if( CameThrough( node, new_point, check.node, near_node.node ) )
                            {
                                console.log( ("maybe we have to spare this link?") );
                            }
                        })
                        check.node.breakSingleNodeLink( node );
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
        FindOrphans( node.web );
        if( FindIslands( node.web.root ) )
            DebugBreak();
    }

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

    findOrphans : ()=>
    {
        count = 0;
        if(  nodes.forEach( orphan=>orphan.isOrphan() ) ) 
        {
            if( ok )
                debugger;
        }
        // if we count to more than 1... then we can break if fail.
        if( count > 1 )
            ok = 1;
    },
    insert : (  pt, psv )=>
    {
        var node = makeWebNode(web);
        node.point = [pt[0],pt[1],pt[2]];
        node.web = web;
        node.data = psv;
        web.relinkNode( node );
        node.flags.bLinked = 1;
        return node;
    },
    relinkNode(node )
    {
        var current = web.root;
        if( !current )
        {
            console.log( ("First node ever.") );
            web.root = node;
            return;
        }
        current.relinkANode( null, node, 0 );
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
        if( link.node == test_node )
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
    PrintVector( "check1.point", check1.point );
    PrintVector( "check2.point", check2.point );
    PrintVector( "p", p );
    console.log( ("one is %g"), t );
    if( t > 0 )
    {
        return false;
    }

	return true;
}


// confirm that node to check1 and check2 is valid...
function CameThrough(  node,  new_point,  check1,  check2 )
{
	console.log( ("checking to see if %d<.%d<.%d"), NodeIndex( check1 ), NodeIndex( node ), NodeIndex( check2 ) );
	
	{
		var t;

		t = PointToPlaneT( sub( check1.point, new_point?new_point:node.point ), new_point?new_point:node.point, check2.point );
		console.log( ("one is %g"), t );
		if( t < 0 )
		{
			console.log( ("Goes through (definatly from check1 to node before check2. (from check1))") );
			return true;
		}
	}
	console.log( ("does not go through.") );
	return false;
}

// confirm that node to check1 and check2 is valid...
function IsBeyond(  node,  new_point, check1, check2 )
{
	console.log( ("checking to see if %d<.%d<.%d"), NodeIndex( node ), NodeIndex( check1 ), NodeIndex( check2 ) );
	
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
	console.log( ("Check to see that linking %d to %d is ok, was near %d"), NodeIndex( check.node ), NodeIndex(check2.node ), NodeIndex( removing ) );
	{
		var idx;
		var p3;
		var check_near;
		var a, b;
		// have to check if it's going to come through this point


		a=CameThrough( removing, null, check.node, check2.node );
		b=CameThrough( removing, new_point, check.node, check2.node );
		if( (a) && (b) )
		{
			console.log( "check .node . check2 is a chain, and check to check2 should not be kept." );
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
				console.log( ("wasn't related, and now is") );
				keep_link= 0;
			}
			else
			{
				console.log( ("a and !b? was a passthrough and now isn't?") );
				//okay = 0;
			}
		}
		if( okay )
		{
			p3=sub( check2.node.point, check.node.point );
            check2.node.links.find( (check_near)=>{
				var t3;
				if( check_near.node == removing )
					return false;
				t3 = PointToPlaneT( p3=sub( check_near.node.point, check2.node.point )
										, check_near.node.point, check.node.point );
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
			p3=sub( check.node.point, check2.node.point );
            check.node.links.find( (check_near)=>{
				var t3;
				if( check_near.node == removing )
					return false;

				t3 = PointToPlaneT( p3=sub( check_near.node.point, check.node.point )
												 , check_near.node.point, check2.node.point );
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
		check.node.link( check2.node );

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
		near2 = (link.invert ? data.from : data.to).node;
		if( near2 == node )
			return;

		// compare node base point versus near2 (the relative of near that I'm linked against)
		t = PointToPlaneT( data.plane.o, data.plane.n, near2.point );
		if( link.invert ) t = -t;


		console.log( ("%d.%d v %d is %g"), NodeIndex( resident ), NodeIndex( node ), NodeIndex( near2 ), t );
		if( t > 1)
		{
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
			console.log( ("ok..") );
    })
}



function MakeOrphan( node, psv )
{
    node.links.forEach( (linked,idx)=>{
		console.log( ("divorce nodes %p and %p"), node, linked );
        var other = linked.node.links.findIndex( (ol)=>ol===node );
        if( other >= 0 ) 
            ilnked.node.links[other] = null;
        node.links[ idx]= null;
		//DeleteFromSet( node.web., linked )
    })
}


function RebuildOrphan(  node,  psv )
{
	RelinkNode( node.web, node );
}



// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.
function FindNearest( nodes, came_from, boundaries, from,  to,  paint )
{
	var idx;
	var moved;
	var successes = 0;
	var current = from;  // starting at some known point (web.root)
	var check;
	var maybe = [];// CreateLinkQueue();
	var log = 1;
	if( log ) console.log( ("Begin Find.") );
	if( !came_from ) came_from = [];
    nodes.length = 0;
	do
	{
		var okay = 1;
		moved = 0;

        came_from.push( current );

		if( log ) console.log( ("Begin check %d"), NodeIndex( current ) );
        var follow = current.links.find( check=>{
            if( !check ) return false;
			var p;
			var t;
			var otherCheck = check.invert ? check.data.from : check.data.to;

			if( log ) console.log( ("checking near %d"), NodeIndex( otherCheck.node ) );
            if( came_from.find( l=>l===otherCheck.node ) )
			{
				if( log ) console.log( ("already checked...(or will be)") );
				t = PointToPlaneT( p=sub( check.node.point, current.point ), current.point, to );
				if( t > 1.0 )
				{
                    maybe.push( check.node );
					if( log ) console.log( ("might not have been checked in this direction, so checked, and discovered it's not a valid near.") );
					okay = 0;
    				return true; // can top the 'search' here.... have at least one path forward....
				}
				return false; // can top the 'search' here.... have at least one path forward....
			}

			t = PointToPlaneT( p=sub( otherCheck.node.point, current.point ), current.point, to );

			if( log ) console.log( ("??%d vs %d.%d is %g")
					 , 0//GetMemberIndex( SPACEWEB_NODE, &to.web.nodes, to )
					 ,  current
					 ,  check 
					 , t );

            if( t > 1 ) {
                console.log( 'point is beyond this segment...; only the far end is relavent.')
                maybe.push( otherCheck.node )
                okay = 0;
                return true;
            }
			else if( t > 0 ) //|| ( successes == 0 && t < 1 ) )
			{
                boundaries.push( check );
				if( !came_from.find( l=>l===otherCheck.node ) )
				{
					otherCheck.node.paint = paint;
					if( log ) console.log( ("Adding check to maybe.. (other)") );
					maybe.push( otherCheck.node );
				}
				else
					if( log ) console.log( ("came from (other); but already in came_from %d"), NodeIndex( check.node ) );
                    
				if( !came_from.find( l=>l===check.node ) )
				{
					check.node.paint = paint;
					if( log ) console.log( ("Adding check to maybe..(this)") );
					maybe.push( check.node );
				}
				else
					if( log ) console.log( ("came from (this); but already in came_from %d"), NodeIndex( check.node ) );
			}
            else if( t < 0 ) {
                console.log( "isn't towards this; and 'this' isn't nessecarily near...")
            }
        })
		if( okay )
		{
			if( log ) console.log( ("Add nearest as %d"), NodeIndex( current ) );
            
			if( !nodes.find( (n)=>n === current ) )
			{
				successes++;
                nodes.push( current );
			}
            else console.log( "already in the list of results")
		}

	} while( current = maybe.shift() );
	if( log ) console.log( ("Completed find.") );
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



function sub(a,b) {
    return [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
}
function add(a,b) {
    return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
}

function Length(v) {
    return Math.sqrt( v[0]*v[0]+v[1]*v[1]+v[2]*v[2] );
}

function addscaled(p,o,n,t) {
    p[0] = o[0] + n[0] * t;
    p[1] = o[1] + n[1] * t;
    p[2] = o[2] + n[2] * t;
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
	a = ( Slope[0] * n[0] +
			Slope[1] * n[1] +
			Slope[2] * n[2] );

	if( !a )
	{
		//Log1( DBG_FILELINEFMT "Bad choice - slope vs normal is 0" DBG_RELAY, 0 );
		//PrintVector( Slope );
		//PrintVector( n );
		return 0;
	}

	b = Length( Slope );
	c = Length( n );
	if( !b || !c )
	{
		Log( ("Slope and or n are near 0") );
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
		lprintf( "Parallel...", cosPhi );
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

function IntersectLineWithPlane(  Slope,  Origin,  // line m, b
									  n, o,  // plane n, o
										time )
//#define IntersectLineWithPlane( s,o,n,o2,t ) IntersectLineWithPlane(s,o,n,o2,t DBG_SRC )
{
	var a,b,c,cosPhi, t; // time of intersection

	// intersect a line with a plane.
    //   v € w = (1/2)(|v + w|2 - |v|2 - |w|2) 
    //  (v € w)/(|v| |w|) = cos ß     
	//cosPhi = CosAngle( Slope, n );

	a = ( Slope[0] * n[0] +
			Slope[1] * n[1] +
			Slope[2] * n[2] );

	if( !a )
	{
		//Log1( DBG_FILELINEFMT "Bad choice - slope vs normal is 0" DBG_RELAY, 0 );
		//PrintVector( Slope );
		//PrintVector( n );
		return 0;
	}

	b = Length( Slope );
	c = Length( n );
	if( !b || !c )
	{
		Log( WIDE("Slope and or n are near 0") );
		return 0; // bad vector choice - if near zero length...
	}

	cosPhi = a / ( b * c );

	t = ( n[0] * ( o[0] - Origin[0] ) +
			n[1] * ( o[1] - Origin[1] ) +
			n[2] * ( o[2] - Origin[2] ) ) / a;

//   lprintf( WIDE(" a: %g b: %g c: %g t: %g cos: %g pldF: %g pldT: %g \n"), a, b, c, t, cosTheta,
//                  pl->dFrom, pl->dTo );
//   if( cosTheta > e1 ) //global epsilon... probably something custom

	if( cosPhi > 0 ||
		 cosPhi < 0 ) // at least some degree of insident angle
	{
		time[0] = t;
		return cosPhi;
	}
	else
	{
		Log1( WIDE("Parallel... %g\n"), cosPhi );
		PrintVector( "Slope", Slope );
		PrintVector( "n", n );
		// plane and line are parallel if slope and normal are perpendicular
		//lprintf(WIDE("Parallel...\n"));
		return 0;
	}
}

function PointToPlaneT(n,o,p) {
    var t = [0];
    var i = [-n[0],-n[1],-n[2]];
    IntersectLineWithPlane( i, p, n, o, t );
    return t[0];
    var t = -( n[0] * ( o[0] - p[0] ) +
			n[1] * ( o[1] - p[1] ) +
			n[2] * ( o[2] - p[2] ) );
    return t;
}

function push( arr, el ){
    var i = arr.findIndex( (e)=>e===null );
    if( i >= 0 ) arr[i] = el;
    else arr.push( el );
}

if( typeof exports === "undefined" ) exports = {};

exports.Web = ()=>{
    return makeWeb();
}

