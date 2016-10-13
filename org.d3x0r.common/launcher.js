
var sequence = new Date.getTime();

function buildCommand( class_name, cmd, args ) {
var msg = "";
		if( listen_output )
 			msg += `~capturd${track_port}`;

		if( want_hide )
 			msg += "~hide";

		if( lpStartPath[0] )
			msg += `~path${lpStartPath}%`;

		if( class_name )
			msg += '$' + class_name;

			msg += sequence;
			if( want_reset ) msg += '@';
		 	else  					 msg += '#';
		}
		msg += cmd;
		msg += '\0';
		args.forEach( (arg)=>{ msg += arg; msg += "\0"; } );
		console.log( msg );

		sequence++;
}

/*
function getUtf8() {

}
function parseCommand( buf ) {
	var start = 0;
	var inbuf = new Uint8Array( buf );
	while( inbuf[0] === '~' )
	{
		if( )
		if( StrCaseCmpEx( inbuf+1, WIDE("capture"), 7 ) == 0 )
		{
			int port = 0;
			char c;
			bCaptureOutput = 1;
			inbuf += 8;
			while( (c = inbuf[0]),(c >='0' && c <= '9' ) )
			{
				port *= 10;
				port += c - '0';
				inbuf++;
			}
			if( port )
				capture_port = port;
		}
		if( StrCmpEx( inbuf+1, WIDE("hide"), 4 ) == 0 )
		{
			hide_process = 1;
			inbuf += 5;
		}
		if( StrCmpEx( inbuf+1, WIDE("path"), 4 ) == 0 )
		{
			// inbuf is not const, to recast.
			TEXTCHAR *end = (TEXTCHAR*)StrChr( inbuf+5, '%' );
			if( !end )
			{
				lprintf( WIDE("Failure to get end of path.") );
			}
			else
				end[0] = 0;
			StrCpy( start_path, inbuf + 5 );
			inbuf = end + 1;
		}
	}
	if( inbuf[0] == '~' )
	{
		// some error condition - bad option?  bad end of path?
		return;
	}
	/* check to see if the message has a class assicated, if not, process as normal
	if( inbuf[0] == '$' )
	{
		INDEX idx;
		CTEXTSTR class_name;
		if( class_names )
		{
			TEXTCHAR* tmp_sep = (TEXTCHAR*)StrChr( inbuf + 1, '^' );
			if( tmp_sep )
				tmp_sep[0] = 0;
			LIST_FORALL( class_names, idx, CTEXTSTR, class_name )
			{
				// has a class name, do we?
				// message has class, we have a class, check if it matches
				if( bLogPacketReceive )
					lprintf(WIDE( "Does %s == %s" ), inbuf + 1, class_name );
				if( CompareMask( inbuf + 1, class_name, 0 ) )
				{
					inbuf = tmp_sep;
					break;
				}
			}
			if( tmp_sep )
				tmp_sep[0] = '^';
			if( !class_name )
			{
				if( bLogPacketReceive )
					lprintf( WIDE("Command received, but not for my class" ) );
				return;
			}
		}
		else
		{
			if( bLogPacketReceive )
				lprintf( WIDE("Class name passed in packet, but I'm not listening to any class, so it's not for me." ) );
			return;
		}
	}
	if( !inbuf ) // malformed packet.
	{
		if( bLogPacketReceive )
		{
			lprintf( WIDE("Malformed packet..." ) );
			LogBinary( buffer, size );
		}
		return;
	}
	if( inbuf[0] == '^' )
	{
		bNulArgs = 1;
		inbuf++;
	}
	seqbuf = inbuf;
	inbuf = (TEXTCHAR*)StrChr( seqbuf, '#' );
	if( !inbuf )
	{
		inbuf = (TEXTCHAR*)StrChr( seqbuf, '@' );
		if( inbuf )
			restart = 1;
	}
	if( inbuf )
	{
		inbuf[0] = 0;
		inbuf++;
		if( StrChr( inbuf, '=' ) )
		{
			// build as a environvar...
			//also continue scanning for next part of real command
		}
		//LogBinary( (P_8)buffer, size );
		do
		{
			// keep a list of all sequences... and expire them at some point?
			_32 packet_sequence = (_32)IntCreateFromText( seqbuf );
			{
				struct sequence_data *pSeq = NULL;
				INDEX idx;
				LIST_FORALL( sequences, idx, pSequence, pSeq )
				{
					if( pSeq->sequence == packet_sequence )
					{
						if( pSeq->packet_length == size )
							if( MemCmp( pSeq->packet, buffer, size ) == 0 )
								return;
					}
				}
				if( pSeq ) // bail out of do{}while(0)
				{
					if( bLogPacketReceive )
						lprintf( WIDE("received duplicate, ignoring.") );
					return;
				}
				{
					struct sequence_data *new_seq = New( struct sequence_data );
					new_seq->sequence = packet_sequence;
					new_seq->tick = GetTickCount();
					new_seq->packet = Allocate( size );
					new_seq->packet_length = (int)size;
					MemCpy( new_seq->packet, buffer, size );

					AddLink( &sequences, new_seq );
					if( bLogPacketReceive )
					{
						lprintf( WIDE("Received...") );
						LogBinary( (P_8)buffer, size );
					}
				}
				// need to do this so that we don't get a command prompt from "system"
				if( bNulArgs )
				{
					TEXTCHAR *arg;
					int count = 0;
					arg = inbuf;
					while( ((PTRSZVAL)arg-(PTRSZVAL)buffer) < (PTRSZVAL)size )
					{
						count++;
						arg += StrLen( arg ) + 1;
					}
					args = (TEXTCHAR**)Allocate( (count+1) * sizeof( char * ) );

					arg = inbuf;
					count = 0;
					while( ((PTRSZVAL)arg-(PTRSZVAL)buffer) < (PTRSZVAL)size )
					{
						args[count++] = arg;
						arg += StrLen( arg ) + 1;
					}
					args[count++] = NULL; // null terminate list of args..

					if( restart && !bCaptureOutput )
					{
						// capture output sends back to a host program.
						// will NOT do this reconnect for restartables...
						// therefore it is not restartable.
						restart_info = New( RTASK );
						restart_info->fast_restart_count = 0;
						restart_info->prior_tick = GetTickCount();
						restart_info->args = (PCTEXTSTR)args;
						restart_info->program = StrDup( inbuf );
						restart_info->flags.bLogOutput = bLogOutput;
						restart_info->flags.bHide = hide_process;
						AddLink( &restarts, restart_info );
					}
					if( bCaptureOutput || bLogOutput)
					{
						if( bCaptureOutput )
						{
							struct thread_args *tmp_args = New( struct thread_args );
							if( sa )
							{
								sa = DuplicateAddress( sa );
								SetAddressPort( sa, capture_port );
							}
							tmp_args->inbuf = StrDup( inbuf );
							tmp_args->args = args;
							tmp_args->hide_process = hide_process;
							tmp_args->restart_info = restart_info;
							tmp_args->sa = sa;
							tmp_args->bCaptureOutput = bCaptureOutput;
							tmp_args->restart = restart;
							tmp_args->pc_task_reply = pc_reply;
							lprintf( WIDE("Capturing task output to send back... begin back connect.") );
							ThreadTo( RemoteBackConnect, (PTRSZVAL)tmp_args );
						}
						else
						{
							PTASK_INFO task;
							task = LaunchPeerProgramExx( inbuf
								, start_path[0]?start_path:NULL
																, (PCTEXTSTR)args
																, hide_process?0:LPP_OPTION_DO_NOT_HIDE
																, GetTaskOutput
																, restart_info?RestartTask:TaskEnded
																, (PTRSZVAL)(restart_info?((PTRSZVAL)restart_info):0)
																 DBG_SRC
																);
						}
					}
					else
					{
						LaunchProgramEx( inbuf
							, start_path[0]?start_path:NULL
											, (PCTEXTSTR)args
											, restart_info?RestartTask:TaskEnded
											, (PTRSZVAL)restart_info );
						if( !restart )
						{
							// restartable tasks want to keep the args...
							Release( args );
						}
					}
				}
				else
				{
#ifdef __cplusplus
					::
#endif
						system( (char*)buffer ); // old way...
				}

}
*/
