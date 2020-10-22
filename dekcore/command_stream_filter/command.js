"use strict";

const _debug_promise_resolution = false;

var stream
var util
var filter_base
var text
var sack;
var vm
var JSOX;


if( "undefined" === typeof Λ ) {
	stream = require('stream')
	util = require('util')
	filter_base = require( "./filter_base.js");
	text = require( '../../org.d3x0r.common/text.js')
	vm = require( 'vm' );
	JSOX = require( "sack.vfs").JSOX;
}

exports.Filter = Filter;

const debug_input = false;
const debug_finishPhrase = false;
const debug_command_keys = false;

var states = {
	getCommand : 1
	, getCommandWord : 2
	, getCommandArgs : 3
};


function read_command(entity, options_) {
	const options = options_ || {};
	options.decodeStrings = false;
	stream.Transform.call(this,options);
	const state = { state : states.getCommand, command : null, args : [], words : null };
	var slashes = 0;
	const commandRegistry = [];
	const commands = {};
	const this_ = this;
	this.forEach = commandRegistry.forEach.bind(commandRegistry);
	Object.defineProperty( commands, "forEach", {enumerable:false})
	this.processCommand = processCommand;
	this.processCommandLine = processCommandLine;
	this.handleUnhandled = null;
	//this._processCommand = _processCommand;
	const stree = {};
	//this.sandbox.GLOBAL=this.sandbox;
	this.RegisterCommand = ( name, opts, code ) => {
		if( name === "unhandled" ) {
			this_.handleUnhandled = code;
			return;
		}
		if( name in commands ) {
				if (commands[name].name === name ) throw new Error( "Command already registered" );
				else delete commands[name];
		}
		opts = opts || {description:"NO DESCRIPTION"};
		opts.min = 1;
		opts.helpText = "["+name.substr(0,opts.min) +"]"+name.substr(opts.min);
		var newCode = { name:name, opts:opts, conflicts:[], code:code };
		if( !commandRegistry.find( (c,i)=>{
			if( c.name > newCode.name ){
				commandRegistry.splice(  i,0, newCode );
				return true;
			}
			return false;
		}) )
			commandRegistry.push(newCode);
		Object.defineProperty( commands, name, {enumerable:debug_command_keys,configurable:true,value: newCode } );
		updateCommands( stree, commands, name );
		debug_command_keys && console.log( "Current full command object:", commands );

	};

// only one instance of this so....
function updateCommands( stree, commands, newcmd ) {
	var cmd = commands[newcmd];
	var id = newcmd;
	{
		var other;
		var thisCmd = {id:id, cmd: cmd};
		var n = 0;
		if( !( other = stree[id[0]] ) ) {
			stree[id[0]] = thisCmd;
			for( n = cmd.opts.min; n < newcmd.length; n++ ) {
				Object.defineProperty( commands, newcmd.substr(0,n), {enumerable:debug_command_keys,configurable:true,value:cmd} );
			}
		}
		else {
			//throw new Error( "Already exists?" + newcmd + " in " + JSON.stringify(stree));
			if( "multi" in other ) {
				thisCmd.multi = other.multi;
			}
			else {
				thisCmd.multi = other.multi = [];
			}
			other.multi.push( thisCmd );
			if( cmd.opts.min > 1 ) {
				var maxN = 0;
				thisCmd.multi.forEach( (cmd)=>{
					for( n = cmd.opts.min-1; n < id.length; n++ ) {
						if( id[n] !== other.id[n] )
							break;
					}
					if( n > maxN )
						maxN = n;
				})
				n = maxN;
			}else {
				for( n = cmd.opts.min-1; n < id.length; n++ ) {
					if( id[n] !== other.id[n] )
						break;
				}
			}
			debug_command_keys &&sack.log( "Min:"+ n );
			cmd.opts.min = other.cmd.opts.min = n+1;
			if( other.cmd.opts.min > other.cmd.name.length )
				other.cmd.opts.min = other.cmd.name.length;
			if( cmd.opts.min > cmd.name.length )
				cmd.opts.min = cmd.name.length;

			for( n = 1; n <= cmd.opts.min; n++ ) {
				var s = newcmd.substr(0,n);
				var oc = commands[s];
				//sack.log( util.format("Checking conflict:", s, cmd, oc) );
				if( oc && oc.conflicts.length ) { // was already a conflict, update it.
					if( !oc.conflicts.find( c=>c===cmd))
						oc.conflicts.push( cmd );
				}
				else if(oc) {
					if( n === newcmd.length )
					{
						debug_command_keys &&sack.log( "Full command- guaranteed " + s );
						break;
					}
					// if the command is the same as n, or isn't longer, don't delete it.
					// 'inv' 'inv2'
					else if( oc.name.length > n ) {
						// replace with a new one.
						//sack.log( "Deleting and replacing with conflict handler");
						delete commands[s];
						oc = commands[s] = Object.assign({},oc);
						oc.conflicts = [oc,cmd];
						oc.code = function(args){
							//console.log( "Entity command output (command.js)THis should have worked.");
							return this_.push( util.format( "Unclear command, please be more specific: ", this.conflicts.reduce((acc,val)=>acc += (acc.length?", ":"" )+ val.name, "" )+"." ) );
						}
					}else {
						//sack.log( "Original has to remain undeleted..." );
					}
				}else break;
			}
			for( n = cmd.opts.min; n < newcmd.length; n++ )  {
				//sack.log( "Setting:" +  newcmd.substr(0,n));
				Object.defineProperty( commands, newcmd.substr(0,n), {enumerable:debug_command_keys,configurable:true,value:cmd} );
			}
			//commands[newcmd.substr(0,n)] = cmd;
			//console.log( "commands:", commands );
			cmd.opts.helpText = "["+id.substr(0,cmd.opts.min) +"]"+id.substr(cmd.opts.min);
			other.cmd.opts.helpText = "["+other.id.substr(0,other.cmd.opts.min) +"]"+other.id.substr(other.cmd.opts.min);
			Object.defineProperty( stree, id.substr(0,n), {configurable:true,value:thisCmd} );
			Object.defineProperty( stree, other.id.substr(0,n), {configurable:true,value:other} );
			//stree[id.substr(0,n)] = thisCmd;
			//stree[other.id.substr(0,n)] = other;
		}
	}
}

	function finishPhrase( firstWord, endToken )
	{
		const phraseStack = [{prior: null, token:null, inForce:false, force:false, here:firstWord, parent:null}];

		var cur;
		var escape = false;
		debug_finishPhrase && console.log( "Start parsing work:", firstWord.text );
		while( cur = phraseStack.pop() ) {

			var word = cur.here;
			debug_finishPhrase && console.log( `Finish ${word} @${endToken}` )
			for( ; word; ) {
				var nextEndToken = null;
				var nextEndTokenForce = false;
				debug_finishPhrase && console.log( `word ${JSON.stringify(word.text)}`)
				var check;
				// contained closures should close outers...

				if( cur.force ){
					if( escape ){
						escape = false;
					} else if( word.text === '\\'){
						escape = true;
					}
					else if( word.text == cur.token ) {
						word.breakAndSpliceTo( cur.parent );
						cur.prior.here = word.next;
						break;
					}
					if( word )
						word = word.next;
					continue;
				}

				debug_finishPhrase && console.log( "check ", word&&word.text, "vs ", cur.token && cur.token )
				if( cur.token && word.text === cur.token ) {
					if( cur.parent ){
						// this word's next is still OK..
						// cut what's before here and link here to the open of phrase
						// returned phrase is already in an indirect?
						debug_finishPhrase && console.log( `found break and splice to parent? ${cur.parent.text}  ${word.text} `)
						word.breakAndSpliceTo( cur.parent )
						//console.log( `found break and splict to parent? ${cur.parent} `)
					}
					else {
						var next = word.break();
						next.pred = cur.next;
						console.log( "found end token, without parent?")
						cur.next.next = next;
					}
					//console.log( "returning to prior point....", word)
					debug_finishPhrase && console.log( "returning word:", word.toString() );
					cur.prior.here = word.next;
					break;
				}

					// don't start inner states...
				if( !cur.force ) {
					if( word.text === '(')
						nextEndTokenForce = !(nextEndToken = ')');
					else if( word.text === "'" )
						nextEndTokenForce = !!(nextEndToken = "'");
					else if( word.text === '"' )
						nextEndTokenForce = !!(nextEndToken = '"');
					else if( word.text === '`' )
						nextEndTokenForce = !!(nextEndToken = '`');
					else if( word.text === '[' )
						nextEndTokenForce = !(nextEndToken = ']');
					else if( word.text === '{' )
						nextEndTokenForce = !(nextEndToken = '}');
					else
						nextEndToken = null;
				}
				else   nextEndToken = null;
				// -- optional ... greaterthan and lessthan?
				//else if( word.text === '<' )
				//    nextEndToken = '>';
				if( nextEndToken )
				{
					//console.log( "word in is", word.text );
					var next = word.break();
					var phrase;
					if( !next ) {
						throw new Error( "open token at end of line... fail.  " + cur.token + " expected");
					}
					else {
						debug_finishPhrase && console.log( `Found a token ${word.text} to group and set indirect to `, next&&next.text );
						word.indirect = next;
						phraseStack.push( cur );
						phraseStack.push( phrase = {prior: cur, token:nextEndToken, force:nextEndTokenForce, here:next, parent:word} );
						break;
					}
				}
				//console.log( `stepping next ${word.text} ${word&&word.next&&word.next.text}`)
				if( word )
					word = word.next;
			}
		}
		//console.log( "return phrases...")
		//console.log( "ch returning word:", cur.here.toString() );
		//return cur.here;
	}

	function processCommand( chunk )
	{
		var word = text.Parse( chunk );
		buildPhrases( word );
		// commands, this.sandbox, this.filter?
		var next = word.break();
		inError = false;
		state.words = null;
		state.slashes = 0;
		state.args = [];

		while( word ) {
			_processCommand( word );
			if( word = next )
				next = word.break();
		}
		if( !inError )
			_processCommand( {text:null} );

		if( state.words && !inError  ) {
			if( this_.handleUnhandled )
				this_.handleUnhandled( state.words.toString() );
			else
				this_.push( state.words.toString() );
			state.words = null;
		}
	}

	function processCommandLine( line ){
		var word = line;
		//console.log( "processCommandLine : ", line.toString() )
		inError = false;
		state.words = null;
		state.slashes = 0;
		state.args = [];

		var next = word.break();
		while( word ) {
			_processCommand( word );
			if( word = next )
				next = word.break();
		}
		if( !inError )
			_processCommand( {text:null} );

	}
	var inError = false;
	function _processCommand ( word )
	{

		function saveword(){
			if( !state.words ) state.words = word;
			else state.words = state.words.append( word );
			//console.log( "save segment : ", word.spaces, word.tabs, word.text )
		}
			//console.log( "Process word:", word.text, slashes );
		if( inError ) { if( word.text) return saveword(); else return; }
		if( word.text === '/' ) {
			//console.log( "found slash", state.state )
			if( state.state === states.getCommand ) {
				state.state = states.getCommandWord;
				slashes = 0;
			} else if( state.state == states.getCommandWord ) {
				slashes++;
			} else {
				saveword();
				state.args.push( state.words );
				state.words = null;
			}
		} else if( slashes) {
			if( slashes == 1 ) {
				//if( lastTold )
				 //   lastTold.Tell( )
			}
		   console.log( "has slashses extra - is a relay command?" );
		   slashes = 0;
		} else switch( state.state )
		{
		case states.getCommandWord:
			//console.log( `find ${JSON.stringify(word.text)} in `, commands)
			state.command = commands[word.text];
			if( state.command ) {
				state.state = states.getCommandArgs;
				//console.log( "found command?", state.command );
			} else {
				inError = true;
				this_.push( util.format( "Command not found", word.text ) );

				state.state = states.getCommand;
				//this_.push( "/" );
				//this_.push( word.text );
				if( slashes ) {
					//state = states.getCommand;
				}
				state.command = null;
			}
			break;
		case states.getCommandArgs:
			//if( state.words )
			//    console.log( "getting args - word ", state.words.toString() )
			if( word.text  ) {
				if( !word.spaces && state.words ) {
					// if there's already words, and there's no space, then
					// just add this (and return)
					saveword();
					//console.log( "already had a word, and this just needs to be appended...");
					return;
				}

				if( state.words && state.words.last.indirect ) {
					// console.log( "terminator of prior indirect...")
					// spaces at end of indirect are internal to the indirect; and should be ignored.
					// (check for space would follow)
					saveword(); // last word is indirect, keep this with it as closing token.
					return;
				}

				// word breaks create arguments.
				if( word.spaces && state.words ) {
					state.args.push( state.words );
					state.words = null;
					word.spaces = 0; // trim leading spaces on arguments.
					word.tabs = 0; // trim leading spaces on arguments.
				}
				saveword();
			} else if( state.command ) {
				var err_ = null;
				try {
					if( state.words ) {
						state.args.push( state.words.first() );
						state.words = null;
					}
					if( state.command.conflicts.length )
						state.command.code.call( state.command );
					else
						state.command.code.call( entity, state.args );
				} catch(err) { err_ = err }
				state.words = null;
				state.slashes = 0;
				state.args = [];
				//this_.push( "Command Done." );
				//entity.send( {op:"out", out:"(post via thread port)Command Done."});
				//entity.send( {op:"echo", echo:"out", out1:"(post via thread port)Command Done."});

				if( err_ ) console.log( err_.message );
				//console.log( "args is empty ", state.args );
				state.state = states.getCommand;
				// above this point, is just input and stream handling, noone would care to catch this.
				//if( err_ ) throw err_;
			}
			break;
		default:
			// send null for EOF
			if( word.text ){
				saveword()
			}
			break;
		}
		return
	}


	function buildPhrases( words ) {
		//var cur = { here : words, parent : null };
		finishPhrase( words, null );
		return words;
	}

}


function Filter( entity ) {
	return filter_base.Filter( new read_command( entity ) );
}

if( "undefined" !== typeof Λ ) {

		stream = await require('stream')
		util = await require('util')
		filter_base = await require( "./filter_base.js");
		text = await require( '../../org.d3x0r.common/text.js')
		vm = await require( 'vm' );
		sack = await require( 'sack' );
		JSOX = (await require( "sack.vfs")).JSOX;

		util.inherits(read_command, stream.Transform)

		read_command.prototype._transform = function(chunk, encoding, callback) {
			try {
				debug_input && console.log( new Error().stack, "command transform Process:", chunk.toString());
				this.processCommand( chunk );

			} catch(err) {
				//sack.log( util.format( "read command transform caught error...", chunk, err ) );
				this.push( err.message );
			}
			if( io.prompt )
				io.prompt( "\nEnter Command: ");
			else
				this.push( "\nEnter Command: " );

			callback()
		}


		read_command.prototype._flush = (callback) => { console.log( "stream flush?" ); callback(); }

		read_command.prototype.setLastTell = (lastTold) => { this.lastTold = lastTold }

}
