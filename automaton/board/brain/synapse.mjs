"use strict";

export default function Synapse() {
	var s = {
        	input : null,
                output : null,
                gain : 1.0,
                get value() {
                	if( this.input )
                        	return this.gain * this.input.value;
                        return 0;
                },
                clone() {
                        var newS = Synapse();
                        newS.gain = this.gain;
                        return newS;
                },
                AttachSource( neuron, ppSyn ) {
                        if( !ppSyn && neuron )
                                for( var n = 0; 
                                        !(ppSyn = neuron.AttachSynapse( n ) )
                                        && n < MAX_NERVES; 
                                        n++ );
                        if( !this.input && neuron && ppSyn )
                        {
                                ppSyn.nerves[ppSyn.id] = this;
                                this.input = neuron;
                                return true;
                        }
                        return false;
                                
                },
                AttachDestination( neuron, ppSyn ) {
                        if( !ppSyn && neuron )
                                for( var n = 0; 
                                        !(ppSyn = neuron.AttachSynapse( n ) )
                                        && n < MAX_NERVES; 
                                        n++ );
                        if( !this.output && neuron && ppSyn )
                        {
                                ppSyn.nerves[ppSyn.id] = this;
                                this.output = neuron;
                                return true;
                        }
                        return false;
                                
                },
                DetachDestination() {
                        var n = this.output;
                        if(n) {
                                this.output = null;
                                n.detachSynapse( this );
                        }
                },
                DetachSource() {
                        var n = this.input;
                        if( n ) {
                                this.input = null;
                                n.detachSynapseFrom( this );
                        }
                }
        }
        
        return s;
}

