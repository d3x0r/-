
"use strict"

//var Neuron = require( './neuron.js' );//import * as Neuron from ./neuron.js;
//var Synapse = require( './synapse.js' );

import * as Neuron from './neuron.mjs';
import Synapse from "./synapse.mjs";

export default function Brain() {
    const neurons = []
	const roots = []
	var b = { cycle : 0,
		k : 1.0, // default signmoid constant
		changed : false,
		Synapse : Synapse,
		brainStems : [],
		step() {
			this.cycle++;
			if( this.changed ) {
				roots.length = 0;
				neurons.forEach( n=> {
					if( n.cycle != this.cycle ) {
						roots.push( n );
						n.value;
					}
				} );
				this.changed = false;
			}
			else
				roots.forEach( n=>n.value );
		},
		DupNeuron(n){
			return n.clone();
		},
		DupSynapse(s) {
			return s.clone();
		},
		LinkSynapseFrom( synapse, neuron, n) {
			return synapse.AttachSource( neuron, neuron.attachSynapse( n ) );
		},
		LinkSynapseTo( synapse, neuron, n) {
			return synapse.AttachDestination( neuron, neuron.attachSynapse( n ) );
		},
		toJson() {
			
		}	
	};

	var types = Object.keys( Neuron );
	types.forEach( key =>
		b[key] = function(...args) { 
				var neuron = Neuron[key].apply( b, args );
				this.changed = true;
				neurons.push( neuron );
				return neuron;
			}
		  //set: function(y) { this.setFullYear(y) }
	)
	
	
        return b;
}

