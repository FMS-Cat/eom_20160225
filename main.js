( function() {

  'use strict';

  let seed;
  let xorshift = function( _seed ) {
    seed = _seed || seed || 1;
    seed = seed ^ ( seed << 13 );
    seed = seed ^ ( seed >>> 17 );
    seed = seed ^ ( seed << 5 );
    return seed / Math.pow( 2, 32 ) + 0.5;
  }

  let stringBitToFloat = function( _string ) {

    let string = _string;
    string = string.replace( /[^01]/g, '' );

    let frac = 1.0;
    let exp = -127;
    let sign = 0;

    if ( string[ 0 ] === '1' ) {
      sign = 1;
    }

    for ( let iExp = 1; iExp < 9; iExp ++ ) {
      if ( string[ iExp ] === '1' ) {
        exp += Math.pow( 2.0, 8.0 - iExp );
      }
    }

    if ( exp === -127 ) { // 非正規化
      frac = 0.0;
      exp = -126;
    }

    for ( let iFrac = 9; iFrac < 32; iFrac ++ ) {
      if ( string[ iFrac ] === '1' ) {
        frac += Math.pow( 2.0, 8.0 - iFrac );
      }
    }

    let ret;
    if ( exp === 128 ) { // 無限大, NaN
      if ( frac !== 1.0 ) {
        ret = NaN;
      } else if ( sign === 1 ) {
        ret = -Infinity;
      } else {
        ret = Infinity;
      }
    } else {
      ret = frac * Math.pow( 2.0, exp );
      if ( sign === 1 ) {
        ret = -ret;
      }
    }

    return {
      ret: ret,
      frac: frac,
      exp: exp,
      sign: sign
    };

  };

  let context = canvas.getContext( '2d' );
  context.textBaseline = 'middle';
  context.textAlign = 'center';

  let bit = [
    0,
    0,1,1,1,1,1,1,1,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
  ];
  let bitAni = [
    0,
    0,0,0,1,1,1,1,1,
    0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
  ];
  let hex = '';
  let prevHex = '';

  let prevResult = stringBitToFloat( '0000,0000,0000,0000,0000,0000,0000,0000' );
  let result = stringBitToFloat( '0000,0000,0000,0000,0000,0000,0000,0000' );
  let calcAni = 0.0;

  let frame = 0;

  let calc = function() {
    for ( let iBit = 0; iBit < 32; iBit ++ ) {
      bit[ iBit ] = xorshift() < 0.5 ? 0.0 : 1.0;
    }

    result = stringBitToFloat( bit.reduce( function( _str, _v ) {
      _str += _v;
      return _str;
    }, '' ) );
    calcAni = 1.0;

    hex = '0x';
    for ( let iHex = 0; iHex < 8; iHex ++ ) {
      let sum = 0;
      for ( let iBit = 0; iBit < 4; iBit ++ ) {
        sum += bit[ iHex * 4 + iBit ] * Math.pow( 2.0, 3 - iBit );
      }
      hex += sum.toString( 16 );
    }
  }
  calc();

  let background = function() {

    context.fillStyle = '#fff';
    context.fillRect( 0, 0, 512, 512 );

  }

  let update = function() {

    if ( frame % 200 === 0 ) {
      if ( frame % 2000 === 0 ) {
        xorshift(1);
      }

      prevResult = result;
      prevHex = hex;

      while ( true ) {
        calc();
        if ( 0.01 < Math.abs( result.ret ) && Math.abs( result.ret ) < 1e7 ) {
          break;
        }
      }
    }

    // ------
    // animate variables

    let aniSpeed = 0.03;
    for ( let iBit = 0; iBit < 32; iBit ++ ) {
      bitAni[ iBit ] += ( bit[ iBit ] - bitAni[ iBit ] ) * aniSpeed;
    };
    calcAni *= ( 1.0 - aniSpeed );

    // ------
    // background

    background();

    // ------
    // top hex

    context.fillStyle = '#888';
    context.font = '500 40px Wt-Position-Mono';
    context.fillText( hex, 256, 20 + calcAni * 40.0 );
    context.fillText( prevHex, 256, -20 + calcAni * 40.0 );

    let topHex = context.getImageData( 0, 0, 512, 40 );
    background();

    // ------
    // top bits

    context.font = '500 20px Wt-Position-Mono';
    for ( let iBit = 0; iBit < 32; iBit ++ ) {
      let x;
      if ( iBit === 0 ) {
        context.fillStyle = '#e43';
        x = 50 + iBit * 12;
      } else if ( iBit < 9 ) {
        context.fillStyle = '#e73';
        x = 70 + iBit * 12;
      } else {
        context.fillStyle = '#eb3';
        x = 90 + iBit * 12;
      }
      context.fillText( '0', x, 10 + bitAni[ iBit ] * 20.0 );
      context.fillText( '1', x, -10 + bitAni[ iBit ] * 20.0 );
    }

    let topBits = context.getImageData( 0, 0, 512, 20 );
    background();

    // ------
    // interpret

    context.font = '500 40px Wt-Position-Mono';

    context.fillStyle = '#e43';
    context.fillText( ( result.sign ) ? '-' : '+', 48, 20 + calcAni * 40.0 );
    context.fillText( ( prevResult.sign ) ? '-' : '+', 48, -20 + calcAni * 40.0 );

    context.fillStyle = '#e73';
    context.fillText( '2^', 108, 20 );
    context.fillText( ( result.exp ), 160, 20 + calcAni * 40.0 );
    context.fillText( ( prevResult.exp ), 160, -20 + calcAni * 40.0 );

    context.fillStyle = '#eb3';
    context.fillText( '1.', 272, 20 );
    context.fillText( ( result.frac ).toFixed( 7 ).substring( 2 ), 384, 20 + calcAni * 40.0 );
    context.fillText( ( prevResult.frac ).toFixed( 7 ).substring( 2 ), 384, -20 + calcAni * 40.0 );

    context.fillStyle = '#888';
    context.fillText( '*', 218, 20 );

    let interpret = context.getImageData( 0, 0, 512, 40 );
    background();
    context.putImageData( interpret, 0, 0 );

    context.font = '500 10px Wt-Position-Mono';

    context.fillStyle = '#e43';
    context.fillText( 'Sign', 46, 50 );
    context.fillRect( 31, 43, 30, 1 );

    context.fillStyle = '#e73';
    context.fillText( 'Exp', 92, 50 );
    context.fillRect( 77, 43, 110, 1 );

    context.fillStyle = '#eb3';
    context.fillText( 'Frac', 260, 50 );
    context.fillRect( 245, 43, 230, 1 );

    interpret = context.getImageData( 0, 0, 512, 60 );
    background();

    // ------
    // answer

    context.fillStyle = '#888';
    context.font = '500 40px Wt-Position-Mono';
    context.fillText( ( '= ' + ( result.ret ).toFixed( 4 ) ), 256, 20 + calcAni * 40.0 );
    context.fillText( ( '= ' + ( prevResult.ret ).toFixed( 4 ) ), 256, -20 + calcAni * 40.0 );

    let answer = context.getImageData( 0, 0, 512, 40 );
    background();

    // ------
    // draw

    context.putImageData( topHex, 0, 112 );
    context.putImageData( topBits, 0, 172 );
    context.putImageData( interpret, 0, 240 );
    context.putImageData( answer, 0, 350 );

    context.fillStyle = '#888';
    context.fillRect( 16, 212, 480, 1 );
    context.fillRect( 16, 320, 480, 1 );

    // ------
    // ending

    if ( renderCheckbox.checked ) {
      let a = document.createElement( 'a' );
      let url = canvas.toDataURL();
      a.href = url;
      a.download = ( '0000' + frame ).slice( -5 ) + '.png';
      a.click();
    }

    frame ++;
    requestAnimationFrame( update );

  };

  button.onclick = function() {
    update();
  }

} )();
