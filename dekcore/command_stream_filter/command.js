"use strict";

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

function read_command(sandbox, options) {
    options = options || {};
    options.decodeStrings = false;
    stream.Transform.call(this,options);
    this.state = { state : states.getCommand, command : null, args : [], words : null };
    this.slashes = 0;
    this.commands = {};
    this.sandbox = sandbox || vm.createContext( {
        require : require
        , now : new Date().toString()
        ,console : {
            log : function(){
                console.log.apply( console, arguments)
            }
        }
    });
    this.processCommand = processCommand;
    this.processCommandLine = processCommandLine;
    this._processCommand = _processCommand;
    //this.sandbox.GLOBAL=this.sandbox;
    this.RegisterCommand = ( name, code ) => {
        this.commands[name] = code;
    };
}

util.inherits(read_command, stream.Transform)

function finishPhrase( cur, endToken )
{
    var word = cur.here;
    //console.log( `Finish ${word} @${endToken}` )
    for( ; word; ) {
        var nextEndToken;
        //console.log( `word ${word.text}`)
        var check;
        for( check = cur; check; check = check.prior ) {
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
                        console.log( "return cur.ere")
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
            var next = word.break();
            var phrase;
            var result;
            //console.log( `Found a token ${word.text} to group and set indirect to `, next&&next.text );
            word.indirect = next;

            result = finishPhrase( phrase = {prior: cur, token:nextEndToken, here:next, parent:word} , nextEndToken )
            if( result )
                word = result;
            else {
                //console.log( "Failed to find mate before outer closure ")
                // un-break word from it's next.
                // clear indirect... and move to the next word.
                word.indirect = null;
                word.next = next;
                next.pred = word;
            }
        }
        //console.log( `stepping next ${word.text} ${word&&word.next&&word.next.text}`)
        if( word )
            word = word.next;
    }
    if( cur.parent ) {
        //throw "Failed to find matching token in words";
        console.log( "failed to find matching token return null", cur.here.text, word.text, cur )
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
    var string = chunk.toString()
    this.processCommand( chunk );
    callback()
}

function processCommand( chunk )
{
    var word = text.Text( JSON.parse( chunk ) );
    //console.log( "processCommand : ", this )
    this._processCommand( word );
}

function processCommandLine( line ){
    var word = line;
    console.log( "processCommand : ", line.toString() )
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
    console.log( "processCommand : ", word )
    //var word = text.Text( JSON.parse( chunk ) );
    var saveword = ()=>{
        if( !this.state.words ) this.state.words = word;
        else this.state.words = this.state.words.append( word );
        this.state.args.push( word );
        //console.log( " 1 args is now ", this.state.args );
        //console.log( `text is ${text}`, Object.keys( word ));
    }
    if( word.text === '/' ) {
        //console.log( "fond slash")
        if( this.state.state === states.getCommand ) {
            this.state.state = states.getCommandWord;
            this.slashes = 0;
        } else if( this.state.state == states.getCommandWord ) {
            this.slashes++;
        } else {
            saveword();
        }
    }
    else if( this.slashes) {

    }
    else switch( this.state.state )
    {
    case states.getCommandWord:
        //console.log( `find ${word.text} in `,Object.keys( this.commands))
        this.state.command = this.commands[word.text];
        if( this.state.command ) {
            this.state.state = states.getCommandArgs;
            //console.log( "found command?")
        } else {
            this.state.state = states.getCommand;
            this.push( word.text );
            if( this.slashes ) {
                //state = states.getCommand;
            }
        }
        break;
    case states.getCommandArgs:
        //if( this.state.words )
        //    console.log( "getting args - word ", this.state.words.toString() )
        if( word.text  ) {
            if( !this.state.words ) this.state.words = word;
            else this.state.words = this.state.words.append( word );
            this.state.args.push( word );
            //console.log( "2 args is now ", this.state.args );
        } else if( this.state.command ) {
            console.log( "args is ", this.state.words&&this.state.words.first().toString() );//this.state.args);//, " and command is still ", this.state.command.toString() )
            if( this.state.words )
            {
                var args =  this.state.words.first();
                /*
                try {
                    var phrases = buildPhrases(args );
                    //console.log( `call with phrases? ${phrases}`)
                    console.log( "3 args is now ", this.state.args );
                    this.state.result = this.state.command( phrases
                                        , this.state.args );//this.state.args );
                }catch( err )
                */
                {
                    //console.log( `call with unphrased args? ${args}`)
                    console.log( "4 args is now ", this.state.args );
                    this.state.result = this.state.command( args
                                        , this.state.args );//this.state.args );
                }
            }else {
                this.state.result = this.state.command( null
                                    , this.state.args );//this.state.args );
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
            if( !this.state.words) this.state.words = word;
            else this.state.words = this.state.words.append( word );
            this.push( word.text );
        }
        break;
    }
}


read_command.prototype._flush = (callback) => { console.log( "stream flush?" ); callback(); }



function Filter( sandbox ) {
	return filter_base.Filter( new read_command( sandbox ) );
}
