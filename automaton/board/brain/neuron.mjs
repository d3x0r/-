"use strict"

export function Neuron() {
	var inputs;
	var n = { brain : this,
		threshold : 0.5,
        cycle : this.cycle-1,
		type : "Neuron",
        inputs : [],
		outputs : [],
		clone() {
			var newNeuron = Neuron.call( n.brain );
			newNeuron.threshold = this.threshold;
			newNeuron.cycle = this.cycle;
			newNeuron.type = this.type;
			return newNeuron;
		},
		output(n) {
			return n - this.threshold;
		},
        get value() {
           	if( this.cycle != this.brain.cycle ) {
				inputs = this.inputs.reduce( (inputs,inp)=>inputs + (inp?inp.value:0), 0 );
				this.cycle = this.brain.cycle;
			}
			if( inputs > this.threshold )
				return this.output(inputs);
			return 0;
		},
		attachSynapse( specific ) {
			if( specific !== undefined )
				return { nerves: this.inputs, id: specific }
			return { nerves: this.inputs, id: this.inputs.length };
		},
		attachSynapseFrom( specific ) {
			if( specific !== undefined )
				return { nerves: this.outputs, id: specific }
			return { nerves: this.outputs, id: this.outputs.length };
		},
		detachSynapse( s ) {
			var id = this.inputs.findIndex( input=>input === s );
			if( id >= 0 )
				this.inputs[id] = null;
		},
		detachSynapseFrom( s ) {
			var id = this.outputs.findIndex( output=>output === s );
			if( id >= 0 )
				this.outputs[id] = null;
		},
		attach( other ) {
			var synapse = this.brain.Synapse();
			this.inputs.push( synapse );
			other.outputs.push( synapse );
			synapse.input = other;
			synapse.output = this;
			this.brain.changed = true;
			return synapse;
		},

		detach( other ) {
			if( other ) {
				var index;
				var synapse;
				index = this.inputs.findIndex( s=>(s.input === other)?true:false );
				if( index < 0 ) {
					index = this.outputs.findIndex( s=>(s.output === other )?true:false );
					if( index >= 0 ) {
						synapse = this.outputs[index];
						this.outputs.splice( index, 1 );
						synapse.output.inputs.find( (s,idx)=>{ if( s === synapse ) {
								synapse.output.inputs.splice( idx, 1 );
								return true;
							} else return false; 
						} );
					}
				} else {
					synapse = this.inputs[index];
					this.inputs.splice( index, 1 );
					synapse.input.outputs.find( (s,idx)=>{ if( s === synapse ) {
							synapse.input.outputs.splice( idx, 1 );
							return true;
						} else return false; 
					} );
				}
			} else {
				while( this.inputs.length )
					this.detach( this.inputs[0].input );
				while( this.outputs.length )
					this.detach( this.outputs[0].output );
			}
			this.brain.changed = true;
		},
	};
        return n;
}

export  function Sigmoid() {
	const n = Neuron.call(this);
	const oldClone = n.clone;
	n.type = "Sigmoid";
	n.k = n.brain.k;
	n.output = function(n) { return 1/(1+Math.exp( -this.k ) ) };
	n.clone = function() {
		var newN = oldClone.call( this );
		newN.k = n.k;
	}
	return n;
}

export function Oscillator() {
	var n = Neuron.call(this);
	n.type = "Oscillator";
    n.freq = 1.0;
        
	Object.defineProperty(n, "value", {
	  get: function() { 
		//console.log( "( Math.sin(  ( ( n.freq * Date.now() ) / 1000 ) % 1  ) )", Date.now() % 1000 
		//		, ( Math.sin(  2*Math.PI * (( ( n.freq * Date.now() ) / 1000 ) % 1 )  ) ) );
          	return ( Math.sin(  Math.PI*2*(( ( n.freq * Date.now() ) / 1000 ) % 1 ) ) );
          },
	  //set: function(y) { this.setFullYear(y) }
	});
	n.clone = function() {
		var newN = oldClone.call( this );
		newN.freq = n.freq;
	}
	return n;
}

export function TickOscillator( ticks ) {
	var n = Neuron.call(this);
	n.type = "TickOscillator";
    n.freq = ticks || 1000;
        
	Object.defineProperty(n, "value", {
	  get: function() { 
		//console.log( "Math.sin( ( this.brain.cycle * 2* Math.PI / freq ) )", Math.sin( ( this.brain.cycle * 2* Math.PI / freq ) ) );
          	return Math.sin( ( this.brain.cycle * 2* Math.PI / n.freq ) );
          },
	  //set: function(y) { this.setFullYear(y) }
	});
	n.clone = function() {
		var newN = oldClone.call( this );
		newN.ticks = n.ticks;
	}
	return n;
}


export function External( cb ) {
	var n = Neuron.call(this);
	n.type = "External";
	Object.defineProperty(n, "value", {
	  get: cb,
	  //set: function(y) { this.setFullYear(y) }
	});
	n.clone = function() {
		var newN = oldClone.call( this );
	}
	return n;
}
