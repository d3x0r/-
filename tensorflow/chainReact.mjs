

//---------------------------------------------------------------------------
//  BEGIN GAME LOGIC

const targetPlayer = 0;

const l = {
	
	players : [{id:0,active:false,count:0,moves:0},{id:1,active:false,count:0,moves:0}],
	rows : 5,
        cols : 8,
        sphere : false,
        board : [],
        ExplodeHead : 0,
        ExplodeTail : 0,
        Explode : [],
        currentPlayer : 0,
	tick : 0,
        updating_board_end : 0,
	timeOut : [],
	boardOut : [],
	lastPlay : {x:0,y:0},
	gameLog : [],
	noMoveMask : [],
	canMoveMask : [],
}

function clearBoard() {
	l.updating_board_end = 0; // allow board to update

}

function initBoard() {
        l.tick = 0;
	l.gameLog.length = 0;
	l.noMoveMask.length = 0;
	// no prior move
	l.lastPlay.x = -1;
	l.lastPlay.y = -1;

	l.winstate = null;
	l.players[0].count = 0;
	l.players[0].moves = 0;
	l.players[1].count = 0;
	l.players[1].moves = 0;

	l.currentPlayer = 0;
	l.board.length = 0;
	l.ExplodeHead = l.ExplodeTail = 0;
	l.Explode.length = 0;
	l.timeOut.length = 0;
	l.noMoveMask.length = 0;
	l.canMoveMask.length = 0;
	for( var r = 0; r < l.rows; r++ ) {
		l.board.push([]);
		for( var c = 0; c < l.cols; c++ ) {
			if( r && ( r < (l.rows-1) ) )
				l.timeOut.push(0.0);
			if( c && ( c < (l.cols-1) ) )
				l.timeOut.push(0.0);
			l.timeOut.push(0.0);
			l.timeOut.push(0.0);
			l.noMoveMask.push(0);
			l.canMoveMask.push(1);
			l.Explode.push( {x:0,y:0} );
			l.board[r].push( {player:-1,count:0} );
		}
	}
}


function dumpGame() {
	l.timeOut[l.tick] = 1.0;		
	var o = 0;
	for( var n = 0; n < l.rows; n++ ) {
		for( var m = 0; m < l.cols; m++ ) {
			//console.log( "PLAYER:", n, m, l.board[n][m].player, l.currentPlayer, !( ( l.board[n][m].player === -1 ) || ( l.board[n][m].player === l.currentPlayer ) ) );
			l.boardOut[7*o + 0] = ( l.board[n][m].player === targetPlayer /*l.currentPlayer*/ );
			l.boardOut[7*o + 1] = !( ( l.board[n][m].player === -1 ) || ( l.board[n][m].player === targetPlayer /*l.currentPlayer*/ ) );
			l.boardOut[7*o + 2] = ( l.board[n][m].player === -1 );

			l.boardOut[7*o + 3] = l.board[n][m].count > 0;
			l.boardOut[7*o + 4] = l.board[n][m].count > 1;
			l.boardOut[7*o + 5] = l.board[n][m].count > 2;
			l.boardOut[7*o + 6] = l.board[n][m].count > 3;

			if( l.boardOut[7*o+0] || l.boardOut[7*o+2] )
				l.canMoveMask[n*l.cols + m] = 1.0;
			else
				l.canMoveMask[n*l.cols + m] = 0.0;

			//l.boardOut[8*o + 7] = l.board[n][m].count > 4; // last game can have large counts.
			o++;
			
		}
	}

	var s = [];
	for( var n = 0; n < o; n++ ) {
			s.push(0);
	}

	l.gameLog.push( { 
		tick: l.timeOut.map( x=>x?1.0:0.0)
		, board:l.boardOut.map(x=>x?1.0:0.0)
		, canMove:l.currentPlayer === targetPlayer ?l.canMoveMask.map(n=>n):l.noMoveMask
		, lastMove:s
	} );
	// reset this tick mark for next.
	l.timeOut[l.tick] = 0.0;
	return l.tick++;
}

function putPiece(x,y,dx,dy){
		l.gameLog[l.gameLog.length-1].lastMove[x+(y*l.cols)]=1; // update the previous last move.  the last state has no move.
         	l.lastPlay.x = x;
		l.lastPlay.y = y;

			if( l.currentPlayer == targetPlayer && !l.players[0].moves ) {
				l.players.forEach( player=>player.active = true);
			}

			if( l.winstate )  {
				//alertForm.caption = "Game has been won!";
				//alertForm.show();
				return;
			}
			if( !l.board[y][x].count ){
				l.board[y][x].count = 1;
				l.board[y][x].player = l.currentPlayer;
				l.players[l.currentPlayer].count++;
				l.players[l.currentPlayer].moves++;
				CheckSquareEx( x, y, true );
			} else if( l.board[y][x].player === l.currentPlayer ) {
				l.board[y][x].count++;
				l.players[l.currentPlayer].count++;
				l.players[l.currentPlayer].moves++;
				CheckSquareEx( x, y, true );
			} else {
				return;
			}

			do {
				l.currentPlayer++;
				if( l.currentPlayer >= l.players.length )
					l.currentPlayer = 0;
			}while( !l.players[l.currentPlayer].active );
} 


function CheckSquareEx(  x, y,  explode )
{
	var c;
	if( l.sphere )
	{
		c = 4;
	}
	else
	{
		c = 2;
		if( x>0 && x < (l.cols-1) )
			c++;
		if( y>0 && y < (l.rows-1) )
			c++;
	}
	if( l.board[y][x].count >= c )
	{
		if( explode )
		{
			enqueCell( x, y );
		}
		return  true;
	}
	return  false;
}

function enqueCell(  x,  y )
{
	var n;
	// see if we enqueued this beast already!
	//printf( WIDE("Head: %d Tail: %d\n"), ExplodeHead, ExplodeTail );
	for( n = l.ExplodeTail; n != l.ExplodeHead; n++ )
	{
		if( n == (l.Explode.length) )
			n = 0;
		if( n == l.ExplodeHead )
			break;
		if( l.Explode[n].x == x && 
			l.Explode[n].y == y )
		{
			//printf( WIDE("Already Enqueued?\n") );
			return;
		}
	}
	//printf( WIDE("Head: %d\n"), ExplodeHead );
	l.Explode[l.ExplodeHead].x = x;
	l.Explode[l.ExplodeHead].y = y;
	l.ExplodeHead++;
	if( l.ExplodeHead == (l.Explode.length) )
		l.ExplodeHead = 0;
}

function dequeCell(  )
{
	if( l.ExplodeTail == l.ExplodeHead )
		return null;
	//printf( WIDE("Tail: %d\n"), ExplodeTail );
	var ret =  l.Explode[l.ExplodeTail];
	l.ExplodeTail++;
	if( l.ExplodeTail == l.Explode.length )
		l.ExplodeTail = 0;
	return ret;
}

function explodeInto( x, y, into_x, into_y )
{
	var real_into_x = into_x;
	var real_into_y = into_y;
	if( l.sphere )
	{
		if( into_x < 0 )
		{
			l.boardAtoms[y][x][l.board[y][x].count-1].wrap_x--;
			into_x += l.cols;
		}
		if( into_y < 0 )
		{
			l.boardAtoms[y][x][l.board[y][x].count-1].wrap_y--;
			into_y += l.rows;
		}
		if( into_x >= l.cols )
		{
			l.boardAtoms[y][x][l.board[y][x].count-1].wrap_x++;
			into_x -= l.cols;
		}
		if( into_y >= l.rows )
		{
			into_y -= l.rows;
			l.boardAtoms[y][x][l.board[y][x].count-1].wrap_y++;
		}
	}


	l.players[l.board[y][x].player].count--;
	l.board[y][x].count--;

	// if 0, 1
	if( l.board[into_y][into_x].count < 2 )
	{
		if( l.board[into_y][into_x].player >= 0 ) {
			l.players[l.board[into_y][into_x].player].count -= l.board[into_y][into_x].count;
			l.players[l.board[y][x].player].count += l.board[into_y][into_x].count;
		}
		//if( Board[into_y][into_x].player != Board[y][x].player )
		//	DrawSquare( into_x, into_y, false );
		l.board[into_y][into_x].player = l.board[y][x].player;
	}
	l.board[into_y][into_x].count++;
	l.players[l.board[into_y][into_x].player].count++;

	if( CheckSquareEx( into_x, into_y, false ) ) {
        	// if it wold explode, convert to this player.
                // and then do the explode now.
		l.players[l.board[into_y][into_x].player].count -= l.board[into_y][into_x].count;
		l.players[l.board[y][x].player].count += l.board[into_y][into_x].count;
		l.board[into_y][into_x].player = l.board[y][x].player;
	       	CheckSquareEx( into_x, into_y, true );
	}
}

function updateBoard(  )
{
	var exploded;
	var x, y;
	//improve this with a queue process...
	do
	{
		exploded = false;
		var cell;
		while( cell = dequeCell() )
		{
			const {x,y} = cell;
			exploded = true;

                        
			if( l.sphere || ( x > 0 ) )
			{
				explodeInto( x, y, x-1, y );
			}
			if( l.sphere || ( x < ( l.cols-1 ) ) )
			{
				explodeInto( x, y, x+1, y );
			}
			if( l.sphere || ( y > 0 ) )
			{
				explodeInto( x, y, x, y-1 );
			}
			if( l.sphere || ( y < ( l.rows-1 ) ) )
			{
				explodeInto( x, y, x, y+1 );
			}
                                
			if( !l.board[y][x].count )
				l.board[y][x].player = -1;
                              
                              
			if( !l.winstate )
			{
				doLose(); // check to see if we knocked out someone..
				if( l.winstate = findWinner() )
				{
					return true;
				}
			}
		}
	}while( exploded );

	return false;
}

function pickAiMove_generation_zero() {
	if( l.winstate )
		return;
		
	var n = (Math.random() * l.rows)|0;//l.RNG.getBits( 16 );
	var m = (Math.random() * l.cols)|0;//l.RNG.getBits( 16 );
	//n = ( l.rows * n / 65535 ) | 0;
	//m = ( l.cols * m / 65535 ) | 0;
	if( l.board[n][m].player < 0 || l.board[n][m].player == l.currentPlayer )
		putPiece( m, n, 0, 0 );
	else
		return pickAiMove_generation_zero();


}

function doLose() {
	// scan to see if someone is out entirely.
	l.players.forEach( player=>{
		if( player.active ) {
			if( !player.count ) {
				if( player.moves )
					player.active= false;
			}
		}
	})
}

function findWinner() {
	// is there no other players?
	var win = false;
	var winner = null;
	l.players.forEach( player=>{
		if( player.active ) 
			if( !winner ) { 
				winner = player;
				win = true;
			}
			else win = false;
	})
	if( win )
		return winner;
	return null;
}



function runGame() {
	initBoard();
	while( !updateBoard() ) {
		dumpGame();
		pickAiMove_generation_zero();
	}
	//console.log( "done", l.winstate, l.players );
	
	// capture wins only; let's try a positive reinfocement.
	if( l.winstate.id === targetPlayer ) {
		return l.gameLog;
		//l.gameLog.forEach( line=>console.log( line ) );
		//console.log( "
	}
}

//for( var n = 0; n < 500; n++ )
//	runGame();

const crInterface = {
	runGame : runGame,
	initBoard : initBoard,
	dumpGame : dumpGame,
	putPiece : putPiece,
	getGameLog() { return l.gameLog},
}

export default crInterface;