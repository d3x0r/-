
const utils = {
    ROUND_DOWN:1,
    ROUND_UP :2,
    ROUND_NATURAL:3,
    // --------- These need to go into utils or something
    to$(val,rounder) {
        function pad(val, n) {
            if( val.length < n) {
                val = '00000'.substr(0,n-val.length)+val;
            }
            return val;
        }
        var digits = Math.log10(val) - 2;
        var n;
        var r = '';
        var c = (val/100)|0;
        var cnts;
        if( cnts = val % 100 ) {
            if( rounder === 1 ) {
                if( val < 0 )
                    val -= 1;
                else   
                    val += 1;
            }else if( rounder === 2 ){
                if( val < 0 )
                    val += 1;
                    else
                    val -=1 ;
            }else if( rounder === 3 ) {
                if( val < 0 )
                    if( cnts >= 50 )
                        val -= 1;
                    else
                        val += 1;
                else
                    if( cnts >= 50 )
                        val += 1;
                    else
                        val -= 1;
            }
            else
                r = '.' + pad((val%100).toString(),2);
        }
        if( digits >= 3 ) {
            for( n = 0; n <= digits-3; n += 3) {
                r = "," + pad(((c%1000)|0).toString(),3) + r;
                c = (c / 1000)|0;
            }
        }
        r = '$' + (c%1000) + r;
        return r;
    },

    toD($) {
        if( "string" !== typeof $ )
            $ = $.toString();
        if( $[0] === '$' )
            $ = $.substr(1);
        //   throw new Error( "NOT A DOLLAR AMOUNT" );
        var i = $.indexOf('.' );
        if( i >= 0 && $.length-i > 2 ) {
            var trunc = $.split(',' ).join('').split('.');
            trunc[trunc.length-1] = trunc[trunc.length-1].substr(0,2);
            return Number( trunc.join('') );

        } else if( i >= 0 && $.length-i == 3 )
            return Number( $.split(',' ).join('').split('.').join('') );
        else if( i >= 0 && $.length-i == 2 )
            return Number( $.split(',' ).join('').split('.').join('') ) * 10;
            return (Number( $.split(',' ).join('') ) * 100)|0;
    },

    toP(p) {
        if( "string" !== typeof p )
            p = p.toString();
        return p + "%";
    },
    fromP(p){
        p = p.split('%').join('');
        return Number(p);        
    }
}
export {utils};