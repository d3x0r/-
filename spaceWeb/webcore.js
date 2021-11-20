// create a 'main' for this project...

const DEBUG_ALL = false;
const debugBreakLink= false || DEBUG_ALL;
const debugInvalidate = false || DEBUG_ALL;
const debugValidate = true || DEBUG_ALL;
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

class Vector {
	x=0;
	y=0;
	z=0;
	#dirty = false;
	#len = 0;
	#tmp = null;
	constructor() {
	}
	set(x,y,z) { if(x instanceof Vector){this.x=x.x;this.y=x.y;this.z=x.z;this.#dirty=x.#dirty;this.#len=x.#len; return this; } this.x = x; this.y = y; this.z = z; this.#dirty = true; return this.update(); }
	scale(s) { this.x *= s; this.y *= s; this.z *= s; this.#dirty = true; return this; }
	sub(a,b) { this.x=a.x-b.x; this.y=a.y-b.y; this.z=a.z-b.z; this.#dirty = true; return this; }
	add(a,b) { this.x=a.x+b.x; this.y=a.y+b.y; this.z=a.z+b.z; this.#dirty = true; return this; }
	update() { if( this.#dirty ) { this.#dirty = false; this.#len = Math.sqrt( this.x*this.x + this.y*this.y + this.z*this.z ) } return this }
	get len() { if( this.#dirty ) return this.update().#len; else return this.#len; }
	crossproduct( v1,v2 ) { this.x = v2.z*v1.y-v2.y*v1.z; this.y = v2.x*v1.z-v2.z*v1.x; this.z = v2.y*v1.x-v2.x*v1.y; this.#dirty = true; return this; }	
	dot(v) { return v.x*this.x+v.y*this.y+v.z*this.z; }
	deldot(v,vo) { return (v.x-vo.x)*this.x+(v.y-vo.y)*this.y+(v.z-vo.z)*this.z; }
	addscaled( o, n, t ) { this.x = o.x + n.x*t; this.y = o.y + n.y*t; this.z = o.z + n.z*t; this.#dirty = true; return this; }
	dist(v) { const tmp = (this.#tmp = this.#tmp|| new Vector()); return tmp.sub(this,v).len; }

}


const tmp1 = new Vector();
const tmp2 = new Vector();
const tmp3 = new Vector();
const tmp4 = new Vector();
const tmp5 = new Vector();

const webLinkDataPool = [];

class LinkData {
	paint=0; // when drawing.. mark the links as drawn.
	plane = { o:new Vector(),
		n:new Vector(),
		t:new Vector(),
		ends:{from:0,to:0}, // in 2d, the 'plane' is a line... space requires differnt boundaries
		bounds:[]  // in 3d, bounds is used for the boundary on the intersection plane.
	};
	from = null // weblink
	to = null  // WEBLINK
	delete(){
		webLinkDataPool.push( this )
	}
} 

var makeWebLinkData = ()=>{
	var linkData = webLinkDataPool.pop();
	if( !linkData )
		linkData = new LinkData();
	else {
		linkData.from = null;
		linkData.to = null;
		linkData.paint = null;
	}
	return linkData;
}

const webLinkPool_ = [];
const webLinkPool = [];
function makeWebLink(i,node,data){
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
}


const webNodePool = [];


class WebNode {

	point = new Vector();
	radius = 1 // how big this area is... areas cannot overlap either?
	t = 0 // internal usage... keeps last computed t
	flags = {
		bLinked : 1,
		bDeleted : 1,
		bBucketed : 1,
		bNegative : 1, // two negatives are a null, two postiives are a null, a positive is allowed entity space.
	}
	// island is a debug check - it's a color to make sure all nodes are within the web.
	// all nodes are contained in a seperate list for debug purposes...
	island = 0|0;
	paint = 0;
	near_count = 0;
	id = 0;
	// keep this, but migrate the name... otherwise we'll miss translation points...
	//PLIST near_nodes,  // link through an edge

	links = [];

	web = null; // have to find root node to find islands (please make this go awawy)
	constructor(web) {
		this.web = web;
	}
	data = null;
	countNear (){
		var n = 0;
		this.links.forEach( l=>{if(l)n++} )
		return n;
	}

	isOrphan (){
		if( this.flags.bLinked )
		{
			orphanCounter++;
			var c = this.countNear( node );
			return (c == 0)?this:0;
		}
		return 0;
	}
	isIsland  (  psv )
	{
		// seek root...
		if( this.island && this.island !== psv )
		{
			console.log( "Node %p not signed.", node );
			return node;
		}
		return 0;
	}
	signIsland  ( value )
	{
		if( this.flags.bLinked )
		{
			if( this.island == value )
				return;
			if ( DEBUG_ALL )
				console.log( ("node %p is island %d"), node, value );
			this.island = value;
			this.links.forEach( l=>l&&l.this.signIsland( value ))
		}
	}
	unsignIsland ( old_value, value )
	{
		if( this.flags.bLinked )
		{
			if( this.island != old_value )
				return;
			if ( DEBUG_ALL )
				console.log( ("node %p is island %d"), node, value );

			this.island = value;
			this.links.forEach( l=>{ if( l.node.island === old_value ) l.node.unsignIsland( old_value, value ) } );
		}
	}
	findIslands ()
	{
		var web = this.web;
		var orphan;
		orphanCounter = 0;
		web.zzz++;
		web.root.signIsland( web.zzz );
		return web.nodes.find( n=>n.isIsland( web.zzz ) );
	}
	relinkANode(  newNode,  final ) {
		var current = this;
		var linked = false;
		const list = [];
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

		FindNearest2( list, path, boundLinks, newNode, this.web.extents, newNode.point, paint );

		console.log( "potential:", list );
			if( debugRelink ) console.log( "Find found", list );
			{
				for( let idx = 0; idx < list.length; idx++ ) {
					const near_node = list[idx];
					let near2;
					if( !near_node ) break;
					//console.log( "nearest is %d %d %d", GetMemberIndex( SPACEWEB_NODE, &near_node.web.nodes, near_node ),
					//    (int32_t)newNode.point[0], (int32_t)newNode.point['z'] );
					for( var idx2 = idx+1; idx2 < list.length; idx2++ ) {
						const near2 = list[idx2];
						if( !near2 ) continue;
						if( IsWithin( newNode, near_node, near2 ) ) {
							// near_node is closer than near2; near2 is not needed.
							list[idx2] = null;
						}
						else if( IsBeyond( newNode, near_node, near2 ) ) {
							// near2 is closer than the near node, so the near_node isn't relavent
							list[idx] = null;
						}else {
							// both list[idx] and list[idx2] should probably be checked
						}

					}
				}
		
				for( let idx = 0; idx < list.length; idx++ ) {
					const near_node = list[idx];
					if( !near_node ) continue;
					// in this place, I am near myself... but
					// I should never link myself to me
					if( near_node == newNode ) {
						console.log( 'found self')
						continue;
					}
					scanNodes(near_node)
					function scanNodes( near_node ) {
						if( debugRelink )console.log( "make real link")
						let linkTo = near_node.links.length?false:true;
						near_node.links.forEach( (nearNeighb)=>{
							// already linked...
							if( !nearNeighb ) return;
							if( newNode == nearNeighb.to ) return;
					        
							if( IsBeyond( newNode, near_node, nearNeighb.to ) )
								nearNeighb.to.link( newNode );
															
							else if( IsWithin( newNode, near_node, nearNeighb.to ) )
								linkTo = true;
								//near_node.link( newNode );
							else {
								//scanNodes( nearNeighb.to );	
								linkTo = true;
							}
						} );
					        
						if( linkTo )
							near_node.link( newNode );
					}
					//ValidateLink( near_node, newlink,newNode );
				}


				for( let idx = 0; idx < newNode.links.length; idx++ ) {
					const node1 = newNode.links[idx].to;
					for( let idx2 = idx+1; idx2 < newNode.links.length; idx2++ ) {
						const node2 = newNode.links[idx2].to;
						if( IsWithin( node1, newNode,node2 ) ) {
							console.log( "breaking old link..." );
							node1.breakSingleNodeLink(node2);

						}
					}
				}
				//newNode.invalidateLinks( null, 1 );

				boundLinks.forEach( (link)=>{
					var from = link.data.from.node;
					var to = link.data.to.node;
					
					var t;
					console.log( "Checking boundary that was ", NodeIndex( from ), NodeIndex( to ), NodeIndex(newNode) );
					tmp1.sub( newNode.point, from.point );
					t = PointToPlaneT( from.point, tmp1, to.point );
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
	}
	getLink  ( other )
	{
		var link = this.links.findIndex( link=> link && ( link.to === other || link.from === other ) )
		if( link >= 0 )
		{
			var result = other.links.findIndex( link=> link && (link.to === this || link.from === this ) )
			if( result < 0 )
				throw new Error( "Node is not a reflected link", this, other );
			return {a:this.links[link],b:other.links[result],ai:link,bi:result};
		}
		else
		{
			var result = other.links.find( link=>{
				if( !link ) return false;
				if( link.to == this )
					throw new Error( "Node is not a reflected link", this, other );
			});
		}
		return null;
	}
	isLinked  ( other )
	{
		var link = this.links.findIndex( link=> link && ( link.to === other || link.from === other ) )
		if( link >= 0 )
		{
			if( paranoidLinkTest ) {
				var result = other.links.find( link=> link && (link.to === this || link.from === this ) )
				if( result < 0 )
					throw new Error( "Node is not a reflected link", this, other );
			}
			return link;
		}
		else
		{
			var result = other.links.find( link=>{
				if( !link ) return false;
				if( link.to == this )
					throw new Error( "Node is not a reflected link", this, other );
			});
		}
		return null;
	}

	migrateLink( p_dest ) {
		var any_node = null;
		var check;

		this.web.updateExtents( p_dest );

		if( debugMigrate )
			console.log( ("------ Begin a migration(%d) ----------"), NodeIndex( this ) );

		{
			var any_near = null;
			var check;

			// self's links maybe invalid now... so, use the regular check on this this
			check = this.links.find( (check)=>{
				if( !check ) return;
				var t;
				tmp1.sub( check.node.point, this.point );
				t = PointToPlaneT( this.point, tmp1, p_dest );
				if( debugMigrate ) console.log( ("%d.%d  %g"), NodeIndex( this ), NodeIndex( check.node ), t );
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
				FindNearest2( pListNear, []/* unused result of where it already came from */, boundLinks, this, this, p_dest, 0 );
				{
					var near_node;
					var near_link;
					var near2;
					pListNear.forEach( (near_node)=>{
						if( debugMigrate ) console.log( "node is near...", NodeIndex( near_node ) );
					})
					this.links.forEach( near_link=>{
						this.breakSingleNodeLink(  near_link.node );
					})

					this.links.forEach( (near_link)=>{
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
							this.breakSingleNodeLink(  near_node );
						}

					})
						//DebugBreak();
					pListNear.forEach( (near2)=>{
						var near_node = this.links.forEach( (near_link)=>{
							if( near2 ==- near_link.node )
							{
								return near2;
							}
						});
						if( !near_node )
						{
							if( debugMigrate ) console.log( ("%d was not a link... adding it"), NodeIndex( near2 ) );
							this.link(near2 );
						}
					})
					boundLinks.forEach( (link)=>{
						var from = link.data.from;
						var to = link.data.to;
						var t;
						tmp1.sub( from.point, this.point );
						t = PointToPlaneT( this.point, tmp1, to.point );
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
				FindNearest2( pListNear, []/*unused result*/, boundLinks, this, this, p_dest, 0 );
				{
					pListNear.forEach( (near_node)=>{
						if( near_node == this )
							return;
						if( debugMigrate ) console.log( ("node %d is near..."), NodeIndex( near_node ) );
						if( IsNodeWithin( this, p_dest, near_node ) )
						{
							near_node.link( this );
							ValidateLink( near_node, p_dest, this );
						}
						else
							if( debugMigrate ) console.log( ("yeah... but it's not within our bounds...") );

					})
				}

				this.invalidateLinks( p_dest, 0 );

			}

			this.point.set( p_dest );

			//migrating = 0;
			return;
		}

		// migrate this node...
		if( debugMigrate ) console.log( ("migration - first - check validity uhhmm... between node(near) and node(near(near)) from (near) to (near(near)) vs point") );
		this.links.forEach( (check)=>{
			var check2;
			if ( DEBUG_MIGRATE )
			if( NEAR( this.point, check.point ) )
			{
				// points are invalid, cause they are the same point.
				console.log( ("die...") );
			}
			check.node.links.forEach( check2=>{

				if( check2.node == this )
					return;

				{
					tmp1.sub( check2.node.point, check.node.point )
					var t = PointToPlaneT( tmp1, check2.node.point, node.point );
					if ( DEBUG_MIGRATE )
						console.log( ("point is %g ..."), t );

					if( t >= 2.0 )
					{
						if ( DEBUG_MIGRATE )
							console.log( ("point is invalid.  checknode is above another plane near node") );
						this.unlink();
						if ( DEBUG_MIGRATE )
							console.log( (" -- unlink finished, now to link... ") );
						check2.node.link( this );
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
						//migrating = 0;
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
			for( idx = 0; idx < this.links.length; idx++ ) {
				var check = this.links[idx];
				for( var idx2 = idx+1; idx2 < this.links.length; idx2++ )
				{
					check2 = this.links[idx2];
					if( debugMigrate ) console.log( ("compare %d v %d"), idx2, idx );
					// this is certainly one way to do this :)
					if( check.data != check2.data )
					{
						var okay = 1;
						//var idx3;
						var check3;
						var t;
						check.node.links.find( (check3)=>{
							tmp1.sub( check3.node.point, check.node.point );
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
								tmp1.sub( check3.node.point, check2.node.point );
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
		//migrating = 0;
	}

	breakSingleNodeLink( other )
	{
		if( debugBreakLink )
			console.log( ("Seperate nodes %d and %d"), NodeIndex( this ), NodeIndex( other ) );
		var link;
		if( link = this.getLink( other ) )
		{
			other.links[link.bi] = null;
			other.near_count--;

			this.links[link.ai] = null;
			this.near_count--;

			// delete is just a push into a pool.
			link.a.delete();
			link.b.delete();
			link.a.data.delete();
		}
		else
			if( debugBreakLink )
				console.log( ("Link didn't exist."), NodeIndex( this ), NodeIndex( other ) );
	}

	// this does have an 'affinity' or directionality...
	link( linkto )
	{
		var linked_data;
		if( this == linkto )
			throw new Error( "Attempt to link to itself" );
		var oldLink;
		if( oldLink = this.isLinked(  linkto ) )
		{
			//console.log( ("Link already exists...(%d to %d)"), NodeIndex( this ), NodeIndex( linkto ) );
			return this.links[oldLink-1];
		}
		//console.log( ("link %d to %d"), NodeIndex( this ), NodeIndex( linkto ) );

		{
			var data = makeWebLinkData( );
			var link = makeWebLink( false, this, data );

			data.plane.o.set( this.point );
			console.log( "link data plan o is set now to:", data.plane.o, this.point );
			data.plane.n.sub( linkto.point, this.point );
			data.plane.t = new Vector().set( data.plane.n['z'], data.plane.n['y'],-data.plane.n['x'] );
			//data.plane.ends['from'] = -2.5;
			//data.plane.ends['to'] = 2.5;

			data.plane.o.addscaled( data.plane.o, data.plane.n, 0.5 );

			data.from = link;

			push( this.links, link );
			this.near_count++;

			link = makeWebLink( true, linkto, data );
			data.to = link;

			push( linkto.links, link );
			linkto.near_count++;
			return link;
		}
	}

	unlink() {
		var needs_someone = null;
		var anyone_else = null;
		var linked;
		var linked_list = [];
		var prior = this.island;
		for( var e = 0; e < 6; e++ ) {
			if( this.web.extents[e] === this ) {
				this.web.extents[e] = null;
			}
		}
		if( this.web.root == this )
		{
			if ( DEBUG_ALL )
				console.log( ("Going to have to pivot root.") );
			this.links.forEach( linked=>{
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
					console.log( ("Safely break each link between %p and %p"), this, linked );
				this.breakSingleNodeLink( linked.node );
			})
			linked_list.forEach( linked=>{
				linked.node.invalidateLinks(null, 0 );
			})
			this.web.root = anyone_else.node;
		}

		anyone_else = null;
		if ( DEBUG_ALL )
			console.log( ("Eiher we pivoted the root, and have no links, or search naers...") );

		this.links.forEach( linked=>{
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
				console.log( ("okay now we can break all links... %p to %p"), this, linked );
			this.breakSingleNodeLink( linked.node );
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
			console.log( ("Reinsert %p"), this );
	}
	invalidateLinks  ( new_point, bPrevalLink )
	{
	        for( var idx = 0; idx < this.links.length; idx++ ) {
			var _check = this.links[idx];
			if( !_check ) return;
			var check = (_check.to);
			var _check2;
			tmp1.sub( check.point, new_point?new_point:this.point );
			for( var idx2 = idx + 1; idx2 < this.links.length; idx2++ )
			{
				var _check2  = this.links[idx2];
				if( !_check2 ) continue;
				var check2 = (_check2.to);
				if( check === check2 ) {
					// this is linked to itself.
					continue;  // node has a link to this twice?
				}
				// test check2 point above node.check1
				var other = check2;
				var t = PointToPlaneT( new_point || this.point, tmp1, other.point );
				{
					// test check point above node.check2
					tmp2.sub(  other.point, new_point||this.point )
					var t2 = PointToPlaneT( new_point||this.point, tmp2, check.point );
					//#if ( DEBUG_ALL )
					if( debugInvalidate )
						console.log( ("Hrm..%d(base) %d vs %d %g  %g"), NodeIndex( this ), NodeIndex( check ), NodeIndex( other ), t, t2 );
					
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

						if( !PrevalLink( check, check2, this, new_point ) ) {
							check2.breakSingleNodeLink( this );
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
						if( PrevalLink( check2, check, this, new_point ) )
						{
							this.links.forEach( (near_node)=>{

								if( !near_node || near_node.node == check2 )
									return;
								if( near_node.node == check )
									return;
								if( CameThrough( this, null, check, near_node.node ) )
								{
								}

								if( CameThrough( this, new_point, check, near_node.node ) )
								{
									if( debugInvalidate ) console.log( ("maybe we have to spare this link?") );
								}
							})
							check.breakSingleNodeLink( this );
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
	}


	move( v ) {
		this.migrateLink( v );
	}
	delete (){ webNodePool.push( this ); }


}

function makeWebNode( ) {
	//struct spaceweb_node
	var node= webNodePool.pop();

	if( !node )
		node = new WebNode(this);
	else {

	}
	push( this.nodes, node );

	return node;
};

class SpaceWeb {

	ok = 0;

	nodes = [];
	root = null;
	links = [];
	link_data = [];
	extents = []; // list of nodes that are at extremes...
	zzz = 0;
	makeWebNode = makeWebNode;
//--------------------------------------------------------------------------------------------
// tests and validations
//--------------------------------------------------------------------------------------------

	findOrphans(){
		orphanCounter = 0;
		if(  this.nodes.forEach( orphan=>orphan.isOrphan() ) )
		{
			if( this.ok )
				throw new Error( "Orphaned.")
				//debugger;
		}
		// if we orphanCounter to more than 1... then we can break if fail.
		if( orphanCounter > 1 )
			this.ok = 1;
	}
	insert( pt, psv ) {
		var node = this.makeWebNode();
		node.point = new Vector().set( pt.x,pt.y,pt.z );
		node.data = psv;
		//logFind = 1;
		this.relinkNode( node );
		this.addExtent( node );
		//logFind = 0;
		node.flags.bLinked = 1;
		return node;
	}
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
	}
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
	}
	relinkNode(node ) {
		if( !this.root )
		{
			this.root = node;
			return;
		}
		this.root.relinkANode( node, 0 );
	}
	rebuild() {
		this.nodes.forEach( (n)=>{
			n.links.forEach( linked=>linked && n.breakSingleNodeLink( linked.to ) );
		} );
		this.root = null;
		this.nodes.forEach( (n)=>{
			this.relinkNode( n );
		})
		return;
	}


}

function makeWeb() {
	//struct spaceweb
	var web = new SpaceWeb();
	return web;
}
makeWeb.Vector = Vector;



var update_pause = 50000;

// return the(a) node that invalidates this link... (it's beyond this. (may be others))
function IsNodeWithinEx(  node, new_point,  test_node, new_test_point )
{
	console.log( "This within isn't updated..." );
	var link = node.links.find( (link)=>{
		if( !link || link.node == test_node )
			return false;

		var t;
		t = PointToPlaneT( link.data.plane.o, link.data.plane.n, new_test_point?new_test_point:test_node.point );
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
//IsWithin( newNode, near_node,nearNeighb.to ) )
//  newNode to new_node < newNode to neighb.to

// to reiterate, from node to check2, if check1 is between these two, then it is within.
//  if check1 beyond check2 from node, it is not within.

// origin = node
// P1 = check1-node
// P2 = check2-node
// R = check1-check2
//   P2 - R > P1
//  P1 < P2-R
// P1+R < P2
// then check1 is within check2
function IsWithin(  node, check1, check2 )
{
	tmp1.sub( check1.point, node.point ); // dist to origin (P1)
	tmp2.sub( check1.point, check2.point ); // dist between check points (R)
	tmp3.sub( check2.point, node.point ); // dist to origin (P2)

	const l1 = tmp1.x*tmp1.x+tmp1.y*tmp1.y+tmp1.z*tmp1.z ;
	const l2 = tmp2.x*tmp2.x+tmp2.y*tmp2.y+tmp2.z*tmp2.z ;
	const l3 = tmp3.x*tmp3.x+tmp3.y*tmp3.y+tmp3.z*tmp3.z ;
	if( l1+l2 < l3 ) return true;
	return false;
}
// e-r-xy parabolic cone
// xy-r-e plane
/*
I'm a little confused; why is this a different graph - one is a plane, the other is a parabolic cone; I'm not really sure why (and probably doesn't matter).  
I have 3 points, P1, P2, R(=P2-P1); from here the following is the square lengths of those vectors....   
// P1-R-P2 parabolic cone  
// P2-R-P1 plane ;
  (varying P2 with a fixed P1)

- one is x^2-x^2 the other is -x^2-x^2 or 2x^2 for x,y plane
*/


// if is within cannot be beyond, and if beyond cannot be within
//  and is otherwise standalone (but only if not within or beyond)
function IsWithoutAhead( node,check1,check2 ) {
	return !IsWithin( node,check1,check2 )  && !IsBeyond( node,check1,check2 );
}

// checks to see if check1 is beyond node to check2.
//  // target point - relative > 
// k(p,q)>pp+qq
// pq = P2
// k(pq)=P1.length-R.length
// P1.length-R.length > P2.length
// P1 = check1-node
// p2 = check2-node
//   P1-R> P2

//  true if node to check2 to check1 is less than node to check1 
//  true if node to check1 minus check1 to check2 is greater than  check2
// then check1 is beyond check2.
function IsBeyond(  node, check1, check2 )
{
	tmp1.sub( check1.point, node.point ); // dist to origin (P1)
	tmp2.sub( check1.point, check2.point ); // dist between check points (R)
	tmp3.sub( check2.point, node.point ); // dist to origin (P2)
 
	const l1 = tmp1.x*tmp1.x+tmp1.y*tmp1.y+tmp1.z*tmp1.z ;
	const l2 = tmp2.x*tmp2.x+tmp2.y*tmp2.y+tmp2.z*tmp2.z ;
	const l3 = tmp3.x*tmp3.x+tmp3.y*tmp3.y+tmp3.z*tmp3.z ;
	if( l1-l2 > l3 ) return true;
	return false;
}


// confirm that node to check1 and check2 is valid...
function CameThrough(  node,  new_point,  check1,  check2 )
{
	//console.log( ("checking to see if %d<.%d<.%d"), NodeIndex( check1 ), NodeIndex( node ), NodeIndex( check2 ) );
	
	{
		var t;
		tmp1.sub( check1.point, new_point?new_point:node.point )
		t = PointToPlaneT( new_point?new_point:node.point, tmp1, check2.point );
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
function IsBeyond_old(  node,  new_point, check1, check2 )
{
	//console.log( ("checking to see if %d<.%d<.%d"), NodeIndex( node ), NodeIndex( check1 ), NodeIndex( check2 ) );
	
	{
		var t;
		tmp1.sub( check1.point, new_point?new_point:node.point )
		t = PointToPlaneT( check1.point, tmp1, check2.point );
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
				tmp3.sub( check_near.node.point, check2.point )
				t3 = PointToPlaneT( check_near.node.point, tmp3, check.point );
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
				tmp3.sub( check_near.node.point, check.point )
				t3 = PointToPlaneT( check_near.node.point, tmp3, check2.point );
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


function intersectLinks( node ){
	var m, n;
	for( m = 0; m < node.links.length; m++ )
		for( n = m+1; n < node.links.length; n++ ) {
			var link1 = node.links[m];
			var link2 = node.links[n];
			var intersect = FindIntersectionTime( link1.data.plane.t, link1.data.plane.o, link2.data.plane.t, link2.data.plane.o );
			if( intersect ) {
					tmp1.sub2( link1.to.point, node.point );
					tmp2.sub2( link2.to.point, node.point );
					var dot = dotproduct( tmp1, tmp2 );
					if( dot > 0 ) {
						link1.data.plane.ends.to = intersect.t1;
						link2.data.plane.ends.from = intersect.t2;
					} else {
						link1.data.plane.ends.from = intersect.t1;
						link2.data.plane.ends.to = intersect.t2;
					}
					// plane is sourced from the far side... and normal points at me.
			}
		}
}

// makes suare all links from here are valid for myself
// (if they are valid for what they are linked to, they must also stay
// near_node
function ValidateLink( resident, new_link, node )
{
	var near2;
	var link;
	// node was recently linked to this resident node (already belongs to the web).

	// this checks all other links from near_point (the resident)
	// versus this new point, if the point is beyond this new point, then
	// migrate a link to node from the resident

	// from resident . node delta
	if( resident.links.length > 1 )
		intersectLinks( resident );

	resident.links.forEach( (link)=>{
		if( !link ) return;
		var t;
		var t2;
		var data = link.data;
		// don't check the node against itself.
		near2 = link.to;
		if( near2 == node )
			return;

		// compare node base point versus near2 (the relative of near that I'm linked against)
		t = PointToPlaneT( data.plane.o, data.plane.n, node.point );
		if( link.invert ) t = -t;
		t += 0.5;

		t2 = PointToPlaneT( data.plane.o, data.plane.t, node.point );
		if( Math.abs(t) < Math.abs(t2) )
			return;
		//t2 = PointToPlaneT( new_link.data.plane.o, new_link.data.plane.n, near2.point );

		if( debugValidate ){
			console.log( ("%d.%d v %d is"), NodeIndex( resident ), NodeIndex( node ), NodeIndex( near2 ), t, t2 );
			console.log( ` points: ${resident.point.x},${resident.point.y},${resident.point.z}  ${node.point.x},${node.point.y},${node.point.z}  ${near2.point.x},${near2.point.y},${near2.point.z}   data.plane.o ${data.plane.o} `)
		}

		if( t2 > -0.5 && t2 < 0.5 )
		{
			node.link( near2 );
		}
		if( t > -0.5 && t < 0.5 )
		{
			if( debugValidate )
				console.log( ("So we steal the link to me %d , and remove from resident %d  (%d)")
						, NodeIndex( node ), NodeIndex( resident ), NodeIndex( near2 ) );
			// one for one exchange
			
			if( t > -0.5 && t < 0.5 )
			{
				var newLink = node.link( near2 );
				node.link( resident );
				resident.breakSingleNodeLink( near2 );
				ValidateLink( near2, newLink, node );
			}
			//node.link(resident );

		//	if( IsNodeWithin( near2, null, resident ) )
			//	BreakSingleNodeLink( resident, near2 );
			//console.log( ("And again validate my own links? considering the near2 as resident and me new") );
			//ValidateLink( near2, null, node );
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
				tmp1.sub( otherCheck.point, current.point )
				t = PointToPlaneT( current.point, tmp1, to );
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
			tmp1.sub( otherCheck.point, current.point )
			t = PointToPlaneT( current.point, tmp1, to );

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
		tmp1.sub(  node2.point, to );

		came_from.forEach( (node)=>{
			if( node == node2 )
				return;
			t = PointToPlaneT( to, tmp1, node.point );
			if( t < 1 ) {
				// could be added...
				if( !nodes.find( (node3)=>{
					if( node3 == node2 ) return false;
					if( node3 == node ) return false;
					tmp2.sub( node3.point, to );
					t = PointToPlaneT( to, tmp2, node.point );
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


function h1( here, to ) {
	return to.dist( here.point );
}


class SetNode {
	node= null
	checked = false
	f=null
	g=0
	h=0
	next = null  // link in set
	parent = null   // link backward from success

	constructor() {}

	set( n, g, to ) {
		if( !to ) throw new Error( "To is a required parameter now.." );
		this.node = n;
		this.g = g;
		this.f = h1(n,to)+g;
	}
}

class NodePool {
	first= null;
	get() {
		if( this.first ) {
			const r = this.first;
			this.first = this.first.next;
			r.next = null;
			return r;
		}else
			return new SetNode();
	}
	drop(n) {
		let last; for( last = n; last.next; last=last.next );
		last.next = this.first;
		this.first = n;
	}
}

const pool = new NodePool();

class OpenSet {
       
	first = null
	length = 0
	has = new WeakMap();
	
	add(n, g, to) {
		const old = this.find(n);
		
		if( !old ) {
			const newNode = pool.get();
			newNode.set( n, g, to );
			this.link( newNode );
			this.length++;
			this.has.set( n, newNode );
			return newNode;
		}
		return old;
	}
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
	}
	find(n) {
		const old = this.has.get(n);
		return old;
	}
	pop() {
		const n = this.first;
		if( n ) {
			this.length--;
			this.first = this.first.next;
			n.next = null;
			this.has.delete( n.node );
		}
		return n;
	}

}

class ClosedSet  {
	first = null
	length  = 0
	has = new WeakMap();
	add(n) {
		n.checked = true;
		this.has.set( n.node, n );
		if( !this.first )
			this.first = n;
		else {
			n.next = this.first;
			this.first = n;
		}
		this.length++;
	}
	find(n) {
		const old = this.has.get(n);
		return old;
	}
	empty() {
		if( this.first )
			pool.drop( this.first );
	}
};


function FindNearest2( nodes, came_from, boundaries, targetNode, from,  to_,  paint )
{
	const to = to_;
	if( !from ) {
		console.log( "Have to specify somewhere to start from...." );
		return;
	}
	const ton = {point:to_}; // convert 'to' to a 'node'

	const openSet = new OpenSet();
	var closedSet = new ClosedSet();

	if( from instanceof Array )
		for( let a of from )
			openSet.add( a, 0, to );
	else
		openSet.add( from, 0, to );
	var check;
	var min_dist = Infinity;
	var min_len = Infinity;
	var min_node = null;
	var possibles = [];
	while( check = openSet.pop() ) {
		//possibles.push( { node:check.node, from:check.node } );
		if( check.node === targetNode ) {
			min_node = check;
			min_dist = 0;
			break;
		}
		var nearness = h1( check.node, to );
		if( nearness < min_dist ) {
			if( check.g < min_len ) {
				min_len = check.g;
			}
			min_node = check;
			min_dist = nearness;
		}
		// win condition is tough.... there is no exact answer.... 		
		closedSet.add( check );

		// if we did link to 'check'
		tmp1.sub(  to, check.node.point );
		if( !check.node.links.length )
			possibles.push( { node:check.node, from:check.node } );

		check.node.links.forEach( neighbor_=>{
			if( !neighbor_ ) return;
			var neighbor = neighbor_.to;
			var find;
			let closed = false;
			var node;
			var newg = check.node.point.dist( neighbor.point ) + check.g;

			if( !closedSet.find( neighbor ) ){

				if( IsWithin( check.node, neighbor, ton ) ) {
					console.log( "neighbor is closer to 'to', so go there...", check.node.point, to,neighbor.point );
					openSet.add( neighbor, newg, to ); // move towards this point via this neighbor.
					return;
				}
				// if to is past neighbor, then neighbor is a better candiate.
				if( IsBeyond( check.node, ton, neighbor ) ) {
					console.log( "to is past neighbor, so go there...", check.node.point, to,neighbor.point );
					openSet.add( neighbor, newg, to ); // move towards this point via this neighbor.
					return;
				}

				//console.log( "Already found neighbor was checked...", neighbor.point );
				// return; // already checked from here, don't check to here
			}else closed = true;

			if( possibles.length ) {
				console.log( "Possible candidates:", possibles.length );
				for( var p = 0; p < possibles.length; p++ ) {
					if( !possibles[p] ) continue;
					if( possibles[p].from === neighbor ) continue;
					//sub2( tmp2, to, possibles[p].from.point );
					if( IsWithin( ton, possibles[p].from, neighbor ) )
						possibles[p] = null;
					//var T = PointToPlaneT( possibles[p].from.point, tmp2, neighbor.point );
					//if( T > 0 && T < 1 )
					//   possibles[p] = null;
					//PointToPlaneT( )
				}

			if( IsWithin( check.node, neighbor, ton ) ) {
				console.log( "check to neighbor has ton within it" );
				if( !possibles.find( p=>p?p.node == neighbor:false )) 
					possibles.push( { node:neighbor, from:check.node } );
				else
					console.log( "already was possible.." );
			}

			else if( IsBeyond( check.node, ton, neighbor ) ) {
				console.log( "check to neighbor has ton within it" );
				if( !possibles.find( p=>p?p.node == neighbor:false )) 
					possibles.push( { node:neighbor, from:check.node } );
				else
					console.log( "already was possible.." );
			}else

				if( !possibles.find( p=>p?p.node == check.node:false )) {
					console.log( "Didn't already find node in possibles - just add it." );
					possibles.push( { node:check.node, from:check.node } );
				}
				//var T2 = PointToPlaneT( to, tmp1, neighbor.point );

				}else
					possibles.push( { node:check.node, from:check.node } );// add some node.


			
			//if( newg > min_len ) return;
			if( !closed )	
			if( find = openSet.find( neighbor ) ) {
				node = find.node;
				if( newg < find.node.g ) {
					node.f = ( newg + h1( neighbor, to ) )
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
				node = openSet.add( neighbor, newg, to );
				node.parent = check;
			}
		} );
		
	}
	

	for( var p = 0; p < possibles.length; p++ ) {
		if( !possibles[p] ) continue;
		//sub2( tmp2, possibles[p].node.point, to );
		for( var q = p+1; q < possibles.length; q++ ) {
			if( !possibles[q] ) continue;      
			//sub2( tmp2, possibles[q].node.point, to );
			if( IsBeyond( ton, possibles[p].node, possibles[q].node ) ) {
				console.log( "Removing a possible node, to->q is better than to->q" );
				possibles[p] = null;
				break;
			}
		}
	}

	
	//console.log( "closed length:", closedSet.length, openSet.length );
	possibles.forEach( p=>p?nodes.push(p.node):false);
	if(0)
	if( min_node ) {
		if( !nodes.find( node=>node===min_node.node ))
			nodes.push( min_node.node );
	
		var spot = min_node;
		while( spot ) {
			came_from.push( spot.node );
			spot = spot.parent;
		}

		if( logFind ) console.log( ("Completed find.") );
	}

	closedSet.empty(); // allow reusing nodes later.

	return nodes; // returns a list really.
}






function GetNodeData( node )
{
	if( node )
		return node.data;
	return null;
}

// ------------- Vector Math Utilities -----------------------------


const e1 = (0.00001);
function NearZero( n ) { return Math.abs(n)<e1 }

const EPSILON = 0.00000001

function COMPARE(  n1,  n2 )
{
	return ((a - b) < EPSILON && (b - a) < EPSILON);
}

function IntersectLineWithPlane(  Slope, Origin,  // line m, b
				  n, o,  // plane n, o
				timeRef )
{
	var a,b,c,cosPhi, t; // time of intersection

	// intersect a line with a plane.
	a = Slope.dot(n);

	if( !a ) return 0;

	b = Slope.len;
	c = n.len;
	if( !b || !c )
	{
		console.log( ("Slope and or n are near 0") );
		return 0; // bad vector choice - if near zero length...
	}

	cosPhi = a / ( b * c );
	
	t = n.deldot( o, Origin )/a;
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
function PointToPlaneT(o,n,p) {
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


function FindIntersectionTime( s1, o1, s2, o2) {
		var result = {
			t1: 0.0,
			t2: 0.0
		};
		var R1, R2, denoms;
		var t1, t2, denom;

		var a = (o1.x)
		var b = (o1.y)
		var c = (o1.z)

		var d = (o2.x)
		var e = (o2.y)
		var f = (o2.z)

		var na = (s1.x)
		var nb = (s1.y)
		var nc = (s1.z)

		var nd = (s2.x)
		var ne = (s2.y)
		var nf = (s2.z)

		function NearZero(denom) {
			return Math.abs(denom) < 0.00001;
		}
		denoms = crossproduct(s1, s2); // - result...
		denom = denoms.z;
		//	denom = ( nd * nb ) - ( ne * na );
		if (NearZero(denom)) {
			denom = denoms.y;
			//		denom = ( nd * nc ) - (nf * na );
			if (NearZero(denom)) {
				denom = denoms.x;
				//			denom = ( ne * nc ) - ( nb * nf );
				if (NearZero(denom)) {
					return null;
				} else {
					//DebugBreak();
					t1 = (ne * (c - f) + nf * (b - e)) / denom;
					t2 = (nb * (c - f) + nc * (b - e)) / denom;
				}
			} else {
				//DebugBreak();
				t1 = (nd * (c - f) + nf * (d - a)) / denom;
				t2 = (na * (c - f) + nc * (d - a)) / denom;
			}
		} else {
			// this one has been tested.......
			t1 = (nd * (b - e) + ne * (d - a)) / denom;
			t2 = (na * (b - e) + nb * (d - a)) / denom;
		}

		R1.x = a + na * t1;
		R1.y = b + nb * t1;
		R1.z = c + nc * t1;

		R2.x = d + nd * t2;
		R2.y = e + ne * t2;
		R2.z = f + nf * t2;

		// epsilon delta instead?
		function COMPARE(a, b) {
			return a === b;
		}

		if ((!COMPARE(R1.x, R2.x)) ||
			(!COMPARE(R1.y, R2.y)) ||
			(!COMPARE(R1.z, R2.z))) {
			return null;
		}
		result.t2 = t2;
		result.t1 = t1;
		return result;
	}



//----------------------------------------------------------------------------
// list utility - fill in null's then push....

function push( arr, el ){
	var i = arr.findIndex( (e)=>e===null );
	if( i >= 0 ) arr[i] = el;
	else arr.push( el );
}

//if( typeof exports === "undefined" ) exports = {};

export {makeWeb as Web};
export {FindNearest2 as FindNearest};
//exports.FindNearest2 = FindNearest2;
export {NodeIndex};
