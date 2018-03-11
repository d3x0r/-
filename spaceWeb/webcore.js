// create a 'main' for this project...

const DEBUG_ALL = false;
const debugBreakLink= false || DEBUG_ALL;
const debugInvalidate = false || DEBUG_ALL;
const debugValidate = false || DEBUG_ALL;
const debugMigrate = false || DEBUG_ALL;
const debugWithin = false || DEBUG_ALL;
const debugPreval = false || DEBUG_ALL;
const debugRelink = true || DEBUG_ALL;
const DEBUG_MIGRATE = debugMigrate;
const logFind = 0;

const paranoidLinkTest = false; // used to make sure all links from one side are also on the other (and not just figments)

const INVALID_INDEX = -1;

var orphanCounter = 0;

var levels;
var paint = 0;
const tmp1 = { x:0,y:0,z:0};
const tmp2 = { x:0,y:0,z:0};
const tmp3 = { x:0,y:0,z:0};
const tmp4 = { x:0,y:0,z:0};
const tmp5 = { x:0,y:0,z:0};

var webLinkDataPool = [];
var makeWebLinkData = ()=>{
	var linkData = webLinkDataPool.pop();
	if( !linkData )
		linkData = {
			paint:0, // when drawing.. mark the links as drawn.
			plane : { o:{x:0,y:0,z:0},
				n:{x:0,y:0,z:0},
				t:{x:0,y:0,z:0},
				ends:{from:0,to:0},
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
		lineMesh : null,
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
function makeWebNode( ) {
	//struct spaceweb_node
	var node= webNodePool.pop();

	if( !node )
		node = {
		point : {x:0,y:0,z:0},
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

		web : this, // have to find root node to find islands (please make this go awawy)
		data : null,
		countNear : ()=>{
			var n = 0;
			node.links.forEach( l=>{if(l)n++} )
			return n;
		},

		isOrphan (){
			if( node.flags.bLinked )
			{
				orphanCounter++;
				var c = node.countNear( node );
				return (c == 0)?this:0;
			}
			return 0;
		},
		isIsland  (  psv )
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
			var web = this.web;
			var orphan;
			orphanCounter = 0;
			web.zzz++;
			web.root.signIsland( web.zzz );
			return web.nodes.find( n=>n.isIsland( web.zzz ) );
		},
		relinkANode(  newNode,  final ) {
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
			console.log( "----------------------- ADD POINT ----------------------" );
			this.web.extents.forEach( node=>{
				FindNearest2( list, path, boundLinks, newNode, node, newNode.point, paint );
			} );
			console.log( "potential:", list );
				if( debugRelink ) console.log( "Find found", list );
				{
					for( var idx = 0; idx < list.length; idx++ ) {
						var near_node = list[idx];
						var near2;
						if( !near_node ) break;
						//console.log( "nearest is %d %d %d", GetMemberIndex( SPACEWEB_NODE, &near_node.web.nodes, near_node ),
						//    (int32_t)newNode.point[0], (int32_t)newNode.point['z'] );
						for( var idx2 = idx+1; idx2 < list.length; idx2++ ) {
							var near2 = list[idx2];
							if( !near2 ) continue;
							if( IsOutside( newNode, near_node, near2 ) ) {
								list[idx2] = null;
								continue;
							}
							if( IsOutside( newNode, near2, near_node ) ) {
								list[idx] = null;
								break;
							}
							if( !IsWithin( newNode, near_node, near2 ) )
							{
								if( debugRelink ) console.log( ("oh, near2 is no good, near1 obsoletes") );
								list[idx2] = null;
								continue;
							}
							if( !IsWithin( newNode, near2, near_node ) )
							{
								if( debugRelink ) console.log( ("oh, near1 is no good, near2 obsoletes") );
								list[idx2] = null;
								continue;
							}
						}
					}
					for( var idx = 0; idx < list.length; idx++ ) {
						var near_node = list[idx];
						if( !near_node ) continue;
						// in this place, I am near myself... but
						// I should never link myself to me
						if( near_node == newNode ) {
							console.log( 'found self')
							continue;
						}
						
						if( debugRelink )console.log( "make real link")
						near_node.link( newNode );
						ValidateLink( near_node, null,newNode );
					}
        
					newNode.invalidateLinks( null, 1 );
        
					boundLinks.forEach( (link)=>{
						var from = link.data.from.node;
						var to = link.data.to.node;
						
						var t;
						console.log( "Checking boundary that was ", NodeIndex( from ), NodeIndex( to ), NodeIndex(newNode) );
						sub2( tmp1, newNode.point, from.point );
						t = PointToPlaneT( tmp1, from.point, to.point );
						if( t > 1 )  {
							from.breakSingleNodeLink( to );
						}
						if(  t < 0 )
							throw new Error( "should do something with this?")
					})
				}
			//} );

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

		migrateLink( p_dest ) {
			var any_node = null;
			var check;

			this.web.updateExtents( p_dest );

			if( debugMigrate )
				console.log( ("------ Begin a migration(%d) ----------"), NodeIndex( node ) );

			{
				var any_near = null;
				var check;

				// self's links maybe invalid now... so, use the regular check on this node
				check = node.links.find( (check)=>{
					if( !check ) return;
					var t;
					sub2( tmp1, check.node.point, node.point );
					t = PointToPlaneT( tmp1, node.point, p_dest );
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
					FindNearest2( pListNear, null, boundLinks, this, node, p_dest, 0 );
					{
						var near_node;
						var near_link;
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
							var t;
							sub2( tmp1, from.point, node.point );
							t = PointToPlaneT( tmp1, node.point, to.point );
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
					FindNearest2( pListNear, null, boundLinks, this, node, p_dest, 0 );
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
						sub2( tmp1, check2.node.point, check.node.point )
						var t = PointToPlaneT( tmp1, check2.node.point, node.point );
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
									check.node.relinkANode( node, 0 );
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
				for( idx = 0; idx < node.links.length; idx++ ) {
					var check = node.links[idx];
					for( var idx2 = idx+1; idx2 < node.links.length; idx2++ )
					{
						check2 = node.links[idx2];
						if( debugMigrate ) console.log( ("compare %d v %d"), idx2, idx );
						// this is certainly one way to do this :)
						if( check.data != check2.data )
						{
							var okay = 1;
							//var idx3;
							var check3;
							var t;
							check.node.links.find( (check3)=>{
								sub2( tmp1, check3.node.point, check.node.point );
								t = PointToPlaneT( tmp, check.node.point, check2.node.point );
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
									sub2( tmp1, check3.node.point, check2.node.point );
									t = PointToPlaneT( tmp1, check2.node.point, check.node.point );
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
				}
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
				sub2( data.plane.n, linkto.point, node.point );
				data.plane.t = [data.plane.n['z'], data.plane.n['y'],-data.plane.n['x'] ];
				//data.plane.ends['from'] = -2.5;
				//data.plane.ends['to'] = 2.5;

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

		unlink() {
			var needs_someone = null;
			var anyone_else = null;
			var linked;
			var linked_list = [];
			var prior = node.island;
			for( var e = 0; e < 6; e++ ) {
				if( this.web.extents[e] === this ) {
					this.web.extents[e] = null;
				}
			}
			if( this.web.root == node )
			{
				if ( DEBUG_ALL )
					console.log( ("Going to have to pivot root.") );
				node.links.forEach( linked=>{
					if( !anyone_else )
					{
						if ( DEBUG_ALL )
							console.log( ("new root is first one %p"), linked );
						anyone_else = linked;
					}
					else
						anyone_else.node.link( linked.node );
					this.web.addExtent( linked );
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
				this.web.root = anyone_else.node;
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
		        for( var idx = 0; idx < node.links.length; idx++ ) {
				var _check = node.links[idx];
				if( !_check ) return;
				var check = (_check.to);
				var _check2;
				sub2( tmp1, check.point, new_point?new_point:node.point );
				for( var idx2 = idx + 1; idx2 < node.links.length; idx2++ )
				{
					var _check2  = node.links[idx2];
					if( !_check2 ) continue;
					var check2 = (_check2.to);
					// test check2 point above node.check1
					var other = check2;
					var t = PointToPlaneT( tmp1, new_point || node.point, other.point );
					{
						// test check point above node.check2
						sub2( tmp2, other.point, new_point||node.point )
						var t2 = PointToPlaneT( tmp2, new_point||node.point, check.point );
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
			}
		},


		move( v ) {
			this.migrateLink( v );
		},
		delete : ()=>{ webNodePool.push( node ); }

	}

	else {

	}
	push( this.nodes, node );

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
		extents : [], // list of nodes that are at extremes...
		zzz : 0,
		makeWebNode : makeWebNode,
	//--------------------------------------------------------------------------------------------
	// tests and validations
	//--------------------------------------------------------------------------------------------

		findOrphans(){
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
		insert( pt, psv ) {
			var node = this.makeWebNode();
			node.point = {x:pt['x'],y:pt['y'],z:pt['z']};
			node.data = psv;
			//logFind = 1;
			this.relinkNode( node );
			this.addExtent( node );
			//logFind = 0;
			node.flags.bLinked = 1;
			return node;
		},
		addExtent( node ) {
			if( !this.extents[0] ) this.extents[0] = node;
			else if( this.extents[0].point.x < node.point.x ) this.extents[0] = node;
			if( !this.extents[1] ) this.extents[1] = node;
			else if( this.extents[1].point.x > node.point.x ) this.extents[1] = node;
			if( !this.extents[2] ) this.extents[2] = node;
			else if( this.extents[2].point.y < node.point.y ) this.extents[2] = node;
			if( !this.extents[3] ) this.extents[3] = node;
			else if( this.extents[3].point.y > node.point.y ) this.extents[3] = node;
			if( !this.extents[4] ) this.extents[4] = node;
			else if( this.extents[4].point.z < node.point.z ) this.extents[4] = node;
			if( !this.extents[5] ) this.extents[5] = node;
			else if( this.extents[5].point.z > node.point.z ) this.extents[5] = node;
		},
		updateExtents(node) {
			if( this.extents.findIndex( e=>e===node ) )
			{
				if( this.extents[0] === node ) {
					node.links.forEach( link=>{
						var other = link.to;
						if( node.point.x < other.point.x ) this.extents[0] = other;
					} );
				}
				if( this.extents[1] === node ) {
					node.links.forEach( link=>{
						var other = link.to;
						if( node.point.x > other.point.x ) this.extents[1] = other;
					} );
				}
				if( this.extents[2] === node ) {
					node.links.forEach( link=>{
						var other = link.to;
						if( node.point.y < other.point.y ) this.extents[2] = other;
					} );
				}
				if( this.extents[3] === node ) {
					node.links.forEach( link=>{
						var other = link.to;
						if( node.point.y > other.point.y ) this.extents[3] = other;
					} );
				}
				if( this.extents[4] === node ) {
					node.links.forEach( link=>{
						var other = link.to;
						if( node.point.z < other.point.z ) this.extents[4] = other;
					} );
				}
				if( this.extents[5] === node ) {
					node.links.forEach( link=>{
						var other = link.to;
						if( node.point.z > other.point.z ) this.extents[5] = other;
					} );
				}
			}
			else 
				addExtent( node );
		},
		relinkNode(node ) {
			if( !this.root )
			{
				this.root = node;
				return;
			}
			this.root.relinkANode( node, 0 );
		},
		rebuild() {
			this.nodes.forEach( (n)=>{
				n.links.forEach( linked=>linked && n.breakSingleNodeLink( linked.to ) );
			} );
			web.root = null;
			web.nodes.forEach( (n)=>{
				this.relinkNode( n );
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
		if( !link || link.node == test_node )
			return false;

		var t;
		t = PointToPlaneT( link.data.plane.n, link.data.plane.o, new_test_point?new_test_point:test_node.point );
		if( link.invert )
			t = -t;
		if( t > 0.5 )
			return true;
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
	sub2( tmp1, check1.point, node.point );
	t = PointToPlaneT( tmp1, check1.point, check2.point );
	if( debugWithin ) {
		PrintVector( "check1.point", check1.point );
		PrintVector( "check2.point", check2.point );
		PrintVector( "p", tmp1 );
		console.log( ("one is %g"), t );
	}
	if( t > 0 )
	{
		return false;
	}

	return true;
}

// confirm that node to check1 has check2 outside it...
function IsOutside(  node, check1, check2 )
{
	var t;
	sub2( tmp1, check1.point, node.point );
	t = PointToPlaneT( tmp1, node.point, check2.point );
	if( debugWithin ) {
		PrintVector( "check1.point", check1.point );
		PrintVector( "check2.point", check2.point );
		PrintVector( "p", tmp1 );
		console.log( ("one is %g"), t );
	}
	if( t > 1 )
	{
		return true;
	}

	return false;
}


// confirm that node to check1 and check2 is valid...
function CameThrough(  node,  new_point,  check1,  check2 )
{
	//console.log( ("checking to see if %d<.%d<.%d"), NodeIndex( check1 ), NodeIndex( node ), NodeIndex( check2 ) );
	
	{
		var t;
		sub2( tmp1, check1.point, new_point?new_point:node.point )
		t = PointToPlaneT( tmp1, new_point?new_point:node.point, check2.point );
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
		sub2( tmp1, check1.point, new_point?new_point:node.point )
		t = PointToPlaneT( tmp1, check1.point, check2.point );
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
			//sub2( tmp3, check2.point, check.point );
			check2.links.find( (check_near)=>{
				var t3;
				if( !check_near || check_near.node == removing )
					return false;
				sub2( tmp3, check_near.node.point, check2.point )
				t3 = PointToPlaneT( tmp3, check_near.node.point, check.point );
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
			//sub2( tmp3, check.point, check2.point );
			check.links.find( (check_near)=>{
				var t3;
				if( !check_near || check_near.node == removing )
					return false;
				sub2( tmp3, check_near.node.point, check.point )
				t3 = PointToPlaneT( tmp3, check_near.node.point, check2.point );
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
	var near2;
	var link;
	// node was recently linked to this resident node (already belongs to the web).

	// this checks all other links from near_point (the resident)
	// versus this new point, if the point is beyond this new point, then
	// migrate a link to node from the resident

	// from resident . node delta

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

function FindNearest( nodes, came_from, boundaries, targetNode, from,  to,  paint )
{
	//if( from === targetNode ) return;
	var moved;
	var current = from;  // starting at some known point (web.root)
	const maybe = [];// CreateLinkQueue();
	if( logFind ) console.log( ("-------------------- Begin Find. ------------------ ") );

	if( !came_from ) came_from = [];
	// if from is already in this list of things to come from... don't re-scan (extents mult-scan)
	if( came_from.find( f=>f===from ) ) return;
	//if( !checked ) checked = [];
	//nodes.length = 0;

	do
	{
		var okay = 1;
		moved = 0;

		came_from.push( current );

		if( logFind ) console.log( ("Begin check %d"), NodeIndex( current ) );
		var follow = current.links.find( check=>{
			if( !check ) return false;
			var t;
			var otherCheck = check.to;

			if( logFind ) console.log( ("checking near %d"), NodeIndex( otherCheck ) );
			// we came from the other side; don't really check it....
			if( came_from[came_from.length-1] === otherCheck || came_from.find( l=>l===otherCheck ) )
			{
				sub2( tmp1, otherCheck.point, current.point )
				t = PointToPlaneT( tmp1, current.point, to );
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
			sub2( tmp1, otherCheck.point, current.point )
			t = PointToPlaneT( tmp1, current.point, to );

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
				//otherCheck.paint = paint;
				if( logFind ) console.log( ("Adding check to maybe.. (other)") );

				if( !maybe.find( n=>n===otherCheck) ) maybe.push( otherCheck );
					
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
				nodes.push( current );
			}
			else {
				if( logFind ) console.log( "already in the list of results")
			}
		}

	} while( current = maybe.shift() );
	let added = nodes.length;
	for( let n = 0; n < added; n++ ) {
		var node2 = nodes[n];
		sub2( tmp1, node2.point, to );

		came_from.forEach( (node)=>{
			if( node == node2 )
				return;
			t = PointToPlaneT( tmp1, to, node.point );
			if( t < 1 ) {
				// could be added...
				if( !nodes.find( (node3)=>{
					if( node3 == node2 ) return false;
					if( node3 == node ) return false;
					sub2( tmp2, node3.point, to );
					t = PointToPlaneT( tmp2, to, node.point );
					if( t > 1 ) // found a closer point that we could pass through...
						return true;
					return false;
				} ) )
					if( !nodes.find( (n)=>n === node ) ) nodes.push( node );
			}

		} );
	};

	if( logFind ) console.log( ("Completed find.") );
	return nodes; // returns a list really.
}

function NodeIndex( node ) {
	return node.web.nodes.findIndex( n=>n===node );
}



// find nearest does a recusive search and finds nodes
// which may qualify for linking to the new node (to).
// from is some source point, in a well linked web, should be irrelavent which to start from
// paint is passed to show nodes touched during the (last)search.

function FindNearest2( nodes, came_from, boundaries, targetNode, from,  to,  paint )
{
	function dist( a, b ) {
		var x = {};
		sub2( x, a, b );
		return len(x);
	}
	function h1( here ) {
		return dist( here.point, to );
	}


	var openSet = {
			first : null,
			length : 0,
			add(n, g) {
				var newNode = { 
					node: n, 
					checked : false, 
					f:h1(n) + g, 
					g:g, 
					h:0,
					next : null,  // link in set
					parent : null   // link backward from success
				};
				this.link( newNode );
				this.length++;
				return newNode;
			},
			link(newNode) {
				if( !this.first )
					this.first = newNode;
				else {
					if( newNode.f < this.first.f ) {
						newNode.next = this.first;
						this.first = newNode;
					} else {
						for( var cur = this.first; cur.next && ( cur.f < newNode.f ); cur = cur.next );
						newNode.next = cur.next;
						cur.next = newNode;
					}
				}
			},
			find(n) {
				var c, _c = null;
				for( c = this.first; c && c.node != n; (_c = c), (c = c.next) );
				if( c )
					return { node:c, prior:_c};
				return null;
			},
			pop() {
				var n = this.first;
				if( n ) {
					this.length--;
					this.first = this.first.next;
				}
				return n;
			}
		};
	var closedSet = {
			first : null,
			length : 0,
			add(n) {
				n.checked = true;
				if( !this.first )
					this.first = n;
				else {
					n.next = this.first;
					this.first = n;
				}
				this.length++;
			},
			find(n) {
				var c;
				for( c = this.first; c && c.node != n; c = c.next );
				return c;
			}
		};

	openSet.add( from, 0 );
	var check;
	var min_dist = Infinity;
	var min_len = Infinity;
	var min_node = null;
	while( check = openSet.pop() ) {
		if( check.node === targetNode ) {
			min_node = check;
			min_dist = 0;
			break;
		}
		var nearness = h1( check.node );
		if( nearness < min_dist ) {
			if( check.g < min_len ) {
				min_len = check.g;
			}
			min_node = check;
			min_dist = nearness;
		}
		// win condition is tough.... there is no exact answer.... 		
		closedSet.add( check );

		check.node.links.forEach( neighbor=>{
			if( !neighbor ) return;
			neighbor = neighbor.to;
			var find;
			var node;
			if( closedSet.find( neighbor ) ) return;
			var newg = dist( check.node.point, neighbor.point ) + check.g;
			
			//if( newg > min_len ) return;
				
			if( find = openSet.find( neighbor ) ) {
				node = find.node;
				if( newg < find.node.g ) {
					node.f = ( newg + h1( neighbor ) )
					node.g = newg;
					
					if( find.prior ) {
						find.prior.next = node.next;  // unlink this
						openSet.link( node ); // relink into list
					} else {
						// it was already the first, and it's closer this way, so.... 
						// and sorted by distance
					}
					node.parent = check;
				}
			} else {
				node = openSet.add( neighbor, newg );
				node.parent = check;
			}
		} );
		
	}
	
	console.log( "closed length:", closedSet.length, openSet.length );

	if( min_node ) {
	nodes.push( min_node.node );
	
	var spot = min_node;
	while( spot ) {
		came_from.push( spot.node );
		spot = spot.parent;
	}

	if( logFind ) console.log( ("Completed find.") );
	}

	return nodes; // returns a list really.
}






function GetNodeData( node )
{
	if( node )
		return node.data;
	return null;
}

// ------------- Vector Math Utilities -----------------------------

function scale(v,s) {
	v['x'] *= s;
	v['y'] *= s;
	v['z'] *= s;
}
function sub2(r,a,b) {
	r.x = a['x']-b['x'];
	r.y = a['y']-b['y'];
	r.z = a['z']-b['z'];
}
function add2(r,a,b) {
	r.x = a['x']+b['x'];
	r.y = a['y']+b['y'];
	r.z = a['z']+b['z'];
}
function sub(a,b) {
	return {x:a['x']-b['x'],y:a['y']-b['y'],z:a['z']-b['z']};
}
function add(a,b) {
	return {x:a['x']+b['x'],y:a['y']+b['y'],z:a['z']+b['z']};
}

function len(v) {
	return Math.sqrt( v['x']*v['x']+v['y']*v['y']+v['z']*v['z'] );
}

const e1 = (0.00001);
function NearZero( n ) { return Math.abs(n)<e1 }

function crossproduct(pv1,pv2 )
{
   // this must be limited to 3D only, huh???
   // what if we are 4D?  how does this change??
  // evalutation of 4d matrix is 3 cross products of sub matriccii...
  return {x: pv2['z'] * pv1['y'] - pv2['y'] * pv1['z'], //b2c1-c2b1
	y:pv2['x'] * pv1['z'] - pv2['z'] * pv1['x'], //a2c1-c2a1 ( - determinaent )
	z:pv2['y'] * pv1['x'] - pv2['x'] * pv1['y'] }; //b2a1-a2b1
}
function dotproduct (  pv1, pv2 )
{
  return pv2['x'] * pv1['x'] +
  		   pv2['y'] * pv1['y'] +
  		   pv2['z'] * pv1['z'] ;
}

function addscaled(p,o,n,t) {
	p['x'] = o['x'] + n['x'] * t;
	p['y'] = o['y'] + n['y'] * t;
	p['z'] = o['z'] + n['z'] * t;
}

const EPSILON = 0.00000001

function COMPARE(  n1,  n2 )
{
	return ((a - b) < EPSILON && (b - a) < EPSILON);
}

function SetPoint( o,i) {
	if( i ) {
		o['x'] = i['x'];
		o['y'] = i['y'];
		o['z'] = i['z'];
		return;
	}
	return {x:o['x'],y:o['y'],z:o['z']};
}

function IntersectLineWithPlane(  Slope, Origin,  // line m, b
				  n, o,  // plane n, o
				timeRef )
{
	var a,b,c,cosPhi, t; // time of intersection

	// intersect a line with a plane.
	// dot(Slope,n)
	a = ( Slope['x'] * n['x'] +
			Slope['y'] * n['y'] +
			Slope['z'] * n['z'] );

	if( !a ) return 0;

	b = len( Slope );
	c = len( n );
	if( !b || !c )
	{
		console.log( ("Slope and or n are near 0") );
		return 0; // bad vector choice - if near zero length...
	}

	cosPhi = a / ( b * c );

	t = ( n['x'] * ( o['x'] - Origin['x'] ) +
			n['y'] * ( o['y'] - Origin['y'] ) +
			n['z'] * ( o['z'] - Origin['z'] ) ) / a;

	//lprintf( (" a: %g b: %g c: %g t: %g cos: %g pldF: %g pldT: %g \n"), a, b, c, t, cosTheta
	//       , pl->dFrom, pl->dTo );
	//if( cosTheta > e1 ) //global epsilon... probably something custom
	if( cosPhi > 0 || cosPhi < 0 ) // at least some degree of insident angle
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
	console.log( `${n} = (${v['x']},${v['y']},${v['z']})`);
}

// from plane normal,origin to point
function PointToPlaneT(n,o,p) {
	//var t = [0];
	//var i = {x:-n['x'],y:-n['y'],z:-n['z']};
	//IntersectLineWithPlane( i, p, n, o, t );
	//return t[0];

	return ( n['x'] * ( p['x'] - o['x'] )
	       + n['y'] * ( p['y'] - o['y'] )
	       + n['z'] * ( p['z'] - o['z'] ) ) /
	    ( n['x'] * n['x']
	    + n['y'] * n['y']
	    + n['z'] * n['z'] );
}

//----------------------------------------------------------------------------
// list utility - fill in null's then push....

function push( arr, el ){
	var i = arr.findIndex( (e)=>e===null );
	if( i >= 0 ) arr[i] = el;
	else arr.push( el );
}

if( typeof exports === "undefined" ) exports = {};

exports.Web = makeWeb;
exports.FindNearest = FindNearest2;
//exports.FindNearest2 = FindNearest2;
exports.add = add;