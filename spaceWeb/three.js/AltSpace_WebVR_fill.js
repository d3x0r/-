

if( typeof navigator.getVRDisplays == "undefined" ) {

  window.VRFrameData = function() {
    this.pose = {
        get orientation () {
          return head.quaternion;
        }
        , get position () {
          return head.position;
        }
    };
  }
  navigator.getVRDisplays = function( ) {
  	return new Promise(
      function(resolve, reject) {
        // do a thing, possibly async, then…

        if ( true ) {
          resolve( [ {
                    getFrameData: function(r ) {
                    },
                    getPose: function() {
                      console.log( "want pose data" );
                    },
                  }, ]


          );
        }
        else {
          reject(Error("It broke"));
        }
      });
  }

}
