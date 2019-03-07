//"use strict";
var stream = require('stream')
var util = require('util')
var filter_base = require( "./filter_base.js");
var text = require( '../../org.d3x0r.common/text.js')
var vm = require( 'vm' );

exports.Filter = Filter;

var states = {
    getCommand : 1
    , getCommandWord : 2
    , getCommandArgs : 3
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
            for( n = 1; n < newcmd.length; n++ ) commands[newcmd.substr(0,n)] = cmd;
            //console.log( "new command:", newcmd );
            
        }
        else {
            throw new Error( "Already exists?" );
            
            if( "multi" in other ) {
                thisCmd.multi = other.multi;
            }
            else {
                thisCmd.multi = other.multi = [];
            }
            other.multi.push( thisCmd );
            if( cmd.opts.min > 1 ) {
                var maxN = 0;
                console.log( "This has already ")
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
            cmd.opts.min = other.cmd.opts.min = n+1;
            //console.log( "Delete keys up to ...", cmd.opts.min, newcmd.length );
          //  for( n = 1; n < cmd.opts.min; n++ ) delete commands[newcmd.substr(0,n)];
            for( cmd.opts.min; n < newcmd.length; n++ ) commands[newcmd.substr(0,n)] = cmd;
            //console.log( "commands:", commands );
            cmd.opts.helpText = "["+id.substr(0,cmd.opts.min) +"]"+id.substr(cmd.opts.min);
            other.cmd.opts.helpText = "["+other.id.substr(0,other.cmd.opts.min) +"]"+other.id.substr(other.cmd.opts.min);
            stree[id.substr(0,n)] = thisCmd;
            stree[other.id.substr(0,n)] = other;
        }
    }
}

function read_command(sandbox, options) {
    options = options || {};
    options.decodeStrings = false;
    stream.Transform.call(this,options);
    this.state = { state : states.getCommand, command : null, args : [], words : null };
    this.slashes = 0;
    this.commands = {};
    this.commands.forEach = (cb)=>Object.keys(this.commands).forEach( x=>(this.commands[x].opts.min===x.length)?cb(this.commands[x],x):0 )
    Object.defineProperty( this.commands, "forEach", {enumerable:false})
    this.sandbox = sandbox || vm.createContext( {
        require : require
        , now : new Date().toString()
        ,console : console
    });
    this.processCommand = processCommand;
    this.processCommandLine = processCommandLine;
    this._processCommand = _processCommand;
    this.stree = {};
    //this.sandbox.GLOBAL=this.sandbox;
    this.RegisterCommand = ( name, opts, code ) => {
	if( name in this.commands ) throw new Error( "Command already registered" );
        opts = opts || {description:"NO DESCRIPTION"};
        opts.min = 1;
        opts.helpText = "["+name.substr(0,opts.min) +"]"+name.substr(opts.min);
        this.commands[name] = { opts:opts,code:code };
        updateCommands( this.stree, this.commands, name );

    };
}

util.inherits(read_command, stream.Transform)

function finishPhrase( cur, endToken )
{
    var word = cur.here;
    //console.log( `Finish ${word} @${endToken}` )
    for( ; word; ) {
        var nextEndToken = null;
        //console.log( `word ${word.text}`)
        var check;
        // contained closures should close outers... 
        for( check = cur; check; check = null/*check.prior*/ ) {
            //console.log( "check ", word.text, "vs ", check.token)
            if( word.text === check.token ) {
                if( check !== cur ) {
                    //console.log( "This token closes a higher token, and we failed to complete.")
                    return null;
                }
                else
                {
                    if( cur.parent ){
                        // this word's next is still OK..
                        // cut what's before here and link here to the open of phrase
                        // returned phrase is already in an indirect?
                        //console.log( `found break and splict to parent? ${cur.parent.text}  ${word.text} `)
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
                    if( word )
                        return word;
                    console.log( "return cur.here (no words)")
                    return cur.here;
                }
            }
        }
        if( word.text === '(')
            nextEndToken = ')';
        else if( word.text === "'" )
            nextEndToken = "'";
        else if( word.text === '"' )
            nextEndToken = '"';
        else if( word.text === '[' )
            nextEndToken = ']';
        else if( word.text === '{' )
            nextEndToken = '}';
        // -- optional ... greaterthan and lessthan?
        //else if( word.text === '<' )
        //    nextEndToken = '>';
        if( nextEndToken )
        {
            //console.log( "word in is", word.text );
            var next = word.break();
            var phrase;
            var result;
            if( !next ) {
                console.log( "open token at end of line... fail.");
            }
            else {
                //console.log( `Found a token ${word.text} to group and set indirect to `, next&&next.text );
                word.indirect = next;

                result = finishPhrase( phrase = {prior: cur, token:nextEndToken, here:next, parent:word} , nextEndToken )
                // clear this so we don't re-search.
                nextEndToken = null;
                if( result ) {
                    // there is more after this?
                    //console.log( result )
                    //word.append( result );
                    word = result;
                } else {
                    console.log( "Failed to find mate before outer closure ")
                    // un-break word from it's next.
                    // clear indirect... and move to the next word.
                    //word.indirect = null;
                    word.next = next;
                    next.pred = word;
                }
            }
        }
        //console.log( `stepping next ${word.text} ${word&&word.next&&word.next.text}`)
        if( word )
            word = word.next;
    }
    if( cur.parent ) {
        //throw "Failed to find matching token in words";
        console.log( "failed to find matching token return null", cur.here && cur.here.text, word && word.text, cur )
        return null;
    }
    //console.log( "return phrases...")
    return cur.here;
}

function buildPhrases( words ) {
    var cur = { here : words, parent : null };
    return finishPhrase( cur, null )
}


read_command.prototype._transform = function(chunk, encoding, callback) {
    this.processCommand( chunk );
    callback()
}

function processCommand( chunk )
{
    var word = text.Parse( chunk );
    buildPhrases( word );
    //console.log( "processCommand : ", word )
    // this.commands, this.sandbox, this.filter?
    var next = word.break();
    while( word ) {
        this._processCommand( word );
        if( word = next )
            next = word.break();
    }
    this._processCommand( {text:null} );
    if( this.state.words ) {
        this.push( this.state.words.toString() );
        this.state.words = null;
    }
    this.push( "\nEnter Command: " );
}

function processCommandLine( line ){
    var word = line;
    //console.log( "processCommandLine : ", line.toString() )
    var next = word.break();
    while( word ) {
        this._processCommand( word );
        if( word = next )
            next = word.break();
    }
    this._processCommand( {text:null} );
}

function _processCommand ( word )
{
    //console.log( "processCommand segment : ", word.text )
    const saveword = ()=>{
        if( !this.state.words ) this.state.words = word;
        else this.state.words = this.state.words.append( word );
    }
    if( word.text === '/' ) {
        //console.log( "found slash")
        if( this.state.state === states.getCommand ) {
            this.state.state = states.getCommandWord;
            this.slashes = 0;
        } else if( this.state.state == states.getCommandWord ) {
            this.slashes++;
        } else {
            saveword();
            this.state.args.push( word );
        }
    } else if( this.slashes) {
       console.log( "has slashses extra - is a relay command?" );
    } else switch( this.state.state )
    {
    case states.getCommandWord:
        //console.log( `find ${word.text} in `,Object.keys( this.commands))
        this.state.command = this.commands[word.text];
        if( this.state.command ) {
            this.state.state = states.getCommandArgs;
            //console.log( "found command?")
        } else {
            this.state.state = states.getCommand;
            this.push( "/" );
            this.push( word.text );
            if( this.slashes ) {
                //state = states.getCommand;
            }
            this.state.command = null;
        }
        break;
    case states.getCommandArgs:
        //if( this.state.words )
        //    console.log( "getting args - word ", this.state.words.toString() )
        if( word.text  ) {
            if( !word.spaces && this.state.words ) {
                // if there's already words, and there's no space, then 
                // just add this (and return)
                this.state.words = this.state.words.append( word );
                return;
            }
            
            saveword();
            if( this.state.words && this.state.words.pred && this.state.words.pred.indirect ) {
                // console.log( "terminator of prior indirect...")
                // spaces at end of indirect are internal to the indirect; and should be ignored.
                // (check for space would follow)
                return;
            }

            // word breaks create arguments.
            if( word.spaces && this.state.words ) {
                this.state.args.push( word );
            }
            //console.log( "2 args is now ", this.state.args );
        } else if( this.state.command ) {
	        //console.log( "dispatch command." );
            //console.log( "args is ", this.state.words&&this.state.words.first().toString() );//this.state.args);//, " and command is still ", this.state.command.toString() )
            //console.log( "collected args: ", this.state.args );
            this.state.args.forEach( (arg)=>{arg.breakBefore();arg.spaces=0;arg.tabs=0;} )
            if( this.state.words )
            {
                var args =  this.state.words.first();
                {
                    //console.log( `call with unphrased args? ${args}`)
                    //console.log( "4 args is now ", this.state.args );
                    this.result = this.state.command.code( this.state.args );
                }
            }else {
                this.result = this.state.command.code( null, this.state.args );//this.state.args );
            }
            this.state.words = null;
            this.state.slashes = 0;
            this.state.args = [];
            //console.log( "args is empty ", this.state.args );
            this.state.state = states.getCommand;
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


read_command.prototype._flush = (callback) => { console.log( "stream flush?" ); callback(); }



function Filter( sandbox ) {
	return filter_base.Filter( new read_command( sandbox ) );
}
