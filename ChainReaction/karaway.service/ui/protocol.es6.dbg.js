'use strict';
var input, output, keybuf, end, s, n, start, outstr, realBuf, k, exports = exports || {};
exports.SaltyRNG = function(e, g) {
  function f(e, g, f) {
    return (e[g >> 3] & 255 >>> 8 - f << (g & 7) & 255) >>> (g & 7);
  }
  function p() {
    if (w) {
      w.phase() || console.trace("PLEASE INIT THIS USAGE!");
      if (w.absorbing() || 32768 <= H.total_bits) {
        w.squeezing() && (w.init(), w.update(H.entropy)), "function" === typeof H.getSalt && (H.getSalt(H.saltbuf), H.saltbuf.length && w.update(H.saltbuf)), w.final(), H.used = 0;
      }
      w.squeezing() && (H.entropy = w.squeeze(64));
    }
    if (v) {
      H.saltbuf.length = 0;
      "function" === typeof H.getSalt && H.getSalt(H.saltbuf);
      if (H.saltbuf.length) {
        H.entropy || (H.entropy = new Uint8Array(32));
        var e = toUTF8Array(H.saltbuf.join());
        v.update(e).finish(H.entropy).clean();
      } else {
        H.entropy || (H.entropy = new Uint8Array(32)), v.finish(H.entropy).clean();
      }
      v.update(H.entropy);
    }
    H.available = 8 * H.entropy.length;
    H.used = 0;
  }
  const v = g ? 0 === g.mode ? new SHA256 : null : new SHA256, w = g ? 1 === g.mode ? KangarooTwelve() : null : null;
  var H = {getSalt:e, feed(e) {
    "string" === typeof e && (e = toUTF8Array(e));
    v ? v.update(e) : w.update(e);
  }, saltbuf:[], entropy:null, available:0, used:0, total_bits:0, initialEntropy:"test", save() {
    return {saltbuf:this.saltbuf.slice(0), entropy:this.entropy ? this.entropy.slice(0) : null, available:this.available, used:this.used, state:v ? v.clone() : w ? w.clone() : null};
  }, restore(e) {
    this.saltbuf = e.saltbuf.slice(0);
    this.entropy = e.entropy ? e.entropy.slice(0) : null;
    this.available = e.available;
    this.used = e.used;
    v && v.copy(e.state);
    w && w.copy(e.state);
  }, reset() {
    if (this.initialEntropy) {
      var e = this.initialEntropy;
      if (v) {
        var g = Array(32);
        v.update(e).finish(g).clean();
        e = g;
      } else {
        w ? (w.update(e), w.final(), e = w.squeeze(64)) : (console.log("no engine for salty generator"), e = void 0);
      }
    } else {
      e = null;
    }
    this.entropy = e;
    this.total_bits = this.used = this.available = 0;
    v && v.clean();
    w && w.init();
    console;
  }, getByte() {
    if (this.used & 7) {
      return (new Uint8Array(this.getBuffer(8)))[0];
    }
    this.available === this.used && p();
    this.total_bits += 8;
    var e = this.entropy[this.used >> 3];
    this.used += 8;
    return e;
  }, getBits(e, g) {
    e || (e = 32, g = !0);
    if (32 < e) {
      throw "Use getBuffer for more than 32 bits.";
    }
    var f = this.getBuffer(e);
    if (g) {
      if (g = new Uint32Array(f), f = new Int32Array(f), g[0] & 1 << e - 1) {
        var p = -1;
        p <<= e - 1;
        g[0] |= p;
      }
    } else {
      f = new Uint32Array(f);
    }
    return f[0];
  }, getBuffer(e) {
    let g = 0, v = 0, w = new ArrayBuffer(4 * (e + 31 >> 5)), H = new Uint8Array(w);
    this.total_bits += e;
    {
      let Y, la = 0, ua;
      do {
        ua = 8 < e ? 8 : e;
        8 - la < ua && (ua = 8 - la);
        var ya = 8 - (this.used & 7);
        ya < ua && (ua = ya);
        ya = 8 - (v & 7);
        ya < ua && (ua = ya);
        ua > this.available - this.used ? (this.available - this.used && (la = this.available - this.used, Y = f(this.entropy, this.used, la)), p(), e -= la) : (ya = f(this.entropy, this.used, ua), this.used += ua, la && (ya = Y | ya << la, la = 0), H[g] |= ya << (v & 7), v += ua, 8 == v && (g++, v = 0), e -= ua);
      } while (e);
      return w;
    }
  }};
  H.reset();
  return H;
};
var K = new Uint32Array([1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 
2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298]);
function blocks(e, g, f, p, v) {
  for (var w, H, U, L, Y, la, aa, ya, xa, V, ua; 64 <= v;) {
    w = g[0];
    H = g[1];
    U = g[2];
    L = g[3];
    Y = g[4];
    la = g[5];
    aa = g[6];
    ya = g[7];
    for (V = 0; 16 > V; V++) {
      ua = p + 4 * V, e[V] = (f[ua] & 255) << 24 | (f[ua + 1] & 255) << 16 | (f[ua + 2] & 255) << 8 | f[ua + 3] & 255;
    }
    for (V = 16; 64 > V; V++) {
      xa = e[V - 2], ua = (xa >>> 17 | xa << 15) ^ (xa >>> 19 | xa << 13) ^ xa >>> 10, xa = e[V - 15], xa = (xa >>> 7 | xa << 25) ^ (xa >>> 18 | xa << 14) ^ xa >>> 3, e[V] = (ua + e[V - 7] | 0) + (xa + e[V - 16] | 0);
    }
    for (V = 0; 64 > V; V++) {
      ua = (((Y >>> 6 | Y << 26) ^ (Y >>> 11 | Y << 21) ^ (Y >>> 25 | Y << 7)) + (Y & la ^ ~Y & aa) | 0) + (ya + (K[V] + e[V] | 0) | 0) | 0, xa = ((w >>> 2 | w << 30) ^ (w >>> 13 | w << 19) ^ (w >>> 22 | w << 10)) + (w & H ^ w & U ^ H & U) | 0, ya = aa, aa = la, la = Y, Y = L + ua | 0, L = U, U = H, H = w, w = ua + xa | 0;
    }
    g[0] += w;
    g[1] += H;
    g[2] += U;
    g[3] += L;
    g[4] += Y;
    g[5] += la;
    g[6] += aa;
    g[7] += ya;
    p += 64;
    v -= 64;
  }
  return p;
}
function SHA256() {
  if (!(this instanceof SHA256)) {
    return new SHA256;
  }
  this.v = new Uint32Array(8);
  this.w = new Int32Array(64);
  this.buf = new Uint8Array(128);
  this.len = this.buflen = 0;
  this.reset();
}
SHA256.prototype.clone = function() {
  var e = new SHA256;
  e.v = this.v.slice(0);
  e.w = this.w.slice(0);
  e.buf = this.buf.slice(0);
  e.buflen = this.buflen;
  e.len = this.len;
  return e;
};
SHA256.prototype.copy = function(e) {
  this.v = e.v;
  this.w = e.w;
  this.buf = e.buf;
  this.buflen = e.buflen;
  this.len = e.len;
  return this;
};
SHA256.prototype.reset = function() {
  this.v[0] = 1779033703;
  this.v[1] = 3144134277;
  this.v[2] = 1013904242;
  this.v[3] = 2773480762;
  this.v[4] = 1359893119;
  this.v[5] = 2600822924;
  this.v[6] = 528734635;
  this.v[7] = 1541459225;
  this.len = this.buflen = 0;
};
SHA256.prototype.clean = function() {
  var e;
  for (e = 0; e < this.buf.length; e++) {
    this.buf[e] = 0;
  }
  for (e = 0; e < this.w.length; e++) {
    this.w[e] = 0;
  }
  this.reset();
};
SHA256.prototype.update = function(e, g) {
  var f = 0;
  g = "undefined" !== typeof g ? g : e.length;
  this.len += g;
  if (0 < this.buflen) {
    for (; 64 > this.buflen && 0 < g;) {
      this.buf[this.buflen++] = e[f++], g--;
    }
    64 === this.buflen && (blocks(this.w, this.v, this.buf, 0, 64), this.buflen = 0);
  }
  if (64 <= g) {
    f = blocks(this.w, this.v, e, f, g);
    for (var p = g %= 64; 64 > p; p++) {
      this.buf[p] = e[f - 64 + p];
    }
  }
  for (; 0 < g;) {
    this.buf[this.buflen++] = e[f++], g--;
  }
  return this;
};
SHA256.prototype.finish = function(e) {
  var g = this.len, f = this.buflen, p = g / 536870912 | 0, v = g << 3;
  g = 56 > g % 64 ? 64 : 128;
  this.buf[f] = 128;
  for (f += 1; f < g - 8; f++) {
    this.buf[f] = 0;
  }
  this.buf[g - 8] = p >>> 24 & 255;
  this.buf[g - 7] = p >>> 16 & 255;
  this.buf[g - 6] = p >>> 8 & 255;
  this.buf[g - 5] = p >>> 0 & 255;
  this.buf[g - 4] = v >>> 24 & 255;
  this.buf[g - 3] = v >>> 16 & 255;
  this.buf[g - 2] = v >>> 8 & 255;
  this.buf[g - 1] = v >>> 0 & 255;
  blocks(this.w, this.v, this.buf, 0, g);
  for (f = 0; 8 > f; f++) {
    e[4 * f] = this.v[f] >>> 24 & 255, e[4 * f + 1] = this.v[f] >>> 16 & 255, e[4 * f + 2] = this.v[f] >>> 8 & 255, e[4 * f + 3] = this.v[f] >>> 0 & 255;
  }
  return this;
};
function toUTF8Array(e) {
  for (var g = [], f = 0; f < e.length; f++) {
    var p = e.charCodeAt(f);
    128 > p ? g.push(p) : 2048 > p ? g.push(192 | p >> 6, 128 | p & 63) : 55296 > p || 57344 <= p ? g.push(224 | p >> 12, 128 | p >> 6 & 63, 128 | p & 63) : (f++, p = 65536 + ((p & 1023) << 10 | e.charCodeAt(f) & 1023), g.push(240 | p >> 18, 128 | p >> 12 & 63, 128 | p >> 6 & 63, 128 | p & 63));
  }
  return g;
}
const k12Module = {};
var k12 = function(e) {
  function g(d) {
    w(!Wa);
    var e = Ya;
    Ya = Ya + d + 15 & -16;
    return e;
  }
  function f(d) {
    w(Fa);
    var e = na[Fa >> 2];
    d = e + d + 15 & -16;
    na[Fa >> 2] = d;
    return d >= W ? (L(), na[Fa >> 2] = e, 0) : e;
  }
  function p(d, e) {
    e || (e = 16);
    return Math.ceil(d / e) * e;
  }
  function v(d) {
    switch(d) {
      case "i1":
      case "i8":
        return 1;
      case "i16":
        return 2;
      case "i32":
        return 4;
      case "i64":
        return 8;
      case "float":
        return 4;
      case "double":
        return 8;
      default:
        return "*" === d[d.length - 1] ? 4 : "i" === d[0] ? (d = parseInt(d.substr(1)), w(0 === d % 8), d / 8) : 0;
    }
  }
  function w(d, e) {
    d || Ja("Assertion failed: " + e);
  }
  function H(d, e) {
    if (0 === e || !d) {
      return "";
    }
    for (var g = 0, f, Ga = 0;;) {
      f = pa[d + Ga >> 0];
      g |= f;
      if (0 == f && !e) {
        break;
      }
      Ga++;
      if (e && Ga == e) {
        break;
      }
    }
    e || (e = Ga);
    f = "";
    if (128 > g) {
      for (; 0 < e;) {
        g = String.fromCharCode.apply(String, pa.subarray(d, d + Math.min(e, 1024))), f = f ? f + g : g, d += 1024, e -= 1024;
      }
      return f;
    }
    return U(pa, d);
  }
  function U(d, e) {
    for (var g = e; d[g];) {
      ++g;
    }
    if (16 < g - e && d.subarray && u) {
      return u.decode(d.subarray(e, g));
    }
    for (g = "";;) {
      var f = d[e++];
      if (!f) {
        return g;
      }
      if (f & 128) {
        var Ga = d[e++] & 63;
        if (192 == (f & 224)) {
          g += String.fromCharCode((f & 31) << 6 | Ga);
        } else {
          var m = d[e++] & 63;
          if (224 == (f & 240)) {
            f = (f & 15) << 12 | Ga << 6 | m;
          } else {
            var Ca = d[e++] & 63;
            if (240 == (f & 248)) {
              f = (f & 7) << 18 | Ga << 12 | m << 6 | Ca;
            } else {
              var p = d[e++] & 63;
              if (248 == (f & 252)) {
                f = (f & 3) << 24 | Ga << 18 | m << 12 | Ca << 6 | p;
              } else {
                var v = d[e++] & 63;
                f = (f & 1) << 30 | Ga << 24 | m << 18 | Ca << 12 | p << 6 | v;
              }
            }
          }
          65536 > f ? g += String.fromCharCode(f) : (f -= 65536, g += String.fromCharCode(55296 | f >> 10, 56320 | f & 1023));
        }
      } else {
        g += String.fromCharCode(f);
      }
    }
  }
  function L() {
    Ja("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + W + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
  }
  function Y(d) {
    for (; 0 < d.length;) {
      var e = d.shift();
      if ("function" == typeof e) {
        e();
      } else {
        var g = e.func;
        "number" === typeof g ? void 0 === e.arg ? m.dynCall_v(g) : m.dynCall_vi(g, e.arg) : g(void 0 === e.arg ? null : e.arg);
      }
    }
  }
  function la(d) {
    return String.prototype.startsWith ? d.startsWith(ib) : 0 === d.indexOf(ib);
  }
  function aa(d, e) {
    ra.varargs = e;
    try {
      var g = ra.get(), f = ra.get(), Ga = ra.get();
      d = 0;
      aa.buffers || (aa.buffers = [null, [], []], aa.printChar = function(d, e) {
        var g = aa.buffers[d];
        w(g);
        0 === e || 10 === e ? ((1 === d ? m.print : m.printErr)(U(g, 0)), g.length = 0) : g.push(e);
      });
      for (e = 0; e < Ga; e++) {
        for (var u = na[f + 8 * e >> 2], Ca = na[f + (8 * e + 4) >> 2], p = 0; p < Ca; p++) {
          aa.printChar(g, pa[u + p]);
        }
        d += Ca;
      }
      return d;
    } catch (rb) {
      return "undefined" !== typeof FS && rb instanceof FS.ErrnoError || Ja(rb), -rb.errno;
    }
  }
  function ya(d) {
    for (var e = [], g = 0; g < d.length; g++) {
      var f = d[g];
      255 < f && (Za && w(!1, "Character code " + f + " (" + String.fromCharCode(f) + ")  at offset " + g + " not in 0x00-0xFF."), f &= 255);
      e.push(String.fromCharCode(f));
    }
    return e.join("");
  }
  function xa(e) {
    if (la(e)) {
      e = e.slice(ib.length);
      if ("boolean" === typeof d && d) {
        try {
          var g = Buffer.from(e, "base64");
        } catch (sb) {
          g = new Buffer(e, "base64");
        }
        var f = new Uint8Array(g.buffer, g.byteOffset, g.byteLength);
      } else {
        try {
          var m = nb(e), Ga = new Uint8Array(m.length);
          for (g = 0; g < m.length; ++g) {
            Ga[g] = m.charCodeAt(g);
          }
          f = Ga;
        } catch (sb) {
          throw Error("Converting base64 string to bytes failed.");
        }
      }
      return f;
    }
  }
  function V(d) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + d + ")";
    this.status = d;
  }
  function ua(d) {
    function e() {
      if (!m.calledRun && (m.calledRun = !0, !ma)) {
        oa || (oa = !0, Y(db));
        Y(Ua);
        if (m.onRuntimeInitialized) {
          m.onRuntimeInitialized();
        }
        if (m.postRun) {
          for ("function" == typeof m.postRun && (m.postRun = [m.postRun]); m.postRun.length;) {
            La.unshift(m.postRun.shift());
          }
        }
        Y(La);
      }
    }
    if (!(0 < Ma)) {
      if (m.preRun) {
        for ("function" == typeof m.preRun && (m.preRun = [m.preRun]); m.preRun.length;) {
          va.unshift(m.preRun.shift());
        }
      }
      Y(va);
      0 < Ma || m.calledRun || (m.setStatus ? (m.setStatus("Running..."), setTimeout(function() {
        setTimeout(function() {
          m.setStatus("");
        }, 1);
        e();
      }, 1)) : e());
    }
  }
  function Ja(d) {
    if (m.onAbort) {
      m.onAbort(d);
    }
    void 0 !== d ? (m.print(d), m.printErr(d), d = JSON.stringify(d)) : d = "";
    ma = !0;
    throw "abort(" + d + "). Build with -s ASSERTIONS=1 for more info.";
  }
  var m = "undefined" !== typeof m ? m : {}, da = {};
  for (za in m) {
    m.hasOwnProperty(za) && (da[za] = m[za]);
  }
  m.arguments = [];
  m.thisProgram = "./this.program";
  m.quit = function(d, e) {
    throw e;
  };
  m.preRun = [];
  m.postRun = [];
  var J = !1, R = !1, d = !1, S = !1;
  if (m.ENVIRONMENT) {
    if ("WEB" === m.ENVIRONMENT) {
      J = !0;
    } else {
      if ("WORKER" === m.ENVIRONMENT) {
        R = !0;
      } else {
        if ("NODE" === m.ENVIRONMENT) {
          d = !0;
        } else {
          if ("SHELL" === m.ENVIRONMENT) {
            S = !0;
          } else {
            throw Error("Module['ENVIRONMENT'] value is not valid. must be one of: WEB|WORKER|NODE|SHELL.");
          }
        }
      }
    }
  } else {
    J = "object" === typeof window, R = "function" === typeof importScripts, d = "object" === typeof process && "function" === typeof require && !J && !R, S = !J && !d && !R;
  }
  if (d) {
    var Ka, Na;
    m.read = function(d, e) {
      var g = xa(d);
      g || (Ka || (Ka = require("fs")), Na || (Na = require("path")), d = Na.normalize(d), g = Ka.readFileSync(d));
      return e ? g : g.toString();
    };
    m.readBinary = function(d) {
      d = m.read(d, !0);
      d.buffer || (d = new Uint8Array(d));
      w(d.buffer);
      return d;
    };
    1 < process.argv.length && (m.thisProgram = process.argv[1].replace(/\\/g, "/"));
    m.arguments = process.argv.slice(2);
    "undefined" !== typeof e && (e.exports = m);
    process.on("uncaughtException", function(d) {
      if (!(d instanceof V)) {
        throw d;
      }
    });
    process.on("unhandledRejection", function(d, e) {
      process.exit(1);
    });
    m.inspect = function() {
      return "[Emscripten Module object]";
    };
  } else {
    if (S) {
      "undefined" != typeof read && (m.read = function(d) {
        var e = xa(d);
        return e ? ya(e) : read(d);
      }), m.readBinary = function(d) {
        var e;
        if (e = xa(d)) {
          return e;
        }
        if ("function" === typeof readbuffer) {
          return new Uint8Array(readbuffer(d));
        }
        e = read(d, "binary");
        w("object" === typeof e);
        return e;
      }, "undefined" != typeof scriptArgs ? m.arguments = scriptArgs : "undefined" != typeof arguments && (m.arguments = arguments), "function" === typeof quit && (m.quit = function(d, e) {
        quit(d);
      });
    } else {
      if (J || R) {
        m.read = function(d) {
          try {
            var e = new XMLHttpRequest;
            e.open("GET", d, !1);
            e.send(null);
            return e.responseText;
          } catch (Oa) {
            if (d = xa(d)) {
              return ya(d);
            }
            throw Oa;
          }
        }, R && (m.readBinary = function(d) {
          try {
            var e = new XMLHttpRequest;
            e.open("GET", d, !1);
            e.responseType = "arraybuffer";
            e.send(null);
            return new Uint8Array(e.response);
          } catch (Oa) {
            if (d = xa(d)) {
              return d;
            }
            throw Oa;
          }
        }), m.readAsync = function(d, e, g) {
          var f = new XMLHttpRequest;
          f.open("GET", d, !0);
          f.responseType = "arraybuffer";
          f.onload = function() {
            if (200 == f.status || 0 == f.status && f.response) {
              e(f.response);
            } else {
              var m = xa(d);
              m ? e(m.buffer) : g();
            }
          };
          f.onerror = g;
          f.send(null);
        }, m.setWindowTitle = function(d) {
          document.title = d;
        };
      }
    }
  }
  m.print = "undefined" !== typeof console ? console.log.bind(console) : "undefined" !== typeof print ? print : null;
  m.printErr = "undefined" !== typeof printErr ? printErr : "undefined" !== typeof console && console.warn.bind(console) || m.print;
  m.print = m.print;
  m.printErr = m.printErr;
  for (za in da) {
    da.hasOwnProperty(za) && (m[za] = da[za]);
  }
  da = void 0;
  var ma = 0, u = "undefined" !== typeof TextDecoder ? new TextDecoder("utf8") : void 0;
  "undefined" !== typeof TextDecoder && new TextDecoder("utf-16le");
  var Pa, pa, Da, na, Ha, jb, Ya, eb, gb, Fa;
  var za = Ya = eb = gb = R = eb = Fa = 0;
  var Wa = !1;
  R = m.TOTAL_STACK || 5242880;
  var W = m.TOTAL_MEMORY || 16777216;
  W < R && m.printErr("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + W + "! (TOTAL_STACK=" + R + ")");
  m.buffer ? da = m.buffer : (da = new ArrayBuffer(W), m.buffer = da);
  m.HEAP8 = Pa = new Int8Array(da);
  m.HEAP16 = Da = new Int16Array(da);
  m.HEAP32 = na = new Int32Array(da);
  m.HEAPU8 = pa = new Uint8Array(da);
  m.HEAPU16 = new Uint16Array(da);
  m.HEAPU32 = new Uint32Array(da);
  m.HEAPF32 = Ha = new Float32Array(da);
  m.HEAPF64 = jb = new Float64Array(da);
  na[0] = 1668509029;
  Da[1] = 25459;
  if (115 !== pa[2] || 99 !== pa[3]) {
    throw "Runtime error: expected the system to be little-endian!";
  }
  var va = [], db = [], Ua = [], Ia = [], La = [], oa = !1, ab = Math.abs, ob = Math.ceil, kb = Math.floor, bb = Math.min, Ma = 0, lb = null, fb = null;
  m.preloadedImages = {};
  m.preloadedAudios = {};
  var Qa = null, ib = "data:application/octet-stream;base64,";
  za = 8;
  Ya = za + 4608;
  db.push();
  Qa = "data:application/octet-stream;base64,AQAAAAAAAAAAAAAAiQAAAAAAAACLAACAAAAAAICAAIABAAAAiwAAAAEAAAAAgAAAAQAAAIiAAIABAAAAggAAgAAAAAALAAAAAAAAAAoAAAABAAAAgoAAAAAAAAADgAAAAQAAAIuAAAABAAAACwAAgAEAAACKAACAAQAAAIEAAIAAAAAAgQAAgAAAAAAIAACAAAAAAIMAAAAAAAAAA4AAgAEAAACIgACAAAAAAIgAAIABAAAAAIAAAAAAAACCgACA/wAAANAAAAAFAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAgAAAAAOAAAABAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAK/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADcDQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFBIQVNFOiVkABEACgAREREAAAAABQAAAAAAAAkAAAAACwAAAAAAAAAAEQAPChEREQMKBwABEwkLCwAACQYLAAALAAYRAAAAERERAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAAAABEACgoREREACgAAAgAJCwAAAAkACwAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAMAAAAAAwAAAAACQwAAAAAAAwAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAADQAAAAQNAAAAAAkOAAAAAAAOAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAA8AAAAADwAAAAAJEAAAAAAAEAAAEAAAEgAAABISEgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAAAAEhISAAAAAAAACQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwAAAAAAAAAAAAAACgAAAAAKAAAAAAkLAAAAAAALAAALAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAwAAAAADAAAAAAJDAAAAAAADAAADAAALSsgICAwWDB4AChudWxsKQAtMFgrMFggMFgtMHgrMHggMHgAaW5mAElORgBuYW4ATkFOADAxMjM0NTY3ODlBQkNERUYuAFQhIhkNAQIDEUscDBAECx0SHidobm9wcWIgBQYPExQVGggWBygkFxgJCg4bHyUjg4J9JiorPD0+P0NHSk1YWVpbXF1eX2BhY2RlZmdpamtscnN0eXp7fABJbGxlZ2FsIGJ5dGUgc2VxdWVuY2UARG9tYWluIGVycm9yAFJlc3VsdCBub3QgcmVwcmVzZW50YWJsZQBOb3QgYSB0dHkAUGVybWlzc2lvbiBkZW5pZWQAT3BlcmF0aW9uIG5vdCBwZXJtaXR0ZWQATm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeQBObyBzdWNoIHByb2Nlc3MARmlsZSBleGlzdHMAVmFsdWUgdG9vIGxhcmdlIGZvciBkYXRhIHR5cGUATm8gc3BhY2UgbGVmdCBvbiBkZXZpY2UAT3V0IG9mIG1lbW9yeQBSZXNvdXJjZSBidXN5AEludGVycnVwdGVkIHN5c3RlbSBjYWxsAFJlc291cmNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlAEludmFsaWQgc2VlawBDcm9zcy1kZXZpY2UgbGluawBSZWFkLW9ubHkgZmlsZSBzeXN0ZW0ARGlyZWN0b3J5IG5vdCBlbXB0eQBDb25uZWN0aW9uIHJlc2V0IGJ5IHBlZXIAT3BlcmF0aW9uIHRpbWVkIG91dABDb25uZWN0aW9uIHJlZnVzZWQASG9zdCBpcyBkb3duAEhvc3QgaXMgdW5yZWFjaGFibGUAQWRkcmVzcyBpbiB1c2UAQnJva2VuIHBpcGUASS9PIGVycm9yAE5vIHN1Y2ggZGV2aWNlIG9yIGFkZHJlc3MAQmxvY2sgZGV2aWNlIHJlcXVpcmVkAE5vIHN1Y2ggZGV2aWNlAE5vdCBhIGRpcmVjdG9yeQBJcyBhIGRpcmVjdG9yeQBUZXh0IGZpbGUgYnVzeQBFeGVjIGZvcm1hdCBlcnJvcgBJbnZhbGlkIGFyZ3VtZW50AEFyZ3VtZW50IGxpc3QgdG9vIGxvbmcAU3ltYm9saWMgbGluayBsb29wAEZpbGVuYW1lIHRvbyBsb25nAFRvbyBtYW55IG9wZW4gZmlsZXMgaW4gc3lzdGVtAE5vIGZpbGUgZGVzY3JpcHRvcnMgYXZhaWxhYmxlAEJhZCBmaWxlIGRlc2NyaXB0b3IATm8gY2hpbGQgcHJvY2VzcwBCYWQgYWRkcmVzcwBGaWxlIHRvbyBsYXJnZQBUb28gbWFueSBsaW5rcwBObyBsb2NrcyBhdmFpbGFibGUAUmVzb3VyY2UgZGVhZGxvY2sgd291bGQgb2NjdXIAU3RhdGUgbm90IHJlY292ZXJhYmxlAFByZXZpb3VzIG93bmVyIGRpZWQAT3BlcmF0aW9uIGNhbmNlbGVkAEZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZABObyBtZXNzYWdlIG9mIGRlc2lyZWQgdHlwZQBJZGVudGlmaWVyIHJlbW92ZWQARGV2aWNlIG5vdCBhIHN0cmVhbQBObyBkYXRhIGF2YWlsYWJsZQBEZXZpY2UgdGltZW91dABPdXQgb2Ygc3RyZWFtcyByZXNvdXJjZXMATGluayBoYXMgYmVlbiBzZXZlcmVkAFByb3RvY29sIGVycm9yAEJhZCBtZXNzYWdlAEZpbGUgZGVzY3JpcHRvciBpbiBiYWQgc3RhdGUATm90IGEgc29ja2V0AERlc3RpbmF0aW9uIGFkZHJlc3MgcmVxdWlyZWQATWVzc2FnZSB0b28gbGFyZ2UAUHJvdG9jb2wgd3JvbmcgdHlwZSBmb3Igc29ja2V0AFByb3RvY29sIG5vdCBhdmFpbGFibGUAUHJvdG9jb2wgbm90IHN1cHBvcnRlZABTb2NrZXQgdHlwZSBub3Qgc3VwcG9ydGVkAE5vdCBzdXBwb3J0ZWQAUHJvdG9jb2wgZmFtaWx5IG5vdCBzdXBwb3J0ZWQAQWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZCBieSBwcm90b2NvbABBZGRyZXNzIG5vdCBhdmFpbGFibGUATmV0d29yayBpcyBkb3duAE5ldHdvcmsgdW5yZWFjaGFibGUAQ29ubmVjdGlvbiByZXNldCBieSBuZXR3b3JrAENvbm5lY3Rpb24gYWJvcnRlZABObyBidWZmZXIgc3BhY2UgYXZhaWxhYmxlAFNvY2tldCBpcyBjb25uZWN0ZWQAU29ja2V0IG5vdCBjb25uZWN0ZWQAQ2Fubm90IHNlbmQgYWZ0ZXIgc29ja2V0IHNodXRkb3duAE9wZXJhdGlvbiBhbHJlYWR5IGluIHByb2dyZXNzAE9wZXJhdGlvbiBpbiBwcm9ncmVzcwBTdGFsZSBmaWxlIGhhbmRsZQBSZW1vdGUgSS9PIGVycm9yAFF1b3RhIGV4Y2VlZGVkAE5vIG1lZGl1bSBmb3VuZABXcm9uZyBtZWRpdW0gdHlwZQBObyBlcnJvciBpbmZvcm1hdGlvbg==";
  za = Ya;
  Ya += 16;
  var ra = {varargs:0, get:function(d) {
    ra.varargs += 4;
    return na[ra.varargs - 4 >> 2];
  }, getStr:function() {
    return H(ra.get());
  }, get64:function() {
    var d = ra.get(), e = ra.get();
    0 <= d ? w(0 === e) : w(-1 === e);
    return d;
  }, getZero:function() {
    w(0 === ra.get());
  }};
  J = function(d, e, m, u) {
    if ("number" === typeof d) {
      var p = !0;
      var Ca = d;
    } else {
      p = !1, Ca = d.length;
    }
    var Ga = "string" === typeof e ? e : null;
    m = 4 == m ? u : ["function" === typeof Sa ? Sa : g, cb, g, f][void 0 === m ? 2 : m](Math.max(Ca, Ga ? 1 : e.length));
    if (p) {
      u = m;
      w(0 == (m & 3));
      for (d = m + (Ca & -4); u < d; u += 4) {
        na[u >> 2] = 0;
      }
      for (d = m + Ca; u < d;) {
        Pa[u++ >> 0] = 0;
      }
      return m;
    }
    if ("i8" === Ga) {
      return d.subarray || d.slice ? pa.set(d, m) : pa.set(new Uint8Array(d), m), m;
    }
    u = 0;
    for (var R, M; u < Ca;) {
      var H = d[u];
      p = Ga || e[u];
      if (0 === p) {
        u++;
      } else {
        "i64" == p && (p = "i32");
        var J = m + u, S = p;
        S = S || "i8";
        "*" === S.charAt(S.length - 1) && (S = "i32");
        switch(S) {
          case "i1":
            Pa[J >> 0] = H;
            break;
          case "i8":
            Pa[J >> 0] = H;
            break;
          case "i16":
            Da[J >> 1] = H;
            break;
          case "i32":
            na[J >> 2] = H;
            break;
          case "i64":
            tempI64 = [H >>> 0, (tempDouble = H, 1 <= +ab(tempDouble) ? 0 < tempDouble ? (bb(+kb(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+ob((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)];
            na[J >> 2] = tempI64[0];
            na[J + 4 >> 2] = tempI64[1];
            break;
          case "float":
            Ha[J >> 2] = H;
            break;
          case "double":
            jb[J >> 3] = H;
            break;
          default:
            Ja("invalid type for setValue: " + S);
        }
        M !== p && (R = v(p), M = p);
        u += R;
      }
    }
    return m;
  }([8, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 7, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 
  1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0], "i8", 2);
  Fa = g(4);
  eb = gb = p(Ya);
  R = eb + R;
  eb = p(R);
  na[Fa >> 2] = eb;
  Wa = !0;
  var Za = !1, nb = "function" === typeof atob ? atob : function(d) {
    var e = "", g = 0;
    d = d.replace(/[^A-Za-z0-9\+\/=]/g, "");
    do {
      var f = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(d.charAt(g++));
      var m = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(d.charAt(g++));
      var u = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(d.charAt(g++));
      var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".indexOf(d.charAt(g++));
      f = f << 2 | m >> 4;
      m = (m & 15) << 4 | u >> 2;
      var v = (u & 3) << 6 | p;
      e += String.fromCharCode(f);
      64 !== u && (e += String.fromCharCode(m));
      64 !== p && (e += String.fromCharCode(v));
    } while (g < d.length);
    return e;
  };
  m.asmGlobalArg = {Math, Int8Array, Int16Array, Int32Array, Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array, NaN, Infinity};
  m.asmLibraryArg = {abort:Ja, assert:w, enlargeMemory:function() {
    L();
  }, getTotalMemory:function() {
    return W;
  }, abortOnCannotGrowMemory:L, invoke_ii:function(d, e) {
    try {
      return m.dynCall_ii(d, e);
    } catch (Oa) {
      if ("number" !== typeof Oa && "longjmp" !== Oa) {
        throw Oa;
      }
      m.setThrew(1, 0);
    }
  }, invoke_iiii:function(d, e, g, f) {
    try {
      return m.dynCall_iiii(d, e, g, f);
    } catch (qb) {
      if ("number" !== typeof qb && "longjmp" !== qb) {
        throw qb;
      }
      m.setThrew(1, 0);
    }
  }, ___setErrNo:function(d) {
    m.___errno_location && (na[m.___errno_location() >> 2] = d);
    return d;
  }, ___syscall140:function(d, e) {
    ra.varargs = e;
    try {
      var g = ra.getStreamFromFD();
      ra.get();
      var f = ra.get(), m = ra.get(), u = ra.get();
      FS.llseek(g, f, u);
      na[m >> 2] = g.position;
      g.getdents && 0 === f && 0 === u && (g.getdents = null);
      return 0;
    } catch (Xa) {
      return "undefined" !== typeof FS && Xa instanceof FS.ErrnoError || Ja(Xa), -Xa.errno;
    }
  }, ___syscall146:aa, ___syscall54:function(d, e) {
    ra.varargs = e;
    return 0;
  }, ___syscall6:function(d, e) {
    ra.varargs = e;
    try {
      var g = ra.getStreamFromFD();
      FS.close(g);
      return 0;
    } catch (pb) {
      return "undefined" !== typeof FS && pb instanceof FS.ErrnoError || Ja(pb), -pb.errno;
    }
  }, _emscripten_memcpy_big:function(d, e, g) {
    pa.set(pa.subarray(e, e + g), d);
    return d;
  }, flush_NO_FILESYSTEM:function() {
    var d = m._fflush;
    d && d(0);
    if (d = aa.printChar) {
      var e = aa.buffers;
      e[1].length && d(1, 10);
      e[2].length && d(2, 10);
    }
  }, DYNAMICTOP_PTR:Fa, tempDoublePtr:za, ABORT:ma, STACKTOP:gb, STACK_MAX:R, cttz_i8:J};
  da = function(d, e, g) {
    function f(h, l, ja) {
      h |= 0;
      l |= 0;
      ja |= 0;
      ja = ja + -1 | 0;
      if (!(-1 >= (ja | 0))) {
        for (;;) {
          var d = c[l >> 2] | 0;
          var Ta = (d >>> 1 ^ d) & 572662306;
          d ^= Ta;
          Ta = d ^ Ta << 1;
          d = (Ta ^ d >>> 2) & 202116108;
          Ta ^= d;
          d = Ta ^ d << 2;
          Ta = (d ^ Ta >>> 4) & 15728880;
          d ^= Ta;
          Ta = d ^ Ta << 4;
          d = (Ta ^ d >>> 8) & 65280;
          var z = c[l + 4 >> 2] | 0;
          var e = (z >>> 1 ^ z) & 572662306;
          z ^= e;
          e = z ^ e << 1;
          z = (e ^ z >>> 2) & 202116108;
          e ^= z;
          z = e ^ z << 2;
          e = (z ^ e >>> 4) & 15728880;
          z ^= e;
          e = z ^ e << 4;
          z = (e ^ z >>> 8) & 65280;
          var t = h + 4 | 0;
          c[h >> 2] ^= (z ^ e) << 16 | d ^ Ta & 65535;
          c[t >> 2] ^= (d << 8 ^ Ta) >>> 16 | z << 8 ^ e & -65536;
          ja = ja + -1 | 0;
          if (-1 >= (ja | 0)) {
            break;
          } else {
            l = l + 8 | 0, h = h + 8 | 0;
          }
        }
      }
    }
    function m(h, l, ja) {
      h |= 0;
      l |= 0;
      ja |= 0;
      ja = ja + -1 | 0;
      if (!(-1 >= (ja | 0))) {
        for (;;) {
          var d = c[h >> 2] | 0;
          var e = c[h + 4 >> 2] | 0;
          var z = d >>> 16;
          var A = (e << 8 ^ d) & 65280;
          d = A ^ (e << 16 | d & 65535);
          A = d ^ A << 8;
          d = (A ^ d >>> 4) & 15728880;
          A ^= d;
          d = A ^ d << 4;
          A = (d ^ A >>> 2) & 202116108;
          d ^= A;
          A = d ^ A << 2;
          d = (A ^ d >>> 1) & 572662306;
          var t = (e >>> 8 ^ z) & 65280;
          z = t ^ (e & -65536 | z);
          t = z ^ t << 8;
          z = (t ^ z >>> 4) & 15728880;
          t ^= z;
          z = t ^ z << 4;
          t = (z ^ t >>> 2) & 202116108;
          z ^= t;
          t = z ^ t << 2;
          z = (t ^ z >>> 1) & 572662306;
          c[l >> 2] = d ^ A ^ d << 1;
          c[l + 4 >> 2] = z ^ t ^ z << 1;
          ja = ja + -1 | 0;
          if (-1 >= (ja | 0)) {
            break;
          } else {
            l = l + 8 | 0, h = h + 8 | 0;
          }
        }
      }
    }
    function u(h, l) {
      h |= 0;
      l |= 0;
      var d = 0, G = 0, e = 0;
      var z = 8 + (24 - l << 1 << 2) | 0;
      var A = l & 255;
      switch(A & 3) {
        case 1:
          var t = h + 40 | 0;
          e = c[t >> 2] | 0;
          var g = h + 44 | 0;
          l = c[g >> 2] | 0;
          d = h + 80 | 0;
          var f = h + 84 | 0;
          G = c[f >> 2] | 0;
          c[g >> 2] = c[d >> 2];
          c[t >> 2] = G;
          t = h + 160 | 0;
          G = h + 164 | 0;
          g = c[G >> 2] | 0;
          c[d >> 2] = c[t >> 2];
          c[f >> 2] = g;
          f = h + 120 | 0;
          g = h + 124 | 0;
          d = c[g >> 2] | 0;
          c[G >> 2] = c[f >> 2];
          c[t >> 2] = d;
          c[f >> 2] = e;
          c[g >> 2] = l;
          g = h + 8 | 0;
          l = c[g >> 2] | 0;
          f = h + 12 | 0;
          e = c[f >> 2] | 0;
          t = h + 48 | 0;
          d = h + 52 | 0;
          G = c[d >> 2] | 0;
          c[g >> 2] = c[t >> 2];
          c[f >> 2] = G;
          f = h + 128 | 0;
          G = h + 132 | 0;
          g = c[G >> 2] | 0;
          c[d >> 2] = c[f >> 2];
          c[t >> 2] = g;
          t = h + 88 | 0;
          g = h + 92 | 0;
          d = c[g >> 2] | 0;
          c[f >> 2] = c[t >> 2];
          c[G >> 2] = d;
          c[g >> 2] = l;
          c[t >> 2] = e;
          t = h + 16 | 0;
          e = c[t >> 2] | 0;
          g = h + 20 | 0;
          l = c[g >> 2] | 0;
          G = h + 96 | 0;
          d = h + 100 | 0;
          f = c[d >> 2] | 0;
          c[g >> 2] = c[G >> 2];
          c[t >> 2] = f;
          t = h + 56 | 0;
          f = h + 60 | 0;
          g = c[f >> 2] | 0;
          c[G >> 2] = c[t >> 2];
          c[d >> 2] = g;
          d = h + 176 | 0;
          g = h + 180 | 0;
          G = c[g >> 2] | 0;
          c[f >> 2] = c[d >> 2];
          c[t >> 2] = G;
          c[d >> 2] = e;
          c[g >> 2] = l;
          g = h + 136 | 0;
          l = c[g >> 2] | 0;
          d = h + 140 | 0;
          c[g >> 2] = c[d >> 2];
          c[d >> 2] = l;
          d = h + 24 | 0;
          l = c[d >> 2] | 0;
          g = h + 28 | 0;
          e = c[g >> 2] | 0;
          t = h + 144 | 0;
          G = h + 148 | 0;
          f = c[G >> 2] | 0;
          c[g >> 2] = c[t >> 2];
          c[d >> 2] = f;
          d = h + 184 | 0;
          f = h + 188 | 0;
          g = c[f >> 2] | 0;
          c[t >> 2] = c[d >> 2];
          c[G >> 2] = g;
          G = h + 64 | 0;
          g = h + 68 | 0;
          t = c[g >> 2] | 0;
          c[f >> 2] = c[G >> 2];
          c[d >> 2] = t;
          c[G >> 2] = l;
          c[g >> 2] = e;
          g = h + 104 | 0;
          e = c[g >> 2] | 0;
          G = h + 108 | 0;
          c[g >> 2] = c[G >> 2];
          c[G >> 2] = e;
          G = h + 32 | 0;
          e = c[G >> 2] | 0;
          g = h + 36 | 0;
          l = c[g >> 2] | 0;
          d = h + 192 | 0;
          t = h + 196 | 0;
          f = c[t >> 2] | 0;
          c[G >> 2] = c[d >> 2];
          c[g >> 2] = f;
          g = h + 112 | 0;
          f = h + 116 | 0;
          G = c[f >> 2] | 0;
          c[t >> 2] = c[g >> 2];
          c[d >> 2] = G;
          d = h + 152 | 0;
          G = h + 156 | 0;
          t = c[G >> 2] | 0;
          c[g >> 2] = c[d >> 2];
          c[f >> 2] = t;
          c[G >> 2] = e;
          G = 0;
          e = 5;
          break;
        case 2:
          d = h + 40 | 0;
          l = c[d >> 2] | 0;
          g = h + 44 | 0;
          e = c[g >> 2] | 0;
          f = h + 160 | 0;
          G = h + 164 | 0;
          t = c[G >> 2] | 0;
          c[g >> 2] = c[f >> 2];
          c[d >> 2] = t;
          c[G >> 2] = l;
          c[f >> 2] = e;
          f = h + 80 | 0;
          e = c[f >> 2] | 0;
          G = h + 84 | 0;
          l = c[G >> 2] | 0;
          d = h + 120 | 0;
          t = h + 124 | 0;
          g = c[t >> 2] | 0;
          c[G >> 2] = c[d >> 2];
          c[f >> 2] = g;
          c[t >> 2] = e;
          c[d >> 2] = l;
          d = h + 8 | 0;
          l = c[d >> 2] | 0;
          t = h + 12 | 0;
          e = c[t >> 2] | 0;
          f = h + 128 | 0;
          g = h + 132 | 0;
          G = c[g >> 2] | 0;
          c[t >> 2] = c[f >> 2];
          c[d >> 2] = G;
          c[g >> 2] = l;
          c[f >> 2] = e;
          f = h + 48 | 0;
          e = c[f >> 2] | 0;
          g = h + 52 | 0;
          l = c[g >> 2] | 0;
          d = h + 88 | 0;
          G = h + 92 | 0;
          t = c[G >> 2] | 0;
          c[g >> 2] = c[d >> 2];
          c[f >> 2] = t;
          c[G >> 2] = e;
          c[d >> 2] = l;
          d = h + 16 | 0;
          l = c[d >> 2] | 0;
          G = h + 20 | 0;
          e = c[G >> 2] | 0;
          f = h + 56 | 0;
          t = h + 60 | 0;
          g = c[t >> 2] | 0;
          c[G >> 2] = c[f >> 2];
          c[d >> 2] = g;
          c[t >> 2] = l;
          c[f >> 2] = e;
          f = h + 96 | 0;
          e = c[f >> 2] | 0;
          t = h + 100 | 0;
          l = c[t >> 2] | 0;
          d = h + 176 | 0;
          g = h + 180 | 0;
          G = c[g >> 2] | 0;
          c[t >> 2] = c[d >> 2];
          c[f >> 2] = G;
          c[g >> 2] = e;
          c[d >> 2] = l;
          d = h + 24 | 0;
          l = c[d >> 2] | 0;
          g = h + 28 | 0;
          e = c[g >> 2] | 0;
          f = h + 184 | 0;
          G = h + 188 | 0;
          t = c[G >> 2] | 0;
          c[g >> 2] = c[f >> 2];
          c[d >> 2] = t;
          c[G >> 2] = l;
          c[f >> 2] = e;
          f = h + 64 | 0;
          e = c[f >> 2] | 0;
          G = h + 68 | 0;
          l = c[G >> 2] | 0;
          d = h + 144 | 0;
          t = h + 148 | 0;
          g = c[t >> 2] | 0;
          c[G >> 2] = c[d >> 2];
          c[f >> 2] = g;
          c[t >> 2] = e;
          c[d >> 2] = l;
          d = h + 32 | 0;
          l = c[d >> 2] | 0;
          t = h + 36 | 0;
          e = c[t >> 2] | 0;
          f = h + 112 | 0;
          g = h + 116 | 0;
          G = c[g >> 2] | 0;
          c[t >> 2] = c[f >> 2];
          c[d >> 2] = G;
          c[g >> 2] = l;
          c[f >> 2] = e;
          f = h + 152 | 0;
          e = c[f >> 2] | 0;
          g = h + 156 | 0;
          l = c[g >> 2] | 0;
          d = h + 192 | 0;
          G = h + 196 | 0;
          t = c[G >> 2] | 0;
          c[g >> 2] = c[d >> 2];
          c[f >> 2] = t;
          c[G >> 2] = e;
          G = 0;
          e = 5;
          break;
        case 3:
          e = h + 40 | 0, G = c[e >> 2] | 0, f = h + 44 | 0, l = c[f >> 2] | 0, t = h + 120 | 0, g = h + 124 | 0, d = c[g >> 2] | 0, c[e >> 2] = c[t >> 2], c[f >> 2] = d, f = h + 160 | 0, d = h + 164 | 0, e = c[d >> 2] | 0, c[g >> 2] = c[f >> 2], c[t >> 2] = e, t = h + 80 | 0, e = h + 84 | 0, g = c[e >> 2] | 0, c[f >> 2] = c[t >> 2], c[d >> 2] = g, c[e >> 2] = G, c[t >> 2] = l, t = h + 8 | 0, l = c[t >> 2] | 0, e = h + 12 | 0, G = c[e >> 2] | 0, d = h + 88 | 0, g = h + 92 | 0, f = c[g >> 2] | 0, 
          c[e >> 2] = c[d >> 2], c[t >> 2] = f, t = h + 128 | 0, f = h + 132 | 0, e = c[f >> 2] | 0, c[d >> 2] = c[t >> 2], c[g >> 2] = e, g = h + 48 | 0, e = h + 52 | 0, d = c[e >> 2] | 0, c[f >> 2] = c[g >> 2], c[t >> 2] = d, c[g >> 2] = l, c[e >> 2] = G, e = h + 16 | 0, G = c[e >> 2] | 0, g = h + 20 | 0, l = c[g >> 2] | 0, t = h + 176 | 0, d = h + 180 | 0, f = c[d >> 2] | 0, c[e >> 2] = c[t >> 2], c[g >> 2] = f, g = h + 56 | 0, f = h + 60 | 0, e = c[f >> 2] | 0, c[d >> 2] = c[g >> 2], c[t >> 2] = 
          e, t = h + 96 | 0, e = h + 100 | 0, d = c[e >> 2] | 0, c[g >> 2] = c[t >> 2], c[f >> 2] = d, c[e >> 2] = G, c[t >> 2] = l, t = h + 136 | 0, l = c[t >> 2] | 0, e = h + 140 | 0, c[t >> 2] = c[e >> 2], c[e >> 2] = l, e = h + 24 | 0, l = c[e >> 2] | 0, t = h + 28 | 0, G = c[t >> 2] | 0, f = h + 64 | 0, d = h + 68 | 0, g = c[d >> 2] | 0, c[e >> 2] = c[f >> 2], c[t >> 2] = g, t = h + 184 | 0, g = h + 188 | 0, e = c[g >> 2] | 0, c[d >> 2] = c[t >> 2], c[f >> 2] = e, f = h + 144 | 0, e = h + 148 | 
          0, d = c[e >> 2] | 0, c[t >> 2] = c[f >> 2], c[g >> 2] = d, c[e >> 2] = l, c[f >> 2] = G, f = h + 104 | 0, G = c[f >> 2] | 0, e = h + 108 | 0, c[f >> 2] = c[e >> 2], c[e >> 2] = G, e = h + 32 | 0, G = c[e >> 2] | 0, f = h + 36 | 0, l = c[f >> 2] | 0, g = h + 152 | 0, d = h + 156 | 0, t = c[d >> 2] | 0, c[f >> 2] = c[g >> 2], c[e >> 2] = t, e = h + 112 | 0, t = h + 116 | 0, f = c[t >> 2] | 0, c[g >> 2] = c[e >> 2], c[d >> 2] = f, d = h + 192 | 0, f = c[h + 196 >> 2] | 0, c[t >> 2] = c[d >> 
          2], c[e >> 2] = f, c[d >> 2] = G, G = 1, e = 5;
      }
      5 == (e | 0) && (c[d + (G << 2) >> 2] = l);
      var m = h + 32 | 0;
      var u = h + 72 | 0;
      var p = h + 112 | 0;
      var X = h + 152 | 0;
      var B = h + 192 | 0;
      var v = h + 12 | 0;
      var T = h + 52 | 0;
      var ta = h + 92 | 0;
      var q = h + 132 | 0;
      var Va = h + 172 | 0;
      var F = h + 36 | 0;
      var O = h + 76 | 0;
      var Aa = h + 116 | 0;
      var D = h + 156 | 0;
      var N = h + 196 | 0;
      var qa = h + 8 | 0;
      var E = h + 48 | 0;
      var w = h + 88 | 0;
      var R = h + 128 | 0;
      var H = h + 168 | 0;
      var y = h + 16 | 0;
      var J = h + 56 | 0;
      var M = h + 96 | 0;
      var P = h + 136 | 0;
      var S = h + 176 | 0;
      var Ca = h + 20 | 0;
      var Y = h + 60 | 0;
      var ka = h + 100 | 0;
      var pa = h + 140 | 0;
      var Pa = h + 180 | 0;
      var Ga = h + 40 | 0;
      var da = h + 80 | 0;
      var Ka = h + 120 | 0;
      var la = h + 160 | 0;
      var Ha = h + 4 | 0;
      var wa = h + 44 | 0;
      var Na = h + 84 | 0;
      var ya = h + 124 | 0;
      var oa = h + 164 | 0;
      var W = h + 28 | 0;
      var sa = h + 68 | 0;
      var va = h + 108 | 0;
      var na = h + 148 | 0;
      var xa = h + 188 | 0;
      var ua = h + 24 | 0;
      var V = h + 64 | 0;
      g = h + 104 | 0;
      t = h + 144 | 0;
      f = h + 184 | 0;
      l = A;
      d = z;
      a: for (;;) {
        switch(l & 3) {
          case 0:
            var fa = c[B >> 2] | 0;
            G = c[u >> 2] ^ c[m >> 2] ^ c[p >> 2] ^ c[X >> 2] ^ fa;
            e = c[T >> 2] ^ c[v >> 2] ^ c[ta >> 2] ^ c[q >> 2] ^ c[Va >> 2];
            var ba = (e << 1 | e >>> 31) ^ G;
            var U = c[O >> 2] ^ c[F >> 2] ^ c[Aa >> 2] ^ c[D >> 2] ^ c[N >> 2];
            var C = c[E >> 2] | 0;
            var I = C ^ c[qa >> 2] ^ c[w >> 2] ^ c[R >> 2] ^ c[H >> 2];
            var L = I ^ U;
            z = c[J >> 2] ^ c[y >> 2] ^ c[M >> 2] ^ c[P >> 2] ^ c[S >> 2];
            U = z ^ (U << 1 | U >>> 31);
            var ia = c[ka >> 2] | 0;
            l = c[Y >> 2] ^ c[Ca >> 2] ^ ia ^ c[pa >> 2] ^ c[Pa >> 2];
            G ^= l;
            var Q = c[h >> 2] | 0;
            var Z = c[Ga >> 2] ^ Q ^ c[da >> 2] ^ c[Ka >> 2] ^ c[la >> 2];
            l = Z ^ (l << 1 | l >>> 31);
            A = c[Ha >> 2] | 0;
            var ca = c[wa >> 2] ^ A ^ c[Na >> 2] ^ c[ya >> 2] ^ c[oa >> 2];
            z ^= ca;
            var ea = c[na >> 2] | 0;
            var aa = c[sa >> 2] ^ c[W >> 2] ^ c[va >> 2] ^ ea ^ c[xa >> 2];
            I ^= aa << 1 | aa >>> 31;
            var ha = c[t >> 2] | 0;
            var Ba = c[V >> 2] ^ c[ua >> 2] ^ c[g >> 2] ^ ha ^ c[f >> 2];
            e ^= Ba;
            ca = Ba ^ (ca << 1 | ca >>> 31);
            Z ^= aa;
            Q ^= ba;
            C ^= l;
            C = C << 22 | C >>> 10;
            ia ^= e;
            ia = ia << 22 | ia >>> 10;
            ea ^= G;
            ea = ea << 11 | ea >>> 21;
            fa ^= ca;
            fa = fa << 7 | fa >>> 25;
            aa = ia & ~C ^ Q;
            c[h >> 2] = aa;
            c[h >> 2] = aa ^ c[d >> 2];
            c[E >> 2] = ea & ~ia ^ C;
            c[ka >> 2] = fa & ~ea ^ ia;
            c[na >> 2] = Q & ~fa ^ ea;
            c[B >> 2] = fa ^ C & ~Q;
            A ^= L;
            Q = c[T >> 2] ^ z;
            Q = Q << 22 | Q >>> 10;
            C = c[M >> 2] ^ I;
            C = C << 21 | C >>> 11;
            ha ^= U;
            ha = ha << 10 | ha >>> 22;
            fa = c[N >> 2] ^ Z;
            fa = fa << 7 | fa >>> 25;
            ea = C & ~Q ^ A;
            c[Ha >> 2] = ea;
            c[Ha >> 2] = ea ^ c[d + 4 >> 2];
            c[T >> 2] = ha & ~C ^ Q;
            c[M >> 2] = fa & ~ha ^ C;
            c[t >> 2] = A & ~fa ^ ha;
            c[N >> 2] = fa ^ Q & ~A;
            A = c[Na >> 2] ^ L;
            A = A << 2 | A >>> 30;
            Q = c[q >> 2] ^ z;
            Q = Q << 23 | Q >>> 9;
            fa = c[Pa >> 2] ^ e;
            fa = fa << 31 | fa >>> 1;
            ha = c[ua >> 2] ^ U;
            ha = ha << 14 | ha >>> 18;
            C = c[u >> 2] ^ ca;
            C = C << 10 | C >>> 22;
            c[Na >> 2] = A & ~C ^ ha;
            c[q >> 2] = C ^ Q & ~A;
            c[Pa >> 2] = fa & ~Q ^ A;
            c[ua >> 2] = ha & ~fa ^ Q;
            c[u >> 2] = C & ~ha ^ fa;
            fa = c[da >> 2] ^ ba;
            fa = fa << 1 | fa >>> 31;
            ha = c[R >> 2] ^ l;
            ha = ha << 22 | ha >>> 10;
            C = c[S >> 2] ^ I;
            C = C << 30 | C >>> 2;
            Q = c[W >> 2] ^ G;
            Q = Q << 14 | Q >>> 18;
            A = c[O >> 2] ^ Z;
            A = A << 10 | A >>> 22;
            c[da >> 2] = fa & ~A ^ Q;
            c[R >> 2] = A ^ ha & ~fa;
            c[S >> 2] = C & ~ha ^ fa;
            c[W >> 2] = Q & ~C ^ ha;
            c[O >> 2] = A & ~Q ^ C;
            C = c[la >> 2] ^ ba;
            C = C << 9 | C >>> 23;
            Q = c[v >> 2] ^ z;
            Q = Q << 1 | Q >>> 31;
            A = c[J >> 2] ^ I;
            A = A << 3 | A >>> 29;
            ha = c[va >> 2] ^ G;
            ha = ha << 13 | ha >>> 19;
            fa = c[X >> 2] ^ ca;
            fa = fa << 4 | fa >>> 28;
            c[la >> 2] = ha & ~A ^ Q;
            c[v >> 2] = fa & ~ha ^ A;
            c[J >> 2] = C & ~fa ^ ha;
            c[va >> 2] = fa ^ Q & ~C;
            c[X >> 2] = A & ~Q ^ C;
            C = c[oa >> 2] ^ L;
            C = C << 9 | C >>> 23;
            Q = c[qa >> 2] ^ l;
            A = c[Y >> 2] ^ e;
            A = A << 3 | A >>> 29;
            fa = c[g >> 2] ^ U;
            fa = fa << 12 | fa >>> 20;
            ha = c[D >> 2] ^ Z;
            ha = ha << 4 | ha >>> 28;
            c[oa >> 2] = fa & ~A ^ Q;
            c[qa >> 2] = ha & ~fa ^ A;
            c[Y >> 2] = C & ~ha ^ fa;
            c[g >> 2] = ha ^ Q & ~C;
            c[D >> 2] = A & ~Q ^ C;
            C = c[Ga >> 2] ^ ba;
            C = C << 18 | C >>> 14;
            Q = c[w >> 2] ^ l;
            Q = Q << 5 | Q >>> 27;
            A = c[pa >> 2] ^ e;
            A = A << 8 | A >>> 24;
            ha = c[f >> 2] ^ U;
            ha = ha << 28 | ha >>> 4;
            fa = c[F >> 2] ^ Z;
            fa = fa << 14 | fa >>> 18;
            c[Ga >> 2] = fa ^ Q & ~C;
            c[w >> 2] = A & ~Q ^ C;
            c[pa >> 2] = ha & ~A ^ Q;
            c[f >> 2] = fa & ~ha ^ A;
            c[F >> 2] = C & ~fa ^ ha;
            ha = c[wa >> 2] ^ L;
            ha = ha << 18 | ha >>> 14;
            fa = c[ta >> 2] ^ z;
            fa = fa << 5 | fa >>> 27;
            C = c[P >> 2] ^ I;
            C = C << 7 | C >>> 25;
            A = c[xa >> 2] ^ G;
            A = A << 28 | A >>> 4;
            Q = c[m >> 2] ^ ca;
            Q = Q << 13 | Q >>> 19;
            c[wa >> 2] = Q ^ fa & ~ha;
            c[ta >> 2] = C & ~fa ^ ha;
            c[P >> 2] = A & ~C ^ fa;
            C ^= Q & ~A;
            c[xa >> 2] = C;
            A ^= ha & ~Q;
            c[m >> 2] = A;
            L ^= c[ya >> 2];
            L = L << 21 | L >>> 11;
            l ^= c[H >> 2];
            l = l << 1 | l >>> 31;
            I ^= c[y >> 2];
            I = I << 31 | I >>> 1;
            G ^= c[sa >> 2];
            G = G << 28 | G >>> 4;
            Z ^= c[Aa >> 2];
            Z = Z << 20 | Z >>> 12;
            Q = Z & ~G ^ I;
            c[ya >> 2] = Q;
            ha = L & ~Z ^ G;
            c[H >> 2] = ha;
            Z ^= l & ~L;
            c[y >> 2] = Z;
            c[sa >> 2] = I & ~l ^ L;
            l ^= G & ~I;
            c[Aa >> 2] = l;
            ba ^= c[Ka >> 2];
            ba = ba << 20 | ba >>> 12;
            z ^= c[Va >> 2];
            z = z << 1 | z >>> 31;
            e ^= c[Ca >> 2];
            e = e << 31 | e >>> 1;
            U ^= c[V >> 2];
            U = U << 27 | U >>> 5;
            ca ^= c[p >> 2];
            ca = ca << 19 | ca >>> 13;
            I = ca & ~U ^ e;
            c[Ka >> 2] = I;
            G = ba & ~ca ^ U;
            c[Va >> 2] = G;
            ca ^= z & ~ba;
            c[Ca >> 2] = ca;
            ba ^= e & ~z;
            c[V >> 2] = ba;
            z ^= U & ~e;
            c[p >> 2] = z;
            d = d + 8 | 0;
            e = 12;
            break;
          case 3:
            l = c[Aa >> 2] | 0;
            G = c[Va >> 2] | 0;
            A = c[m >> 2] | 0;
            z = c[p >> 2] | 0;
            ha = c[H >> 2] | 0;
            Z = c[y >> 2] | 0;
            ca = c[Ca >> 2] | 0;
            Q = c[ya >> 2] | 0;
            I = c[Ka >> 2] | 0;
            C = c[xa >> 2] | 0;
            ba = c[V >> 2] | 0;
            e = 12;
            break;
          case 2:
            l = c[D >> 2] | 0;
            G = c[Va >> 2] | 0;
            A = c[B >> 2] | 0;
            z = c[X >> 2] | 0;
            ha = c[H >> 2] | 0;
            Z = c[ka >> 2] | 0;
            ca = c[M >> 2] | 0;
            Q = c[wa >> 2] | 0;
            I = c[Ga >> 2] | 0;
            C = c[V >> 2] | 0;
            ba = c[ua >> 2] | 0;
            e = 13;
            break;
          case 1:
            ba = d;
            l = c[m >> 2] | 0;
            d = c[Va >> 2] | 0;
            G = c[Aa >> 2] | 0;
            A = c[F >> 2] | 0;
            z = c[H >> 2] | 0;
            ha = c[Y >> 2] | 0;
            Z = c[J >> 2] | 0;
            ca = c[da >> 2] | 0;
            Q = c[Na >> 2] | 0;
            I = c[ua >> 2] | 0;
            C = c[na >> 2] | 0;
            break;
          default:
            break a;
        }
        if (12 == (e | 0)) {
          ea = c[u >> 2] ^ c[B >> 2] ^ c[X >> 2] ^ c[F >> 2] ^ l;
          Ba = c[R >> 2] ^ c[T >> 2] ^ c[qa >> 2] ^ c[ta >> 2] ^ G;
          G = (Ba << 1 | Ba >>> 31) ^ ea;
          aa = c[O >> 2] ^ c[N >> 2] ^ c[D >> 2] ^ A ^ z;
          fa = c[q >> 2] | 0;
          var ma = fa ^ c[E >> 2] ^ c[v >> 2] ^ c[w >> 2] ^ ha;
          ia = ma ^ aa;
          z = c[Pa >> 2] ^ c[ka >> 2] ^ c[J >> 2] ^ c[pa >> 2] ^ Z;
          aa = z ^ (aa << 1 | aa >>> 31);
          L = c[Y >> 2] | 0;
          A = c[S >> 2] ^ c[M >> 2] ^ L ^ c[P >> 2] ^ ca;
          ha = A ^ ea;
          ea = c[h >> 2] | 0;
          Z = c[Na >> 2] ^ ea ^ c[la >> 2] ^ c[Ga >> 2] ^ Q;
          Q = Z ^ (A << 1 | A >>> 31);
          A = c[Ha >> 2] | 0;
          ca = c[da >> 2] ^ A ^ c[oa >> 2] ^ c[wa >> 2] ^ I;
          z ^= ca;
          U = c[W >> 2] ^ c[t >> 2] ^ c[g >> 2] ^ C ^ ba;
          ba = (U << 1 | U >>> 31) ^ ma;
          I = c[f >> 2] | 0;
          ma = c[ua >> 2] ^ c[na >> 2] ^ c[va >> 2] ^ I ^ c[sa >> 2];
          Ba ^= ma;
          ca = ma ^ (ca << 1 | ca >>> 31);
          Z ^= U;
          ea ^= G;
          fa ^= Q;
          fa = fa << 22 | fa >>> 10;
          L ^= Ba;
          L = L << 22 | L >>> 10;
          C ^= ha;
          C = C << 11 | C >>> 21;
          l ^= ca;
          l = l << 7 | l >>> 25;
          U = L & ~fa ^ ea;
          c[h >> 2] = U;
          c[h >> 2] = U ^ c[d >> 2];
          c[q >> 2] = C & ~L ^ fa;
          c[Y >> 2] = l & ~C ^ L;
          c[xa >> 2] = ea & ~l ^ C;
          c[Aa >> 2] = l ^ fa & ~ea;
          A ^= ia;
          l = c[R >> 2] ^ z;
          l = l << 22 | l >>> 10;
          C = c[J >> 2] ^ ba;
          C = C << 21 | C >>> 11;
          I ^= aa;
          I = I << 10 | I >>> 22;
          ea = c[p >> 2] ^ Z;
          ea = ea << 7 | ea >>> 25;
          fa = C & ~l ^ A;
          c[Ha >> 2] = fa;
          c[Ha >> 2] = fa ^ c[d + 4 >> 2];
          c[R >> 2] = I & ~C ^ l;
          c[J >> 2] = ea & ~I ^ C;
          c[f >> 2] = A & ~ea ^ I;
          c[p >> 2] = ea ^ l & ~A;
          A = c[oa >> 2] ^ ia;
          A = A << 2 | A >>> 30;
          l = c[ta >> 2] ^ z;
          l = l << 23 | l >>> 9;
          ea = c[Ca >> 2] ^ Ba;
          ea = ea << 31 | ea >>> 1;
          I = c[na >> 2] ^ aa;
          I = I << 14 | I >>> 18;
          C = c[u >> 2] ^ ca;
          C = C << 10 | C >>> 22;
          c[oa >> 2] = A & ~C ^ I;
          c[ta >> 2] = C ^ l & ~A;
          c[Ca >> 2] = ea & ~l ^ A;
          c[na >> 2] = I & ~ea ^ l;
          c[u >> 2] = C & ~I ^ ea;
          ea = c[la >> 2] ^ G;
          ea = ea << 1 | ea >>> 31;
          I = c[w >> 2] ^ Q;
          I = I << 22 | I >>> 10;
          C = c[y >> 2] ^ ba;
          C = C << 30 | C >>> 2;
          l = c[t >> 2] ^ ha;
          l = l << 14 | l >>> 18;
          A = c[O >> 2] ^ Z;
          A = A << 10 | A >>> 22;
          c[la >> 2] = ea & ~A ^ l;
          c[w >> 2] = A ^ I & ~ea;
          c[y >> 2] = C & ~I ^ ea;
          c[t >> 2] = l & ~C ^ I;
          c[O >> 2] = A & ~l ^ C;
          C = c[ya >> 2] ^ G;
          C = C << 9 | C >>> 23;
          l = c[T >> 2] ^ z;
          l = l << 1 | l >>> 31;
          A = c[Pa >> 2] ^ ba;
          A = A << 3 | A >>> 29;
          I = c[g >> 2] ^ ha;
          I = I << 13 | I >>> 19;
          ea = c[F >> 2] ^ ca;
          ea = ea << 4 | ea >>> 28;
          c[ya >> 2] = I & ~A ^ l;
          c[T >> 2] = ea & ~I ^ A;
          c[Pa >> 2] = C & ~ea ^ I;
          c[g >> 2] = ea ^ l & ~C;
          c[F >> 2] = A & ~l ^ C;
          C = c[Ka >> 2] ^ ia;
          C = C << 9 | C >>> 23;
          l = c[E >> 2] ^ Q;
          A = c[S >> 2] ^ Ba;
          A = A << 3 | A >>> 29;
          ea = c[va >> 2] ^ aa;
          ea = ea << 12 | ea >>> 20;
          I = c[m >> 2] ^ Z;
          I = I << 4 | I >>> 28;
          c[Ka >> 2] = ea & ~A ^ l;
          c[E >> 2] = I & ~ea ^ A;
          c[S >> 2] = C & ~I ^ ea;
          c[va >> 2] = I ^ l & ~C;
          c[m >> 2] = A & ~l ^ C;
          C = c[Na >> 2] ^ G;
          C = C << 18 | C >>> 14;
          l = c[v >> 2] ^ Q;
          l = l << 5 | l >>> 27;
          A = c[P >> 2] ^ Ba;
          A = A << 8 | A >>> 24;
          I = c[sa >> 2] ^ aa;
          I = I << 28 | I >>> 4;
          ea = c[N >> 2] ^ Z;
          ea = ea << 14 | ea >>> 18;
          c[Na >> 2] = ea ^ l & ~C;
          c[v >> 2] = A & ~l ^ C;
          c[P >> 2] = I & ~A ^ l;
          c[sa >> 2] = ea & ~I ^ A;
          c[N >> 2] = C & ~ea ^ I;
          I = c[da >> 2] ^ ia;
          I = I << 18 | I >>> 14;
          ea = c[qa >> 2] ^ z;
          ea = ea << 5 | ea >>> 27;
          C = c[pa >> 2] ^ ba;
          C = C << 7 | C >>> 25;
          A = c[V >> 2] ^ ha;
          A = A << 28 | A >>> 4;
          l = c[B >> 2] ^ ca;
          l = l << 13 | l >>> 19;
          c[da >> 2] = l ^ ea & ~I;
          c[qa >> 2] = C & ~ea ^ I;
          c[pa >> 2] = A & ~C ^ ea;
          C ^= l & ~A;
          c[V >> 2] = C;
          A ^= I & ~l;
          c[B >> 2] = A;
          ia ^= c[wa >> 2];
          ia = ia << 21 | ia >>> 11;
          l = c[H >> 2] ^ Q;
          l = l << 1 | l >>> 31;
          ba ^= c[ka >> 2];
          ba = ba << 31 | ba >>> 1;
          I = c[W >> 2] ^ ha;
          I = I << 28 | I >>> 4;
          Z ^= c[D >> 2];
          Z = Z << 20 | Z >>> 12;
          Q = Z & ~I ^ ba;
          c[wa >> 2] = Q;
          ha = ia & ~Z ^ I;
          c[H >> 2] = ha;
          Z ^= l & ~ia;
          c[ka >> 2] = Z;
          c[W >> 2] = ba & ~l ^ ia;
          l ^= I & ~ba;
          c[D >> 2] = l;
          ba = c[Ga >> 2] ^ G;
          ba = ba << 20 | ba >>> 12;
          z ^= c[Va >> 2];
          z = z << 1 | z >>> 31;
          Ba ^= c[M >> 2];
          Ba = Ba << 31 | Ba >>> 1;
          aa ^= c[ua >> 2];
          aa = aa << 27 | aa >>> 5;
          ca ^= c[X >> 2];
          ca = ca << 19 | ca >>> 13;
          I = ca & ~aa ^ Ba;
          c[Ga >> 2] = I;
          G = ba & ~ca ^ aa;
          c[Va >> 2] = G;
          ca ^= z & ~ba;
          c[M >> 2] = ca;
          ba ^= Ba & ~z;
          c[ua >> 2] = ba;
          z ^= aa & ~Ba;
          c[X >> 2] = z;
          d = d + 8 | 0;
          e = 13;
        }
        if (13 == (e | 0)) {
          e = 0;
          L = c[u >> 2] ^ c[Aa >> 2] ^ c[F >> 2] ^ c[N >> 2] ^ l;
          var ra = c[w >> 2] ^ c[R >> 2] ^ c[E >> 2] ^ c[qa >> 2] ^ G;
          ma = (ra << 1 | ra >>> 31) ^ L;
          Ba = c[O >> 2] ^ c[p >> 2] ^ c[m >> 2] ^ A ^ z;
          ea = c[ta >> 2] | 0;
          ia = ea ^ c[q >> 2] ^ c[T >> 2] ^ c[v >> 2] ^ ha;
          aa = ia ^ Ba;
          A = c[Ca >> 2] ^ c[Y >> 2] ^ c[Pa >> 2] ^ c[P >> 2] ^ Z;
          Ba = A ^ (Ba << 1 | Ba >>> 31);
          fa = c[S >> 2] | 0;
          z = c[y >> 2] ^ c[J >> 2] ^ fa ^ c[pa >> 2] ^ ca;
          ca = z ^ L;
          L = c[h >> 2] | 0;
          ha = c[oa >> 2] ^ L ^ c[ya >> 2] ^ c[Na >> 2] ^ Q;
          z = ha ^ (z << 1 | z >>> 31);
          G = c[Ha >> 2] | 0;
          Z = c[la >> 2] ^ G ^ c[Ka >> 2] ^ c[da >> 2] ^ I;
          A ^= Z;
          I = c[t >> 2] ^ c[f >> 2] ^ c[va >> 2] ^ C ^ ba;
          Q = (I << 1 | I >>> 31) ^ ia;
          ia = c[sa >> 2] | 0;
          U = c[na >> 2] ^ c[xa >> 2] ^ c[g >> 2] ^ ia ^ c[W >> 2];
          ba = U ^ ra;
          Z = U ^ (Z << 1 | Z >>> 31);
          ha ^= I;
          I = L ^ ma;
          ea ^= z;
          ea = ea << 22 | ea >>> 10;
          fa ^= ba;
          fa = fa << 22 | fa >>> 10;
          C ^= ca;
          C = C << 11 | C >>> 21;
          l ^= Z;
          l = l << 7 | l >>> 25;
          L = fa & ~ea ^ I;
          c[h >> 2] = L;
          c[h >> 2] = L ^ c[d >> 2];
          c[ta >> 2] = C & ~fa ^ ea;
          c[S >> 2] = l & ~C ^ fa;
          c[V >> 2] = I & ~l ^ C;
          c[D >> 2] = l ^ ea & ~I;
          G ^= aa;
          l = c[w >> 2] ^ A;
          l = l << 22 | l >>> 10;
          I = c[Pa >> 2] ^ Q;
          I = I << 21 | I >>> 11;
          C = ia ^ Ba;
          C = C << 10 | C >>> 22;
          ia = c[X >> 2] ^ ha;
          ia = ia << 7 | ia >>> 25;
          ea = I & ~l ^ G;
          c[Ha >> 2] = ea;
          c[Ha >> 2] = ea ^ c[d + 4 >> 2];
          c[w >> 2] = C & ~I ^ l;
          c[Pa >> 2] = ia & ~C ^ I;
          c[sa >> 2] = G & ~ia ^ C;
          c[X >> 2] = ia ^ l & ~G;
          G = c[Ka >> 2] ^ aa;
          G = G << 2 | G >>> 30;
          l = c[qa >> 2] ^ A;
          l = l << 23 | l >>> 9;
          ia = c[M >> 2] ^ ba;
          ia = ia << 31 | ia >>> 1;
          C = c[xa >> 2] ^ Ba;
          C = C << 14 | C >>> 18;
          I = c[u >> 2] ^ Z;
          I = I << 10 | I >>> 22;
          c[Ka >> 2] = G & ~I ^ C;
          c[qa >> 2] = I ^ l & ~G;
          c[M >> 2] = ia & ~l ^ G;
          c[xa >> 2] = C & ~ia ^ l;
          c[u >> 2] = I & ~C ^ ia;
          ia = c[ya >> 2] ^ ma;
          ia = ia << 1 | ia >>> 31;
          C = c[v >> 2] ^ z;
          C = C << 22 | C >>> 10;
          I = c[ka >> 2] ^ Q;
          I = I << 30 | I >>> 2;
          l = c[f >> 2] ^ ca;
          l = l << 14 | l >>> 18;
          G = c[O >> 2] ^ ha;
          G = G << 10 | G >>> 22;
          c[ya >> 2] = ia & ~G ^ l;
          c[v >> 2] = G ^ C & ~ia;
          c[ka >> 2] = I & ~C ^ ia;
          c[f >> 2] = l & ~I ^ C;
          c[O >> 2] = G & ~l ^ I;
          I = c[wa >> 2] ^ ma;
          I = I << 9 | I >>> 23;
          l = c[R >> 2] ^ A;
          l = l << 1 | l >>> 31;
          G = c[Ca >> 2] ^ Q;
          G = G << 3 | G >>> 29;
          C = c[va >> 2] ^ ca;
          C = C << 13 | C >>> 19;
          ia = c[N >> 2] ^ Z;
          ia = ia << 4 | ia >>> 28;
          c[wa >> 2] = C & ~G ^ l;
          c[R >> 2] = ia & ~C ^ G;
          c[Ca >> 2] = I & ~ia ^ C;
          c[va >> 2] = ia ^ l & ~I;
          c[N >> 2] = G & ~l ^ I;
          I = c[Ga >> 2] ^ aa;
          I = I << 9 | I >>> 23;
          l = c[q >> 2] ^ z;
          G = c[y >> 2] ^ ba;
          G = G << 3 | G >>> 29;
          ia = c[g >> 2] ^ Ba;
          ia = ia << 12 | ia >>> 20;
          C = c[B >> 2] ^ ha;
          C = C << 4 | C >>> 28;
          c[Ga >> 2] = ia & ~G ^ l;
          c[q >> 2] = C & ~ia ^ G;
          c[y >> 2] = I & ~C ^ ia;
          c[g >> 2] = C ^ l & ~I;
          c[B >> 2] = G & ~l ^ I;
          I = c[oa >> 2] ^ ma;
          I = I << 18 | I >>> 14;
          l = c[T >> 2] ^ z;
          l = l << 5 | l >>> 27;
          G = c[pa >> 2] ^ ba;
          G = G << 8 | G >>> 24;
          C = c[W >> 2] ^ Ba;
          C = C << 28 | C >>> 4;
          ia = c[p >> 2] ^ ha;
          ia = ia << 14 | ia >>> 18;
          c[oa >> 2] = ia ^ l & ~I;
          c[T >> 2] = G & ~l ^ I;
          c[pa >> 2] = C & ~G ^ l;
          c[W >> 2] = ia & ~C ^ G;
          c[p >> 2] = I & ~ia ^ C;
          C = c[la >> 2] ^ aa;
          C = C << 18 | C >>> 14;
          ia = c[E >> 2] ^ A;
          ia = ia << 5 | ia >>> 27;
          I = c[P >> 2] ^ Q;
          I = I << 7 | I >>> 25;
          G = c[ua >> 2] ^ ca;
          G = G << 28 | G >>> 4;
          l = c[Aa >> 2] ^ Z;
          l = l << 13 | l >>> 19;
          c[la >> 2] = l ^ ia & ~C;
          c[E >> 2] = I & ~ia ^ C;
          c[P >> 2] = G & ~I ^ ia;
          I ^= l & ~G;
          c[ua >> 2] = I;
          G ^= C & ~l;
          c[Aa >> 2] = G;
          aa ^= c[da >> 2];
          aa = aa << 21 | aa >>> 11;
          l = c[H >> 2] ^ z;
          l = l << 1 | l >>> 31;
          C = c[Y >> 2] ^ Q;
          C = C << 31 | C >>> 1;
          Q = c[t >> 2] ^ ca;
          Q = Q << 28 | Q >>> 4;
          ha ^= c[m >> 2];
          ha = ha << 20 | ha >>> 12;
          ca = ha & ~Q ^ C;
          c[da >> 2] = ca;
          z = aa & ~ha ^ Q;
          c[H >> 2] = z;
          ha ^= l & ~aa;
          c[Y >> 2] = ha;
          c[t >> 2] = C & ~l ^ aa;
          l ^= Q & ~C;
          c[m >> 2] = l;
          C = c[Na >> 2] ^ ma;
          C = C << 20 | C >>> 12;
          A ^= c[Va >> 2];
          A = A << 1 | A >>> 31;
          ba ^= c[J >> 2];
          ba = ba << 31 | ba >>> 1;
          Ba ^= c[na >> 2];
          Ba = Ba << 27 | Ba >>> 5;
          Z ^= c[F >> 2];
          Z = Z << 19 | Z >>> 13;
          Q = Z & ~Ba ^ ba;
          c[Na >> 2] = Q;
          ma = C & ~Z ^ Ba;
          c[Va >> 2] = ma;
          Z ^= A & ~C;
          c[J >> 2] = Z;
          C ^= ba & ~A;
          c[na >> 2] = C;
          A ^= Ba & ~ba;
          c[F >> 2] = A;
          ba = d + 8 | 0;
          d = ma;
        }
        L = c[u >> 2] ^ c[D >> 2] ^ c[N >> 2] ^ c[p >> 2] ^ l;
        ma = c[v >> 2] ^ c[w >> 2] ^ c[q >> 2] ^ c[E >> 2] ^ d;
        aa = (ma << 1 | ma >>> 31) ^ L;
        Ba = c[O >> 2] ^ c[X >> 2] ^ c[B >> 2] ^ G ^ A;
        A = c[qa >> 2] | 0;
        fa = A ^ c[ta >> 2] ^ c[R >> 2] ^ c[T >> 2] ^ z;
        U = fa ^ Ba;
        ra = c[M >> 2] ^ c[S >> 2] ^ c[Ca >> 2] ^ c[pa >> 2] ^ ha;
        Ba = ra ^ (Ba << 1 | Ba >>> 31);
        d = c[y >> 2] | 0;
        ea = c[ka >> 2] ^ c[Pa >> 2] ^ d ^ c[P >> 2] ^ Z;
        L ^= ea;
        ha = c[h >> 2] | 0;
        z = c[Ka >> 2] ^ ha ^ c[wa >> 2] ^ c[oa >> 2] ^ ca;
        ea = z ^ (ea << 1 | ea >>> 31);
        Z = c[Ha >> 2] | 0;
        ia = c[ya >> 2] ^ Z ^ c[Ga >> 2] ^ c[la >> 2] ^ Q;
        ra ^= ia;
        C ^= c[f >> 2] ^ c[sa >> 2] ^ c[g >> 2] ^ I;
        fa ^= C << 1 | C >>> 31;
        ca = c[W >> 2] | 0;
        Q = c[xa >> 2] ^ c[V >> 2] ^ c[va >> 2] ^ ca ^ c[t >> 2];
        ma ^= Q;
        ia = Q ^ (ia << 1 | ia >>> 31);
        C ^= z;
        ha ^= aa;
        Q = ea ^ A;
        Q = Q << 22 | Q >>> 10;
        d ^= ma;
        d = d << 22 | d >>> 10;
        z = I ^ L;
        z = z << 11 | z >>> 21;
        I = ia ^ l;
        I = I << 7 | I >>> 25;
        A = d & ~Q ^ ha;
        c[h >> 2] = A;
        c[h >> 2] = A ^ c[ba >> 2];
        c[qa >> 2] = z & ~d ^ Q;
        c[y >> 2] = I & ~z ^ d;
        c[ua >> 2] = ha & ~I ^ z;
        c[m >> 2] = I ^ Q & ~ha;
        I = Z ^ U;
        Z = c[v >> 2] ^ ra;
        Z = Z << 22 | Z >>> 10;
        ha = c[Ca >> 2] ^ fa;
        ha = ha << 21 | ha >>> 11;
        ca ^= Ba;
        ca = ca << 10 | ca >>> 22;
        Q = c[F >> 2] ^ C;
        Q = Q << 7 | Q >>> 25;
        z = ha & ~Z ^ I;
        c[Ha >> 2] = z;
        d = ba + 8 | 0;
        c[Ha >> 2] = z ^ c[ba + 4 >> 2];
        c[v >> 2] = ca & ~ha ^ Z;
        c[Ca >> 2] = Q & ~ca ^ ha;
        c[W >> 2] = I & ~Q ^ ca;
        c[F >> 2] = Q ^ Z & ~I;
        ba = c[Ga >> 2] ^ U;
        ba = ba << 2 | ba >>> 30;
        I = c[E >> 2] ^ ra;
        I = I << 23 | I >>> 9;
        Z = c[J >> 2] ^ ma;
        Z = Z << 31 | Z >>> 1;
        Q = c[V >> 2] ^ Ba;
        Q = Q << 14 | Q >>> 18;
        ca = c[u >> 2] ^ ia;
        ca = ca << 10 | ca >>> 22;
        c[Ga >> 2] = ba & ~ca ^ Q;
        c[E >> 2] = ca ^ I & ~ba;
        c[J >> 2] = Z & ~I ^ ba;
        c[V >> 2] = Q & ~Z ^ I;
        c[u >> 2] = ca & ~Q ^ Z;
        Z = c[wa >> 2] ^ aa;
        Z = Z << 1 | Z >>> 31;
        Q = c[T >> 2] ^ ea;
        Q = Q << 22 | Q >>> 10;
        ca = c[Y >> 2] ^ fa;
        ca = ca << 30 | ca >>> 2;
        I = c[sa >> 2] ^ L;
        I = I << 14 | I >>> 18;
        ba = c[O >> 2] ^ C;
        ba = ba << 10 | ba >>> 22;
        c[wa >> 2] = Z & ~ba ^ I;
        c[T >> 2] = ba ^ Q & ~Z;
        c[Y >> 2] = ca & ~Q ^ Z;
        c[sa >> 2] = I & ~ca ^ Q;
        c[O >> 2] = ba & ~I ^ ca;
        ca = c[da >> 2] ^ aa;
        ca = ca << 9 | ca >>> 23;
        I = c[w >> 2] ^ ra;
        I = I << 1 | I >>> 31;
        ba = c[M >> 2] ^ fa;
        ba = ba << 3 | ba >>> 29;
        Q = c[g >> 2] ^ L;
        Q = Q << 13 | Q >>> 19;
        Z = c[p >> 2] ^ ia;
        Z = Z << 4 | Z >>> 28;
        c[da >> 2] = Q & ~ba ^ I;
        c[w >> 2] = Z & ~Q ^ ba;
        c[M >> 2] = ca & ~Z ^ Q;
        c[g >> 2] = Z ^ I & ~ca;
        c[p >> 2] = ba & ~I ^ ca;
        ca = c[Na >> 2] ^ U;
        ca = ca << 9 | ca >>> 23;
        I = c[ta >> 2] ^ ea;
        ba = c[ka >> 2] ^ ma;
        ba = ba << 3 | ba >>> 29;
        Z = c[va >> 2] ^ Ba;
        Z = Z << 12 | Z >>> 20;
        Q = c[Aa >> 2] ^ C;
        Q = Q << 4 | Q >>> 28;
        c[Na >> 2] = Z & ~ba ^ I;
        c[ta >> 2] = Q & ~Z ^ ba;
        c[ka >> 2] = ca & ~Q ^ Z;
        c[va >> 2] = Q ^ I & ~ca;
        c[Aa >> 2] = ba & ~I ^ ca;
        ca = c[Ka >> 2] ^ aa;
        ca = ca << 18 | ca >>> 14;
        I = c[R >> 2] ^ ea;
        I = I << 5 | I >>> 27;
        ba = c[P >> 2] ^ ma;
        ba = ba << 8 | ba >>> 24;
        Q = c[t >> 2] ^ Ba;
        Q = Q << 28 | Q >>> 4;
        Z = c[X >> 2] ^ C;
        Z = Z << 14 | Z >>> 18;
        c[Ka >> 2] = Z ^ I & ~ca;
        c[R >> 2] = ba & ~I ^ ca;
        c[P >> 2] = Q & ~ba ^ I;
        c[t >> 2] = Z & ~Q ^ ba;
        c[X >> 2] = ca & ~Z ^ Q;
        Q = c[ya >> 2] ^ U;
        Q = Q << 18 | Q >>> 14;
        Z = c[q >> 2] ^ ra;
        Z = Z << 5 | Z >>> 27;
        ca = c[pa >> 2] ^ fa;
        ca = ca << 7 | ca >>> 25;
        ba = c[na >> 2] ^ L;
        ba = ba << 28 | ba >>> 4;
        I = c[D >> 2] ^ ia;
        I = I << 13 | I >>> 19;
        c[ya >> 2] = I ^ Z & ~Q;
        c[q >> 2] = ca & ~Z ^ Q;
        c[pa >> 2] = ba & ~ca ^ Z;
        c[na >> 2] = I & ~ba ^ ca;
        c[D >> 2] = Q & ~I ^ ba;
        U ^= c[la >> 2];
        U = U << 21 | U >>> 11;
        ea ^= c[H >> 2];
        ea = ea << 1 | ea >>> 31;
        fa ^= c[S >> 2];
        fa = fa << 31 | fa >>> 1;
        L ^= c[f >> 2];
        L = L << 28 | L >>> 4;
        ba = c[B >> 2] ^ C;
        ba = ba << 20 | ba >>> 12;
        c[la >> 2] = ba & ~L ^ fa;
        c[H >> 2] = U & ~ba ^ L;
        c[S >> 2] = ba ^ ea & ~U;
        c[f >> 2] = fa & ~ea ^ U;
        c[B >> 2] = L & ~fa ^ ea;
        aa ^= c[oa >> 2];
        aa = aa << 20 | aa >>> 12;
        ra ^= c[Va >> 2];
        ra = ra << 1 | ra >>> 31;
        ma ^= c[Pa >> 2];
        ma = ma << 31 | ma >>> 1;
        Ba ^= c[xa >> 2];
        Ba = Ba << 27 | Ba >>> 5;
        ia ^= c[N >> 2];
        ia = ia << 19 | ia >>> 13;
        c[oa >> 2] = ia & ~Ba ^ ma;
        c[Va >> 2] = aa & ~ia ^ Ba;
        c[Pa >> 2] = ia ^ ra & ~aa;
        c[xa >> 2] = ma & ~ra ^ aa;
        c[N >> 2] = Ba & ~ma ^ ra;
        if (255 == (c[d >> 2] | 0)) {
          break;
        } else {
          l = 0;
        }
      }
    }
    function p(h, l, d) {
      h |= 0;
      l |= 0;
      d |= 0;
      var e;
      var g = T;
      T = T + 16 | 0;
      var z = c[h + 200 >> 2] | 0;
      var ja = z >>> 3;
      if (c[h + 208 >> 2] | 0) {
        return ja = 1, T = g, ja | 0;
      }
      if (!d) {
        return ja = 0, T = g, ja | 0;
      }
      var t = h + 204 | 0;
      var m = z >>> 6;
      var p = ja & 536870904;
      var v = ja & 7;
      var w = g + 4 | 0;
      var R = m << 1;
      var X = h + (R << 2) | 0;
      R = h + ((R | 1) << 2) | 0;
      z = l;
      for (e = 0;;) {
        var B = c[t >> 2] | 0;
        l = d - e | 0;
        if ((e + ja | 0) >>> 0 > d >>> 0 | 0 != (B | 0)) {
          var H = (B + l | 0) >>> 0 > ja >>> 0 ? ja - B | 0 : l;
          l = H + e | 0;
          e = h;
          var J = z;
          var ta = B, q = H;
          e |= 0;
          J |= 0;
          ta |= 0;
          q |= 0;
          var Va = T;
          T = T + 16 | 0;
          var F = Va;
          if (!ta) {
            ta = q >>> 3;
            f(e, J, ta);
            var O = F;
            c[O >> 2] = 0;
            c[O + 4 >> 2] = 0;
            V(F | 0, J + (q & -8) | 0, q & 7 | 0) | 0;
            q = c[F >> 2] | 0;
            J = c[F + 4 >> 2] | 0;
            O = (q >>> 1 ^ q) & 572662306;
            q ^= O;
            O = q ^ O << 1;
            q = (O ^ q >>> 2) & 202116108;
            O ^= q;
            q = O ^ q << 2;
            O = (q ^ O >>> 4) & 15728880;
            q ^= O;
            O = q ^ O << 4;
            q = (O ^ q >>> 8) & 65280;
            var Aa = (J >>> 1 ^ J) & 572662306;
            J ^= Aa;
            Aa = J ^ Aa << 1;
            J = (Aa ^ J >>> 2) & 202116108;
            Aa ^= J;
            J = Aa ^ J << 2;
            Aa = (J ^ Aa >>> 4) & 15728880;
            J ^= Aa;
            Aa = J ^ Aa << 4;
            J = (Aa ^ J >>> 8) & 65280;
            F = ta << 1;
            ta = e + (F << 2) | 0;
            c[ta >> 2] ^= (J ^ Aa) << 16 | q ^ O & 65535;
            F = e + ((F | 1) << 2) | 0;
            c[F >> 2] ^= (q << 8 ^ O) >>> 16 | J << 8 ^ Aa & -65536;
          } else {
            if (q) {
              var D = ta & 7;
              O = ta >>> 3;
              Aa = F + 4 | 0;
              ta = 8 - D | 0;
              ta = ta >>> 0 > q >>> 0 ? q : ta;
              var N = F;
              c[N >> 2] = 0;
              c[N + 4 >> 2] = 0;
              V(F + D | 0, J | 0, ta | 0) | 0;
              D = c[F >> 2] | 0;
              N = c[Aa >> 2] | 0;
              var qa = (D >>> 1 ^ D) & 572662306;
              D ^= qa;
              qa = D ^ qa << 1;
              D = (qa ^ D >>> 2) & 202116108;
              qa ^= D;
              D = qa ^ D << 2;
              qa = (D ^ qa >>> 4) & 15728880;
              D ^= qa;
              qa = D ^ qa << 4;
              D = (qa ^ D >>> 8) & 65280;
              var E = (N >>> 1 ^ N) & 572662306;
              N ^= E;
              E = N ^ E << 1;
              N = (E ^ N >>> 2) & 202116108;
              E ^= N;
              N = E ^ N << 2;
              E = (N ^ E >>> 4) & 15728880;
              N ^= E;
              E = N ^ E << 4;
              N = (E ^ N >>> 8) & 65280;
              var y = O << 1;
              B = e + (y << 2) | 0;
              c[B >> 2] ^= (N ^ E) << 16 | D ^ qa & 65535;
              y = e + ((y | 1) << 2) | 0;
              c[y >> 2] ^= (D << 8 ^ qa) >>> 16 | N << 8 ^ E & -65536;
              if (q = q - ta | 0) {
                for (J = J + ta | 0;;) {
                  if (O = O + 1 | 0, ta = 8 > q >>> 0 ? q : 8, E = F, c[E >> 2] = 0, c[E + 4 >> 2] = 0, V(F | 0, J | 0, ta | 0) | 0, E = c[F >> 2] | 0, qa = c[Aa >> 2] | 0, N = (E >>> 1 ^ E) & 572662306, E ^= N, N = E ^ N << 1, E = (N ^ E >>> 2) & 202116108, N ^= E, E = N ^ E << 2, N = (E ^ N >>> 4) & 15728880, E ^= N, N = E ^ N << 4, E = (N ^ E >>> 8) & 65280, D = (qa >>> 1 ^ qa) & 572662306, qa ^= D, D = qa ^ D << 1, qa = (D ^ qa >>> 2) & 202116108, D ^= qa, qa = D ^ qa << 2, D = (qa ^ D >>> 4) & 
                  15728880, qa ^= D, D = qa ^ D << 4, qa = (D ^ qa >>> 8) & 65280, B = O << 1, y = e + (B << 2) | 0, c[y >> 2] ^= (qa ^ D) << 16 | E ^ N & 65535, B = e + ((B | 1) << 2) | 0, c[B >> 2] ^= (E << 8 ^ N) >>> 16 | qa << 8 ^ D & -65536, q = q - ta | 0) {
                    J = J + ta | 0;
                  } else {
                    break;
                  }
                }
              }
            }
          }
          T = Va;
          z = z + H | 0;
          B = (c[t >> 2] | 0) + H | 0;
          c[t >> 2] = B;
          (B | 0) == (ja | 0) && (u(h, 12), c[t >> 2] = 0);
        } else {
          if (l >>> 0 >= ja >>> 0) {
            do {
              f(h, z, m), J = g, c[J >> 2] = 0, c[J + 4 >> 2] = 0, V(g | 0, z + p | 0, v | 0) | 0, J = c[g >> 2] | 0, B = c[w >> 2] | 0, e = (J >>> 1 ^ J) & 572662306, J ^= e, e = J ^ e << 1, J = (e ^ J >>> 2) & 202116108, e ^= J, J = e ^ J << 2, e = (J ^ e >>> 4) & 15728880, J ^= e, e = J ^ e << 4, J = (e ^ J >>> 8) & 65280, H = (B >>> 1 ^ B) & 572662306, B ^= H, H = B ^ H << 1, B = (H ^ B >>> 2) & 202116108, H ^= B, B = H ^ B << 2, H = (B ^ H >>> 4) & 15728880, B ^= H, H = B ^ H << 4, B = (H ^ 
              B >>> 8) & 65280, c[X >> 2] ^= (B ^ H) << 16 | J ^ e & 65535, c[R >> 2] ^= (J << 8 ^ e) >>> 16 | B << 8 ^ H & -65536, u(h, 12), z = z + ja | 0, l = l - ja | 0;
            } while (l >>> 0 >= ja >>> 0);
          }
          l = d - l | 0;
        }
        if (l >>> 0 < d >>> 0) {
          e = l;
        } else {
          z = 0;
          break;
        }
      }
      T = g;
      return z | 0;
    }
    function v(h, l) {
      h |= 0;
      l |= 0;
      var d = (c[h + 200 >> 2] | 0) >>> 3;
      if (!(l << 24 >> 24)) {
        var e = 1;
        return e | 0;
      }
      var g = h + 208 | 0;
      if (c[g >> 2] | 0) {
        return e = 1, e | 0;
      }
      e = h + 204 | 0;
      var z = c[e >> 2] | 0;
      var A = z & 7;
      var f = 4 > A >>> 0;
      var m = l & 255;
      A <<= 3;
      var p = f ? 0 : m << A + -32;
      A = f ? m << A : 0;
      m = (A >>> 1 ^ A) & 572662306;
      A ^= m;
      m = A ^ m << 1;
      A = (m ^ A >>> 2) & 202116108;
      m ^= A;
      A = m ^ A << 2;
      m = (A ^ m >>> 4) & 15728880;
      A ^= m;
      m = A ^ m << 4;
      A = (m ^ A >>> 8) & 65280;
      f = (p >>> 1 ^ p) & 572662306;
      p ^= f;
      f = p ^ f << 1;
      p = (f ^ p >>> 2) & 202116108;
      f ^= p;
      p = f ^ p << 2;
      f = (p ^ f >>> 4) & 15728880;
      p ^= f;
      f = p ^ f << 4;
      p = (f ^ p >>> 8) & 65280;
      z = z >>> 3 << 1;
      var J = h + (z << 2) | 0;
      c[J >> 2] ^= (p ^ f) << 16 | A ^ m & 65535;
      z = h + ((z | 1) << 2) | 0;
      c[z >> 2] ^= (A << 8 ^ m) >>> 16 | p << 8 ^ f & -65536;
      0 > l << 24 >> 24 ? (l = d + -1 | 0, (c[e >> 2] | 0) == (l | 0) && u(h, 12)) : l = d + -1 | 0;
      f = l & 7;
      p = 4 > f >>> 0;
      f <<= 3;
      m = p ? 0 : 128 << f + -32;
      f = p ? 128 << f : 0;
      p = (f >>> 1 ^ f) & 572662306;
      f ^= p;
      p = f ^ p << 1;
      f = (p ^ f >>> 2) & 202116108;
      p ^= f;
      f = p ^ f << 2;
      p = (f ^ p >>> 4) & 15728880;
      f ^= p;
      p = f ^ p << 4;
      f = (p ^ f >>> 8) & 65280;
      A = (m >>> 1 ^ m) & 572662306;
      m ^= A;
      A = m ^ A << 1;
      m = (A ^ m >>> 2) & 202116108;
      A ^= m;
      m = A ^ m << 2;
      A = (m ^ A >>> 4) & 15728880;
      m ^= A;
      A = m ^ A << 4;
      m = (A ^ m >>> 8) & 65280;
      J = l >>> 3 << 1;
      z = h + (J << 2) | 0;
      c[z >> 2] ^= (m ^ A) << 16 | f ^ p & 65535;
      J = h + ((J | 1) << 2) | 0;
      c[J >> 2] ^= (f << 8 ^ p) >>> 16 | m << 8 ^ A & -65536;
      u(h, 12);
      c[e >> 2] = 0;
      c[g >> 2] = 1;
      J = 0;
      return J | 0;
    }
    function w(h, l, d) {
      h |= 0;
      l |= 0;
      d |= 0;
      var e = T;
      T = T + 16 | 0;
      var g = c[h + 200 >> 2] | 0;
      var z = g >>> 3;
      c[h + 208 >> 2] | 0 || v(h, 1) | 0;
      if (!d) {
        return T = e, 0;
      }
      var f = h + 204 | 0;
      var ja = g >>> 6;
      var p = z & 536870904;
      var J = z & 7;
      var H = ja << 1;
      var R = h + (H << 2) | 0;
      H = h + ((H | 1) << 2) | 0;
      var w = e + 4 | 0;
      g = 0;
      var X = l;
      do {
        if (l = c[f >> 2] | 0, (g + z | 0) >>> 0 > d >>> 0 | (l | 0) != (z | 0)) {
          (l | 0) == (z | 0) && (u(h, 12), l = c[f >> 2] = 0);
          var B = d - g | 0;
          B = (l + B | 0) >>> 0 > z >>> 0 ? z - l | 0 : B;
          var y = h;
          var M = X;
          var ta = l, q = B;
          y |= 0;
          M |= 0;
          ta |= 0;
          q |= 0;
          var Va = T;
          T = T + 16 | 0;
          var F = Va;
          if (!ta) {
            var O = q >>> 3;
            m(y, M, O);
            O <<= 1;
            var Aa = c[y + (O << 2) >> 2] | 0;
            O = c[y + ((O | 1) << 2) >> 2] | 0;
            y = Aa >>> 16;
            ta = (O << 8 ^ Aa) & 65280;
            Aa = ta ^ (O << 16 | Aa & 65535);
            ta = Aa ^ ta << 8;
            Aa = (ta ^ Aa >>> 4) & 15728880;
            ta ^= Aa;
            Aa = ta ^ Aa << 4;
            ta = (Aa ^ ta >>> 2) & 202116108;
            Aa ^= ta;
            ta = Aa ^ ta << 2;
            Aa = (ta ^ Aa >>> 1) & 572662306;
            var D = (O >>> 8 ^ y) & 65280;
            y = D ^ (O & -65536 | y);
            D = y ^ D << 8;
            y = (D ^ y >>> 4) & 15728880;
            D ^= y;
            y = D ^ y << 4;
            D = (y ^ D >>> 2) & 202116108;
            y ^= D;
            D = y ^ D << 2;
            y = (D ^ y >>> 1) & 572662306;
            c[F >> 2] = Aa ^ ta ^ Aa << 1;
            c[F + 4 >> 2] = y ^ D ^ y << 1;
            V(M + (q & -8) | 0, F | 0, q & 7 | 0) | 0;
          } else {
            if (q) {
              O = ta & 7;
              Aa = ta >>> 3;
              D = F + 4 | 0;
              ta = 8 - O | 0;
              ta = ta >>> 0 > q >>> 0 ? q : ta;
              l = Aa << 1;
              var N = c[y + (l << 2) >> 2] | 0;
              l = c[y + ((l | 1) << 2) >> 2] | 0;
              var qa = N >>> 16;
              var E = (l << 8 ^ N) & 65280;
              N = E ^ (l << 16 | N & 65535);
              E = N ^ E << 8;
              N = (E ^ N >>> 4) & 15728880;
              E ^= N;
              N = E ^ N << 4;
              E = (N ^ E >>> 2) & 202116108;
              N ^= E;
              E = N ^ E << 2;
              N = (E ^ N >>> 1) & 572662306;
              var S = (l >>> 8 ^ qa) & 65280;
              qa = S ^ (l & -65536 | qa);
              S = qa ^ S << 8;
              qa = (S ^ qa >>> 4) & 15728880;
              S ^= qa;
              qa = S ^ qa << 4;
              S = (qa ^ S >>> 2) & 202116108;
              qa ^= S;
              S = qa ^ S << 2;
              qa = (S ^ qa >>> 1) & 572662306;
              c[F >> 2] = N ^ E ^ N << 1;
              c[D >> 2] = qa ^ S ^ qa << 1;
              V(M | 0, F + O | 0, ta | 0) | 0;
              if (q = q - ta | 0) {
                for (M = M + ta | 0;;) {
                  if (Aa = Aa + 1 | 0, ta = 8 > q >>> 0 ? q : 8, qa = Aa << 1, N = c[y + (qa << 2) >> 2] | 0, qa = c[y + ((qa | 1) << 2) >> 2] | 0, l = N >>> 16, S = (qa << 8 ^ N) & 65280, N = S ^ (qa << 16 | N & 65535), S = N ^ S << 8, N = (S ^ N >>> 4) & 15728880, S ^= N, N = S ^ N << 4, S = (N ^ S >>> 2) & 202116108, N ^= S, S = N ^ S << 2, N = (S ^ N >>> 1) & 572662306, E = (qa >>> 8 ^ l) & 65280, l = E ^ (qa & -65536 | l), E = l ^ E << 8, l = (E ^ l >>> 4) & 15728880, E ^= l, l = E ^ l << 4, 
                  E = (l ^ E >>> 2) & 202116108, l ^= E, E = l ^ E << 2, l = (E ^ l >>> 1) & 572662306, c[F >> 2] = N ^ S ^ N << 1, c[D >> 2] = l ^ E ^ l << 1, V(M | 0, F | 0, ta | 0) | 0, q = q - ta | 0) {
                    M = M + ta | 0;
                  } else {
                    break;
                  }
                }
              }
            }
          }
          T = Va;
          c[f >> 2] = B + (c[f >> 2] | 0);
          X = X + B | 0;
          g = B + g | 0;
        } else {
          g = d - g | 0;
          if (g >>> 0 < z >>> 0) {
            l = g, g = X;
          } else {
            l = g;
            g = X;
            do {
              u(h, 12), m(h, g, ja), y = c[R >> 2] | 0, E = c[H >> 2] | 0, B = y >>> 16, M = (E << 8 ^ y) & 65280, y = M ^ (E << 16 | y & 65535), M = y ^ M << 8, y = (M ^ y >>> 4) & 15728880, M ^= y, y = M ^ y << 4, M = (y ^ M >>> 2) & 202116108, y ^= M, M = y ^ M << 2, y = (M ^ y >>> 1) & 572662306, X = (E >>> 8 ^ B) & 65280, B = X ^ (E & -65536 | B), X = B ^ X << 8, B = (X ^ B >>> 4) & 15728880, X ^= B, B = X ^ B << 4, X = (B ^ X >>> 2) & 202116108, B ^= X, X = B ^ X << 2, B = (X ^ B >>> 1) & 572662306, 
              c[e >> 2] = y ^ M ^ y << 1, c[w >> 2] = B ^ X ^ B << 1, V(g + p | 0, e | 0, J | 0) | 0, g = g + z | 0, l = l - z | 0;
            } while (l >>> 0 >= z >>> 0);
          }
          X = g;
          g = d - l | 0;
        }
      } while (g >>> 0 < d >>> 0);
      T = e;
      return 0;
    }
    function R(h, l, d) {
      h |= 0;
      l |= 0;
      d |= 0;
      var e = 0;
      var g = T;
      T = T + 32 | 0;
      if (1 != (c[h + 440 >> 2] | 0)) {
        var z = 1;
        T = g;
        return z | 0;
      }
      z = h + 432 | 0;
      var f = h + 436 | 0;
      var ja = c[f >> 2] | 0;
      do {
        if (c[z >> 2] | 0) {
          if (ja) {
            var m = 8192 - ja | 0;
            m = m >>> 0 > d >>> 0 ? d : m;
            if (p(h, l, m) | 0) {
              return z = 1, T = g, z | 0;
            }
            ja = l + m | 0;
            d = d - m | 0;
            var u = (c[f >> 2] | 0) + m | 0;
            c[f >> 2] = u;
            if (8192 == (u | 0)) {
              c[f >> 2] = 0;
              c[z >> 2] = (c[z >> 2] | 0) + 1;
              if (0 == (v(h, 11) | 0) && (w(h, g, 32) | 0, 0 == (p(h + 216 | 0, g, 32) | 0))) {
                e = 15;
                break;
              }
              z = 1;
              T = g;
              return z | 0;
            }
          } else {
            ja = l;
          }
        } else {
          m = 8192 - ja | 0;
          m = m >>> 0 > d >>> 0 ? d : m;
          var J = h + 216 | 0;
          if (p(J, l, m) | 0) {
            return z = 1, T = g, z | 0;
          }
          ja = l + m | 0;
          d = d - m | 0;
          u = (c[f >> 2] | 0) + m | 0;
          c[f >> 2] = u;
          if (0 != (d | 0) & 8192 == (u | 0)) {
            y[g >> 0] = 3;
            c[f >> 2] = 0;
            c[z >> 2] = 1;
            if (!(p(J, g, 1) | 0)) {
              u = h + 420 | 0;
              c[u >> 2] = (c[u >> 2] | 0) + 7 & -8;
              break;
            }
            z = 1;
            T = g;
            return z | 0;
          }
        }
        e = 15;
      } while (0);
      if (15 == (e | 0) && !d) {
        return z = 0, T = g, z | 0;
      }
      l = h + 200 | 0;
      J = h + 204 | 0;
      e = h + 208 | 0;
      for (u = h + 216 | 0;;) {
        m = 8192 > d >>> 0 ? d : 8192;
        aa(h | 0, 0, 200) | 0;
        c[l >> 2] = 1344;
        c[J >> 2] = 0;
        c[e >> 2] = 0;
        if (p(h, ja, m) | 0) {
          d = 1;
          e = 25;
          break;
        }
        ja = ja + m | 0;
        if (8191 < d >>> 0) {
          c[z >> 2] = (c[z >> 2] | 0) + 1;
          if (v(h, 11) | 0) {
            e = 21;
            break;
          }
          w(h, g, 32) | 0;
          if (p(u, g, 32) | 0) {
            e = 21;
            break;
          }
        } else {
          c[f >> 2] = m;
        }
        d = d - m | 0;
        if (!d) {
          d = 0;
          e = 25;
          break;
        }
      }
      return 21 == (e | 0) ? (z = 1, T = g, z | 0) : 25 == (e | 0) ? (T = g, d | 0) : 0;
    }
    function H(h) {
      h |= 0;
      var l = 0, d = 0, e = 0, g = 0, z = 0, f, t = 0, m = 0, p = 0, u = 0, J = 0, y = 0, X = 0, B = 0;
      var v = T;
      T = T + 16 | 0;
      var S = v;
      do {
        if (245 > h >>> 0) {
          var H = 11 > h >>> 0 ? 16 : h + 11 & -8;
          h = H >>> 3;
          t = c[753] | 0;
          var q = t >>> h;
          if (q & 3 | 0) {
            l = (q & 1 ^ 1) + h | 0;
            h = 3052 + (l << 1 << 2) | 0;
            q = h + 8 | 0;
            d = c[q >> 2] | 0;
            var M = d + 8 | 0;
            e = c[M >> 2] | 0;
            (e | 0) == (h | 0) ? c[753] = t & ~(1 << l) : (c[e + 12 >> 2] = h, c[q >> 2] = e);
            B = l << 3;
            c[d + 4 >> 2] = B | 3;
            B = d + B + 4 | 0;
            c[B >> 2] |= 1;
            B = M;
            T = v;
            return B | 0;
          }
          var F = c[755] | 0;
          if (H >>> 0 > F >>> 0) {
            if (q | 0) {
              return l = 2 << h, l = q << h & (l | 0 - l), l = (l & 0 - l) + -1 | 0, z = l >>> 12 & 16, l >>>= z, q = l >>> 5 & 8, l >>>= q, e = l >>> 2 & 4, l >>>= e, h = l >>> 1 & 2, l >>>= h, d = l >>> 1 & 1, d = (q | z | e | h | d) + (l >>> d) | 0, l = 3052 + (d << 1 << 2) | 0, h = l + 8 | 0, e = c[h >> 2] | 0, z = e + 8 | 0, q = c[z >> 2] | 0, (q | 0) == (l | 0) ? (h = t & ~(1 << d), c[753] = h) : (c[q + 12 >> 2] = l, c[h >> 2] = q, h = t), B = d << 3, g = B - H | 0, c[e + 4 >> 2] = H | 3, M = 
              e + H | 0, c[M + 4 >> 2] = g | 1, c[e + B >> 2] = g, F | 0 && (d = c[758] | 0, l = F >>> 3, q = 3052 + (l << 1 << 2) | 0, l = 1 << l, h & l ? (h = q + 8 | 0, l = c[h >> 2] | 0) : (c[753] = h | l, l = q, h = q + 8 | 0), c[h >> 2] = d, c[l + 12 >> 2] = d, c[d + 8 >> 2] = l, c[d + 12 >> 2] = q), c[755] = g, c[758] = M, B = z, T = v, B | 0;
            }
            if (f = c[754] | 0) {
              q = (f & 0 - f) + -1 | 0;
              z = q >>> 12 & 16;
              q >>>= z;
              g = q >>> 5 & 8;
              q >>>= g;
              var O = q >>> 2 & 4;
              q >>>= O;
              d = q >>> 1 & 2;
              q >>>= d;
              h = q >>> 1 & 1;
              h = c[3316 + ((g | z | O | d | h) + (q >>> h) << 2) >> 2] | 0;
              q = (c[h + 4 >> 2] & -8) - H | 0;
              if (d = c[h + 16 + ((0 == (c[h + 16 >> 2] | 0) & 1) << 2) >> 2] | 0) {
                do {
                  z = (c[d + 4 >> 2] & -8) - H | 0, q = (O = z >>> 0 < q >>> 0) ? z : q, h = O ? d : h, d = c[d + 16 + ((0 == (c[d + 16 >> 2] | 0) & 1) << 2) >> 2] | 0;
                } while (0 != (d | 0));
              }
              O = h;
              g = q;
              z = O + H | 0;
              if (z >>> 0 > O >>> 0) {
                M = c[O + 24 >> 2] | 0;
                l = c[O + 12 >> 2] | 0;
                do {
                  if ((l | 0) == (O | 0)) {
                    h = O + 20 | 0;
                    l = c[h >> 2] | 0;
                    if (!l && (h = O + 16 | 0, l = c[h >> 2] | 0, !l)) {
                      q = 0;
                      break;
                    }
                    for (;;) {
                      if (q = l + 20 | 0, d = c[q >> 2] | 0, d | 0) {
                        l = d, h = q;
                      } else {
                        if (q = l + 16 | 0, d = c[q >> 2] | 0) {
                          l = d, h = q;
                        } else {
                          break;
                        }
                      }
                    }
                    c[h >> 2] = 0;
                  } else {
                    q = c[O + 8 >> 2] | 0, c[q + 12 >> 2] = l, c[l + 8 >> 2] = q;
                  }
                  q = l;
                } while (0);
                do {
                  if (M | 0) {
                    l = c[O + 28 >> 2] | 0;
                    h = 3316 + (l << 2) | 0;
                    if ((O | 0) == (c[h >> 2] | 0)) {
                      if (c[h >> 2] = q, !q) {
                        c[754] = f & ~(1 << l);
                        break;
                      }
                    } else {
                      if (c[M + 16 + (((c[M + 16 >> 2] | 0) != (O | 0) & 1) << 2) >> 2] = q, !q) {
                        break;
                      }
                    }
                    c[q + 24 >> 2] = M;
                    l = c[O + 16 >> 2] | 0;
                    l | 0 && (c[q + 16 >> 2] = l, c[l + 24 >> 2] = q);
                    l = c[O + 20 >> 2] | 0;
                    l | 0 && (c[q + 20 >> 2] = l, c[l + 24 >> 2] = q);
                  }
                } while (0);
                16 > g >>> 0 ? (B = g + H | 0, c[O + 4 >> 2] = B | 3, B = O + B + 4 | 0, c[B >> 2] |= 1) : (c[O + 4 >> 2] = H | 3, c[z + 4 >> 2] = g | 1, c[z + g >> 2] = g, F | 0 && (d = c[758] | 0, l = F >>> 3, q = 3052 + (l << 1 << 2) | 0, l = 1 << l, t & l ? (h = q + 8 | 0, l = c[h >> 2] | 0) : (c[753] = t | l, l = q, h = q + 8 | 0), c[h >> 2] = d, c[l + 12 >> 2] = d, c[d + 8 >> 2] = l, c[d + 12 >> 2] = q), c[755] = g, c[758] = z);
                B = O + 8 | 0;
                T = v;
                return B | 0;
              }
            }
          }
          F = H;
        } else {
          if (4294967231 >= h >>> 0) {
            h = h + 11 | 0;
            H = h & -8;
            if (O = c[754] | 0) {
              d = 0 - H | 0;
              (h >>>= 8) ? 16777215 < H >>> 0 ? f = 31 : (t = (h + 1048320 | 0) >>> 16 & 8, X = h << t, F = (X + 520192 | 0) >>> 16 & 4, X <<= F, f = (X + 245760 | 0) >>> 16 & 2, f = 14 - (F | t | f) + (X << f >>> 15) | 0, f = H >>> (f + 7 | 0) & 1 | f << 1) : f = 0;
              q = c[3316 + (f << 2) >> 2] | 0;
              a: do {
                if (q) {
                  for (h = 0, z = q, g = H << (31 == (f | 0) ? 0 : 25 - (f >>> 1) | 0), q = 0;;) {
                    M = (c[z + 4 >> 2] & -8) - H | 0;
                    if (M >>> 0 < d >>> 0) {
                      if (M) {
                        h = z, d = M;
                      } else {
                        d = 0;
                        h = q = z;
                        X = 61;
                        break a;
                      }
                    }
                    M = c[z + 20 >> 2] | 0;
                    z = c[z + 16 + (g >>> 31 << 2) >> 2] | 0;
                    q = 0 == (M | 0) | (M | 0) == (z | 0) ? q : M;
                    if (M = 0 == (z | 0)) {
                      X = 57;
                      break;
                    } else {
                      g <<= (M ^ 1) & 1;
                    }
                  }
                } else {
                  h = q = 0, X = 57;
                }
              } while (0);
              if (57 == (X | 0)) {
                if (0 == (q | 0) & 0 == (h | 0)) {
                  h = 2 << f;
                  h = O & (h | 0 - h);
                  if (!h) {
                    F = H;
                    break;
                  }
                  t = (h & 0 - h) + -1 | 0;
                  z = t >>> 12 & 16;
                  t >>>= z;
                  g = t >>> 5 & 8;
                  t >>>= g;
                  f = t >>> 2 & 4;
                  t >>>= f;
                  F = t >>> 1 & 2;
                  t >>>= F;
                  q = t >>> 1 & 1;
                  h = 0;
                  q = c[3316 + ((g | z | f | F | q) + (t >>> q) << 2) >> 2] | 0;
                }
                q ? X = 61 : (z = h, g = d);
              }
              if (61 == (X | 0)) {
                for (;;) {
                  if (X = 0, F = (c[q + 4 >> 2] & -8) - H | 0, d = (t = F >>> 0 < d >>> 0) ? F : d, h = t ? q : h, q = c[q + 16 + ((0 == (c[q + 16 >> 2] | 0) & 1) << 2) >> 2] | 0, !q) {
                    z = h;
                    g = d;
                    break;
                  }
                }
              }
              if (0 != (z | 0) && g >>> 0 < ((c[755] | 0) - H | 0) >>> 0) {
                e = z + H | 0;
                if (e >>> 0 <= z >>> 0) {
                  return B = 0, T = v, B | 0;
                }
                M = c[z + 24 >> 2] | 0;
                l = c[z + 12 >> 2] | 0;
                do {
                  if ((l | 0) == (z | 0)) {
                    h = z + 20 | 0;
                    l = c[h >> 2] | 0;
                    if (!l && (h = z + 16 | 0, l = c[h >> 2] | 0, !l)) {
                      l = 0;
                      break;
                    }
                    for (;;) {
                      if (q = l + 20 | 0, d = c[q >> 2] | 0, d | 0) {
                        l = d, h = q;
                      } else {
                        if (q = l + 16 | 0, d = c[q >> 2] | 0) {
                          l = d, h = q;
                        } else {
                          break;
                        }
                      }
                    }
                    c[h >> 2] = 0;
                  } else {
                    B = c[z + 8 >> 2] | 0, c[B + 12 >> 2] = l, c[l + 8 >> 2] = B;
                  }
                } while (0);
                do {
                  if (M) {
                    h = c[z + 28 >> 2] | 0;
                    q = 3316 + (h << 2) | 0;
                    if ((z | 0) == (c[q >> 2] | 0)) {
                      if (c[q >> 2] = l, !l) {
                        d = O & ~(1 << h);
                        c[754] = d;
                        break;
                      }
                    } else {
                      if (c[M + 16 + (((c[M + 16 >> 2] | 0) != (z | 0) & 1) << 2) >> 2] = l, !l) {
                        d = O;
                        break;
                      }
                    }
                    c[l + 24 >> 2] = M;
                    h = c[z + 16 >> 2] | 0;
                    h | 0 && (c[l + 16 >> 2] = h, c[h + 24 >> 2] = l);
                    if (h = c[z + 20 >> 2] | 0) {
                      c[l + 20 >> 2] = h, c[h + 24 >> 2] = l;
                    }
                  }
                  d = O;
                } while (0);
                do {
                  if (16 <= g >>> 0) {
                    if (c[z + 4 >> 2] = H | 3, c[e + 4 >> 2] = g | 1, c[e + g >> 2] = g, l = g >>> 3, 256 > g >>> 0) {
                      q = 3052 + (l << 1 << 2) | 0, h = c[753] | 0, l = 1 << l, h & l ? (h = q + 8 | 0, l = c[h >> 2] | 0) : (c[753] = h | l, l = q, h = q + 8 | 0), c[h >> 2] = e, c[l + 12 >> 2] = e, c[e + 8 >> 2] = l, c[e + 12 >> 2] = q;
                    } else {
                      if ((l = g >>> 8) ? 16777215 < g >>> 0 ? l = 31 : (X = (l + 1048320 | 0) >>> 16 & 8, B = l << X, y = (B + 520192 | 0) >>> 16 & 4, B <<= y, l = (B + 245760 | 0) >>> 16 & 2, l = 14 - (y | X | l) + (B << l >>> 15) | 0, l = g >>> (l + 7 | 0) & 1 | l << 1) : l = 0, q = 3316 + (l << 2) | 0, c[e + 28 >> 2] = l, h = e + 16 | 0, c[h + 4 >> 2] = 0, c[h >> 2] = 0, h = 1 << l, d & h) {
                        h = g << (31 == (l | 0) ? 0 : 25 - (l >>> 1) | 0);
                        for (q = c[q >> 2] | 0;;) {
                          if ((c[q + 4 >> 2] & -8 | 0) == (g | 0)) {
                            X = 97;
                            break;
                          }
                          d = q + 16 + (h >>> 31 << 2) | 0;
                          if (l = c[d >> 2] | 0) {
                            h <<= 1, q = l;
                          } else {
                            X = 96;
                            break;
                          }
                        }
                        96 == (X | 0) ? (c[d >> 2] = e, c[e + 24 >> 2] = q, c[e + 12 >> 2] = e, c[e + 8 >> 2] = e) : 97 == (X | 0) && (X = q + 8 | 0, B = c[X >> 2] | 0, c[B + 12 >> 2] = e, c[X >> 2] = e, c[e + 8 >> 2] = B, c[e + 12 >> 2] = q, c[e + 24 >> 2] = 0);
                      } else {
                        c[754] = d | h, c[q >> 2] = e, c[e + 24 >> 2] = q, c[e + 12 >> 2] = e, c[e + 8 >> 2] = e;
                      }
                    }
                  } else {
                    B = g + H | 0, c[z + 4 >> 2] = B | 3, B = z + B + 4 | 0, c[B >> 2] |= 1;
                  }
                } while (0);
                B = z + 8 | 0;
                T = v;
                return B | 0;
              }
            }
            F = H;
          } else {
            F = -1;
          }
        }
      } while (0);
      q = c[755] | 0;
      if (q >>> 0 >= F >>> 0) {
        return l = q - F | 0, h = c[758] | 0, 15 < l >>> 0 ? (B = h + F | 0, c[758] = B, c[755] = l, c[B + 4 >> 2] = l | 1, c[h + q >> 2] = l, c[h + 4 >> 2] = F | 3) : (c[755] = 0, c[758] = 0, c[h + 4 >> 2] = q | 3, B = h + q + 4 | 0, c[B >> 2] |= 1), B = h + 8 | 0, T = v, B | 0;
      }
      z = c[756] | 0;
      if (z >>> 0 > F >>> 0) {
        return y = z - F | 0, c[756] = y, B = c[759] | 0, X = B + F | 0, c[759] = X, c[X + 4 >> 2] = y | 1, c[B + 4 >> 2] = F | 3, B = B + 8 | 0, T = v, B | 0;
      }
      c[871] | 0 ? h = c[873] | 0 : (c[873] = 4096, c[872] = 4096, c[874] = -1, c[875] = -1, c[876] = 0, c[864] = 0, c[871] = S & -16 ^ 1431655768, h = 4096);
      f = F + 48 | 0;
      O = F + 47 | 0;
      g = h + O | 0;
      M = 0 - h | 0;
      H = g & M;
      if (H >>> 0 <= F >>> 0) {
        return B = 0, T = v, B | 0;
      }
      h = c[863] | 0;
      if (h | 0 && (t = c[861] | 0, S = t + H | 0, S >>> 0 <= t >>> 0 | S >>> 0 > h >>> 0)) {
        return B = 0, T = v, B | 0;
      }
      a: do {
        if (c[864] & 4) {
          l = 0;
        } else {
          q = c[759] | 0;
          b: do {
            if (q) {
              for (d = 3460;;) {
                h = c[d >> 2] | 0;
                if (h >>> 0 <= q >>> 0 && (u = d + 4 | 0, (h + (c[u >> 2] | 0) | 0) >>> 0 > q >>> 0)) {
                  break;
                }
                if (h = c[d + 8 >> 2] | 0) {
                  d = h;
                } else {
                  X = 118;
                  break b;
                }
              }
              l = g - z & M;
              if (2147483647 > l >>> 0) {
                if (h = ma(l | 0) | 0, (h | 0) == ((c[d >> 2] | 0) + (c[u >> 2] | 0) | 0)) {
                  if (-1 != (h | 0)) {
                    g = l;
                    e = h;
                    X = 135;
                    break a;
                  }
                } else {
                  d = h, X = 126;
                }
              } else {
                l = 0;
              }
            } else {
              X = 118;
            }
          } while (0);
          do {
            if (118 == (X | 0)) {
              if (q = ma(0) | 0, -1 != (q | 0) && (l = q, m = c[872] | 0, p = m + -1 | 0, l = (0 == (p & l | 0) ? 0 : (p + l & 0 - m) - l | 0) + H | 0, m = c[861] | 0, p = l + m | 0, l >>> 0 > F >>> 0 & 2147483647 > l >>> 0)) {
                if (u = c[863] | 0, u | 0 && p >>> 0 <= m >>> 0 | p >>> 0 > u >>> 0) {
                  l = 0;
                } else {
                  if (h = ma(l | 0) | 0, (h | 0) == (q | 0)) {
                    g = l;
                    e = q;
                    X = 135;
                    break a;
                  } else {
                    d = h, X = 126;
                  }
                }
              } else {
                l = 0;
              }
            }
          } while (0);
          do {
            if (126 == (X | 0)) {
              q = 0 - l | 0;
              if (!(f >>> 0 > l >>> 0 & 2147483647 > l >>> 0 & -1 != (d | 0))) {
                if (-1 == (d | 0)) {
                  l = 0;
                  break;
                } else {
                  g = l;
                  e = d;
                  X = 135;
                  break a;
                }
              }
              h = c[873] | 0;
              h = O - l + h & 0 - h;
              if (2147483647 <= h >>> 0) {
                g = l;
                e = d;
                X = 135;
                break a;
              }
              if (-1 == (ma(h | 0) | 0)) {
                ma(q | 0) | 0, l = 0;
              } else {
                g = h + l | 0;
                e = d;
                X = 135;
                break a;
              }
            }
          } while (0);
          c[864] |= 4;
        }
        X = 133;
      } while (0);
      133 == (X | 0) && 2147483647 > H >>> 0 && (e = ma(H | 0) | 0, u = ma(0) | 0, J = u - e | 0, y = J >>> 0 > (F + 40 | 0) >>> 0, !(-1 == (e | 0) | y ^ 1 | e >>> 0 < u >>> 0 & -1 != (e | 0) & -1 != (u | 0) ^ 1)) && (g = y ? J : l, X = 135);
      if (135 == (X | 0)) {
        l = (c[861] | 0) + g | 0;
        c[861] = l;
        l >>> 0 > (c[862] | 0) >>> 0 && (c[862] = l);
        f = c[759] | 0;
        do {
          if (f) {
            for (l = 3460;;) {
              h = c[l >> 2] | 0;
              q = l + 4 | 0;
              d = c[q >> 2] | 0;
              if ((e | 0) == (h + d | 0)) {
                X = 143;
                break;
              }
              if (M = c[l + 8 >> 2] | 0) {
                l = M;
              } else {
                break;
              }
            }
            if (143 == (X | 0) && 0 == (c[l + 12 >> 2] & 8 | 0) && e >>> 0 > f >>> 0 & h >>> 0 <= f >>> 0) {
              c[q >> 2] = d + g, B = (c[756] | 0) + g | 0, y = f + 8 | 0, y = 0 == (y & 7 | 0) ? 0 : 0 - y & 7, X = f + y | 0, y = B - y | 0, c[759] = X, c[756] = y, c[X + 4 >> 2] = y | 1, c[f + B + 4 >> 2] = 40, c[760] = c[875];
            } else {
              e >>> 0 < (c[757] | 0) >>> 0 && (c[757] = e);
              h = e + g | 0;
              for (l = 3460;;) {
                if ((c[l >> 2] | 0) == (h | 0)) {
                  X = 151;
                  break;
                }
                l = c[l + 8 >> 2] | 0;
                if (!l) {
                  h = 3460;
                  break;
                }
              }
              if (151 == (X | 0)) {
                if (c[l + 12 >> 2] & 8) {
                  h = 3460;
                } else {
                  c[l >> 2] = e;
                  H = l + 4 | 0;
                  c[H >> 2] = (c[H >> 2] | 0) + g;
                  H = e + 8 | 0;
                  H = e + (0 == (H & 7 | 0) ? 0 : 0 - H & 7) | 0;
                  l = h + 8 | 0;
                  l = h + (0 == (l & 7 | 0) ? 0 : 0 - l & 7) | 0;
                  O = H + F | 0;
                  z = l - H - F | 0;
                  c[H + 4 >> 2] = F | 3;
                  do {
                    if ((f | 0) != (l | 0)) {
                      if ((c[758] | 0) == (l | 0)) {
                        B = (c[755] | 0) + z | 0, c[755] = B, c[758] = O, c[O + 4 >> 2] = B | 1, c[O + B >> 2] = B;
                      } else {
                        h = c[l + 4 >> 2] | 0;
                        if (1 == (h & 3 | 0)) {
                          g = h & -8;
                          d = h >>> 3;
                          a: do {
                            if (256 > h >>> 0) {
                              h = c[l + 8 >> 2] | 0, q = c[l + 12 >> 2] | 0, (q | 0) == (h | 0) ? c[753] &= ~(1 << d) : (c[h + 12 >> 2] = q, c[q + 8 >> 2] = h);
                            } else {
                              e = c[l + 24 >> 2] | 0;
                              h = c[l + 12 >> 2] | 0;
                              do {
                                if ((h | 0) == (l | 0)) {
                                  d = l + 16 | 0;
                                  q = d + 4 | 0;
                                  h = c[q >> 2] | 0;
                                  if (!h) {
                                    if (h = c[d >> 2] | 0) {
                                      q = d;
                                    } else {
                                      h = 0;
                                      break;
                                    }
                                  }
                                  for (;;) {
                                    if (d = h + 20 | 0, M = c[d >> 2] | 0, M | 0) {
                                      h = M, q = d;
                                    } else {
                                      if (d = h + 16 | 0, M = c[d >> 2] | 0) {
                                        h = M, q = d;
                                      } else {
                                        break;
                                      }
                                    }
                                  }
                                  c[q >> 2] = 0;
                                } else {
                                  B = c[l + 8 >> 2] | 0, c[B + 12 >> 2] = h, c[h + 8 >> 2] = B;
                                }
                              } while (0);
                              if (e) {
                                q = c[l + 28 >> 2] | 0;
                                d = 3316 + (q << 2) | 0;
                                do {
                                  if ((c[d >> 2] | 0) != (l | 0)) {
                                    if (c[e + 16 + (((c[e + 16 >> 2] | 0) != (l | 0) & 1) << 2) >> 2] = h, !h) {
                                      break a;
                                    }
                                  } else {
                                    if (c[d >> 2] = h, !(h | 0)) {
                                      c[754] &= ~(1 << q);
                                      break a;
                                    }
                                  }
                                } while (0);
                                c[h + 24 >> 2] = e;
                                q = l + 16 | 0;
                                d = c[q >> 2] | 0;
                                d | 0 && (c[h + 16 >> 2] = d, c[d + 24 >> 2] = h);
                                if (q = c[q + 4 >> 2] | 0) {
                                  c[h + 20 >> 2] = q, c[q + 24 >> 2] = h;
                                }
                              }
                            }
                          } while (0);
                          l = l + g | 0;
                          M = g + z | 0;
                        } else {
                          M = z;
                        }
                        l = l + 4 | 0;
                        c[l >> 2] &= -2;
                        c[O + 4 >> 2] = M | 1;
                        c[O + M >> 2] = M;
                        l = M >>> 3;
                        if (256 > M >>> 0) {
                          q = 3052 + (l << 1 << 2) | 0, h = c[753] | 0, l = 1 << l, h & l ? (h = q + 8 | 0, l = c[h >> 2] | 0) : (c[753] = h | l, l = q, h = q + 8 | 0), c[h >> 2] = O, c[l + 12 >> 2] = O, c[O + 8 >> 2] = l, c[O + 12 >> 2] = q;
                        } else {
                          if ((l = M >>> 8) ? 16777215 < M >>> 0 ? l = 31 : (X = (l + 1048320 | 0) >>> 16 & 8, B = l << X, y = (B + 520192 | 0) >>> 16 & 4, B <<= y, l = (B + 245760 | 0) >>> 16 & 2, l = 14 - (y | X | l) + (B << l >>> 15) | 0, l = M >>> (l + 7 | 0) & 1 | l << 1) : l = 0, d = 3316 + (l << 2) | 0, c[O + 28 >> 2] = l, h = O + 16 | 0, c[h + 4 >> 2] = 0, c[h >> 2] = 0, h = c[754] | 0, q = 1 << l, h & q) {
                            h = M << (31 == (l | 0) ? 0 : 25 - (l >>> 1) | 0);
                            for (q = c[d >> 2] | 0;;) {
                              if ((c[q + 4 >> 2] & -8 | 0) == (M | 0)) {
                                X = 192;
                                break;
                              }
                              d = q + 16 + (h >>> 31 << 2) | 0;
                              if (l = c[d >> 2] | 0) {
                                h <<= 1, q = l;
                              } else {
                                X = 191;
                                break;
                              }
                            }
                            191 == (X | 0) ? (c[d >> 2] = O, c[O + 24 >> 2] = q, c[O + 12 >> 2] = O, c[O + 8 >> 2] = O) : 192 == (X | 0) && (X = q + 8 | 0, B = c[X >> 2] | 0, c[B + 12 >> 2] = O, c[X >> 2] = O, c[O + 8 >> 2] = B, c[O + 12 >> 2] = q, c[O + 24 >> 2] = 0);
                          } else {
                            c[754] = h | q, c[d >> 2] = O, c[O + 24 >> 2] = d, c[O + 12 >> 2] = O, c[O + 8 >> 2] = O;
                          }
                        }
                      }
                    } else {
                      B = (c[756] | 0) + z | 0, c[756] = B, c[759] = O, c[O + 4 >> 2] = B | 1;
                    }
                  } while (0);
                  B = H + 8 | 0;
                  T = v;
                  return B | 0;
                }
              }
              for (;;) {
                l = c[h >> 2] | 0;
                if (l >>> 0 <= f >>> 0 && (B = l + (c[h + 4 >> 2] | 0) | 0, B >>> 0 > f >>> 0)) {
                  break;
                }
                h = c[h + 8 >> 2] | 0;
              }
              M = B + -47 | 0;
              h = M + 8 | 0;
              h = M + (0 == (h & 7 | 0) ? 0 : 0 - h & 7) | 0;
              M = f + 16 | 0;
              h = h >>> 0 < M >>> 0 ? f : h;
              l = h + 8 | 0;
              q = g + -40 | 0;
              y = e + 8 | 0;
              y = 0 == (y & 7 | 0) ? 0 : 0 - y & 7;
              X = e + y | 0;
              y = q - y | 0;
              c[759] = X;
              c[756] = y;
              c[X + 4 >> 2] = y | 1;
              c[e + q + 4 >> 2] = 40;
              c[760] = c[875];
              q = h + 4 | 0;
              c[q >> 2] = 27;
              c[l >> 2] = c[865];
              c[l + 4 >> 2] = c[866];
              c[l + 8 >> 2] = c[867];
              c[l + 12 >> 2] = c[868];
              c[865] = e;
              c[866] = g;
              c[868] = 0;
              c[867] = l;
              l = h + 24 | 0;
              do {
                X = l, l = l + 4 | 0, c[l >> 2] = 7;
              } while ((X + 8 | 0) >>> 0 < B >>> 0);
              if ((h | 0) != (f | 0)) {
                if (e = h - f | 0, c[q >> 2] &= -2, c[f + 4 >> 2] = e | 1, c[h >> 2] = e, l = e >>> 3, 256 > e >>> 0) {
                  q = 3052 + (l << 1 << 2) | 0, h = c[753] | 0, l = 1 << l, h & l ? (h = q + 8 | 0, l = c[h >> 2] | 0) : (c[753] = h | l, l = q, h = q + 8 | 0), c[h >> 2] = f, c[l + 12 >> 2] = f, c[f + 8 >> 2] = l, c[f + 12 >> 2] = q;
                } else {
                  if ((l = e >>> 8) ? 16777215 < e >>> 0 ? q = 31 : (X = (l + 1048320 | 0) >>> 16 & 8, B = l << X, y = (B + 520192 | 0) >>> 16 & 4, B <<= y, q = (B + 245760 | 0) >>> 16 & 2, q = 14 - (y | X | q) + (B << q >>> 15) | 0, q = e >>> (q + 7 | 0) & 1 | q << 1) : q = 0, d = 3316 + (q << 2) | 0, c[f + 28 >> 2] = q, c[f + 20 >> 2] = 0, c[M >> 2] = 0, l = c[754] | 0, h = 1 << q, l & h) {
                    h = e << (31 == (q | 0) ? 0 : 25 - (q >>> 1) | 0);
                    for (q = c[d >> 2] | 0;;) {
                      if ((c[q + 4 >> 2] & -8 | 0) == (e | 0)) {
                        X = 213;
                        break;
                      }
                      d = q + 16 + (h >>> 31 << 2) | 0;
                      if (l = c[d >> 2] | 0) {
                        h <<= 1, q = l;
                      } else {
                        X = 212;
                        break;
                      }
                    }
                    212 == (X | 0) ? (c[d >> 2] = f, c[f + 24 >> 2] = q, c[f + 12 >> 2] = f, c[f + 8 >> 2] = f) : 213 == (X | 0) && (X = q + 8 | 0, B = c[X >> 2] | 0, c[B + 12 >> 2] = f, c[X >> 2] = f, c[f + 8 >> 2] = B, c[f + 12 >> 2] = q, c[f + 24 >> 2] = 0);
                  } else {
                    c[754] = l | h, c[d >> 2] = f, c[f + 24 >> 2] = d, c[f + 12 >> 2] = f, c[f + 8 >> 2] = f;
                  }
                }
              }
            }
          } else {
            B = c[757] | 0, 0 == (B | 0) | e >>> 0 < B >>> 0 && (c[757] = e), c[865] = e, c[866] = g, c[868] = 0, c[762] = c[871], c[761] = -1, c[766] = 3052, c[765] = 3052, c[768] = 3060, c[767] = 3060, c[770] = 3068, c[769] = 3068, c[772] = 3076, c[771] = 3076, c[774] = 3084, c[773] = 3084, c[776] = 3092, c[775] = 3092, c[778] = 3100, c[777] = 3100, c[780] = 3108, c[779] = 3108, c[782] = 3116, c[781] = 3116, c[784] = 3124, c[783] = 3124, c[786] = 3132, c[785] = 3132, c[788] = 3140, c[787] = 3140, 
            c[790] = 3148, c[789] = 3148, c[792] = 3156, c[791] = 3156, c[794] = 3164, c[793] = 3164, c[796] = 3172, c[795] = 3172, c[798] = 3180, c[797] = 3180, c[800] = 3188, c[799] = 3188, c[802] = 3196, c[801] = 3196, c[804] = 3204, c[803] = 3204, c[806] = 3212, c[805] = 3212, c[808] = 3220, c[807] = 3220, c[810] = 3228, c[809] = 3228, c[812] = 3236, c[811] = 3236, c[814] = 3244, c[813] = 3244, c[816] = 3252, c[815] = 3252, c[818] = 3260, c[817] = 3260, c[820] = 3268, c[819] = 3268, c[822] = 
            3276, c[821] = 3276, c[824] = 3284, c[823] = 3284, c[826] = 3292, c[825] = 3292, c[828] = 3300, c[827] = 3300, B = g + -40 | 0, y = e + 8 | 0, y = 0 == (y & 7 | 0) ? 0 : 0 - y & 7, X = e + y | 0, y = B - y | 0, c[759] = X, c[756] = y, c[X + 4 >> 2] = y | 1, c[e + B + 4 >> 2] = 40, c[760] = c[875];
          }
        } while (0);
        l = c[756] | 0;
        if (l >>> 0 > F >>> 0) {
          return y = l - F | 0, c[756] = y, B = c[759] | 0, X = B + F | 0, c[759] = X, c[X + 4 >> 2] = y | 1, c[B + 4 >> 2] = F | 3, B = B + 8 | 0, T = v, B | 0;
        }
      }
      c[893] = 12;
      B = 0;
      T = v;
      return B | 0;
    }
    function J(h, l, d) {
      h |= 0;
      l |= 0;
      d |= 0;
      var e = 0, g;
      var f = T;
      T = T + 48 | 0;
      var A = f + 16 | 0;
      var t = f;
      var ja = f + 32 | 0;
      var m = h + 28 | 0;
      var p = c[m >> 2] | 0;
      c[ja >> 2] = p;
      var u = h + 20 | 0;
      p = (c[u >> 2] | 0) - p | 0;
      c[ja + 4 >> 2] = p;
      c[ja + 8 >> 2] = l;
      c[ja + 12 >> 2] = d;
      p = p + d | 0;
      var y = h + 60 | 0;
      c[t >> 2] = c[y >> 2];
      c[t + 4 >> 2] = ja;
      c[t + 8 >> 2] = 2;
      t = M(db(146, t | 0) | 0) | 0;
      a: do {
        if ((p | 0) != (t | 0)) {
          for (l = 2; !(0 > (t | 0));) {
            p = p - t | 0;
            var J = c[ja + 4 >> 2] | 0;
            ja = (g = t >>> 0 > J >>> 0) ? ja + 8 | 0 : ja;
            l = l + (g << 31 >> 31) | 0;
            J = t - (g ? J : 0) | 0;
            c[ja >> 2] = (c[ja >> 2] | 0) + J;
            g = ja + 4 | 0;
            c[g >> 2] = (c[g >> 2] | 0) - J;
            c[A >> 2] = c[y >> 2];
            c[A + 4 >> 2] = ja;
            c[A + 8 >> 2] = l;
            t = M(db(146, A | 0) | 0) | 0;
            if ((p | 0) == (t | 0)) {
              e = 3;
              break a;
            }
          }
          c[h + 16 >> 2] = 0;
          c[m >> 2] = 0;
          c[u >> 2] = 0;
          c[h >> 2] |= 32;
          d = 2 == (l | 0) ? 0 : d - (c[ja + 4 >> 2] | 0) | 0;
        } else {
          e = 3;
        }
      } while (0);
      3 == (e | 0) && (J = c[h + 44 >> 2] | 0, c[h + 16 >> 2] = J + (c[h + 48 >> 2] | 0), c[m >> 2] = J, c[u >> 2] = J);
      T = f;
      return d | 0;
    }
    function M(h) {
      h |= 0;
      4294963200 < h >>> 0 && (c[893] = 0 - h, h = -1);
      return h | 0;
    }
    function S(c) {
      c |= 0;
      return 10 > (c + -48 | 0) >>> 0 | 0;
    }
    function Ca(h, l, d, e, g) {
      h |= 0;
      l |= 0;
      d |= 0;
      e |= 0;
      g |= 0;
      var f, A, t = 0, ja = 0, G = 0;
      var m = T;
      T = T + 64 | 0;
      var p = m + 16 | 0;
      var u = m + 24 | 0;
      var Ta = m + 8 | 0;
      var B = m + 20 | 0;
      c[p >> 2] = l;
      var J = 0 != (h | 0);
      var M = u + 40 | 0;
      u = u + 39 | 0;
      var H = Ta + 4 | 0;
      var q = l = f = 0;
      a: for (;;) {
        -1 < (l | 0) && ((f | 0) > (2147483647 - l | 0) ? (c[893] = 75, l = -1) : l = f + l | 0);
        var v = c[p >> 2] | 0;
        f = y[v >> 0] | 0;
        if (f << 24 >> 24) {
          var F = v;
        } else {
          t = 88;
          break;
        }
        b: for (;;) {
          switch(f << 24 >> 24) {
            case 37:
              f = F;
              t = 9;
              break b;
            case 0:
              f = F;
              break b;
          }
          var O = F + 1 | 0;
          c[p >> 2] = O;
          f = y[O >> 0] | 0;
          F = O;
        }
        b: do {
          if (9 == (t | 0)) {
            for (;;) {
              t = 0;
              if (37 != (y[F + 1 >> 0] | 0)) {
                break b;
              }
              f = f + 1 | 0;
              F = F + 2 | 0;
              c[p >> 2] = F;
              if (37 != (y[F >> 0] | 0)) {
                break;
              }
            }
          }
        } while (0);
        f = f - v | 0;
        J && ka(h, v, f);
        if (!(f | 0)) {
          O = 0 == (S(y[(c[p >> 2] | 0) + 1 >> 0] | 0) | 0);
          F = c[p >> 2] | 0;
          if (O ? 0 : 36 == (y[F + 2 >> 0] | 0)) {
            var R = (y[F + 1 >> 0] | 0) + -48 | 0;
            var D = 1;
            f = 3;
          } else {
            R = -1, D = q, f = 1;
          }
          f = F + f | 0;
          c[p >> 2] = f;
          F = y[f >> 0] | 0;
          O = (F << 24 >> 24) + -32 | 0;
          if (31 < O >>> 0 | 0 == (1 << O & 75913 | 0)) {
            q = 0;
          } else {
            q = 0;
            do {
              q |= 1 << (F << 24 >> 24) + -32, f = f + 1 | 0, c[p >> 2] = f, F = y[f >> 0] | 0, O = (F << 24 >> 24) + -32 | 0;
            } while (!(31 < O >>> 0 | 0 == (1 << O & 75913 | 0)));
          }
          if (42 == F << 24 >> 24) {
            if (0 != (S(y[f + 1 >> 0] | 0) | 0) && (G = c[p >> 2] | 0, 36 == (y[G + 2 >> 0] | 0))) {
              f = G + 1 | 0, c[g + ((y[f >> 0] | 0) + -48 << 2) >> 2] = 10, f = c[e + ((y[f >> 0] | 0) + -48 << 3) >> 2] | 0, F = 1, D = G + 3 | 0;
            } else {
              if (D | 0) {
                l = -1;
                break;
              }
              J ? (O = (c[d >> 2] | 0) + 3 & -4, f = c[O >> 2] | 0, c[d >> 2] = O + 4) : f = 0;
              F = 0;
              D = (c[p >> 2] | 0) + 1 | 0;
            }
            c[p >> 2] = D;
            O = (A = 0 > (f | 0)) ? 0 - f | 0 : f;
            q = A ? q | 8192 : q;
            A = F;
            f = D;
          } else {
            f = Pa(p) | 0;
            if (0 > (f | 0)) {
              l = -1;
              break;
            }
            O = f;
            A = D;
            f = c[p >> 2] | 0;
          }
          do {
            if (46 == (y[f >> 0] | 0)) {
              if (42 != (y[f + 1 >> 0] | 0)) {
                c[p >> 2] = f + 1;
                var N = Pa(p) | 0;
                f = c[p >> 2] | 0;
              } else {
                if (S(y[f + 2 >> 0] | 0) | 0 && (ja = c[p >> 2] | 0, 36 == (y[ja + 3 >> 0] | 0))) {
                  N = ja + 2 | 0, c[g + ((y[N >> 0] | 0) + -48 << 2) >> 2] = 10, N = c[e + ((y[N >> 0] | 0) + -48 << 3) >> 2] | 0, f = ja + 4 | 0, c[p >> 2] = f;
                } else {
                  if (A | 0) {
                    l = -1;
                    break a;
                  }
                  if (J) {
                    var w = (c[d >> 2] | 0) + 3 & -4;
                    f = c[w >> 2] | 0;
                    c[d >> 2] = w + 4;
                  } else {
                    f = 0;
                  }
                  w = (c[p >> 2] | 0) + 2 | 0;
                  c[p >> 2] = w;
                  N = f;
                  f = w;
                }
              }
            } else {
              N = -1;
            }
          } while (0);
          for (w = 0;;) {
            if (57 < ((y[f >> 0] | 0) + -65 | 0) >>> 0) {
              l = -1;
              break a;
            }
            F = f;
            f = f + 1 | 0;
            c[p >> 2] = f;
            F = y[(y[F >> 0] | 0) + -65 + (585 + (58 * w | 0)) >> 0] | 0;
            D = F & 255;
            if (8 <= (D + -1 | 0) >>> 0) {
              break;
            } else {
              w = D;
            }
          }
          if (!(F << 24 >> 24)) {
            l = -1;
            break;
          }
          var E = -1 < (R | 0);
          do {
            if (19 == F << 24 >> 24) {
              if (E) {
                l = -1;
                break a;
              } else {
                t = 50;
              }
            } else {
              if (E) {
                c[g + (R << 2) >> 2] = D, E = e + (R << 3) | 0, R = c[E + 4 >> 2] | 0, t = m, c[t >> 2] = c[E >> 2], c[t + 4 >> 2] = R, t = 50;
              } else {
                if (!J) {
                  l = 0;
                  break a;
                }
                Ga(m, D, d);
                f = c[p >> 2] | 0;
              }
            }
          } while (0);
          if (50 == (t | 0) && (t = 0, !J)) {
            f = 0;
            q = A;
            continue;
          }
          F = y[f + -1 >> 0] | 0;
          F = 0 != (w | 0) & 3 == (F & 15 | 0) ? F & -33 : F;
          f = q & -65537;
          R = 0 == (q & 8192 | 0) ? q : f;
          b: do {
            switch(F | 0) {
              case 110:
                switch((w & 255) << 24 >> 24) {
                  case 0:
                    c[c[m >> 2] >> 2] = l;
                    f = 0;
                    q = A;
                    continue a;
                  case 1:
                    c[c[m >> 2] >> 2] = l;
                    f = 0;
                    q = A;
                    continue a;
                  case 2:
                    f = c[m >> 2] | 0;
                    c[f >> 2] = l;
                    c[f + 4 >> 2] = (0 > (l | 0)) << 31 >> 31;
                    f = 0;
                    q = A;
                    continue a;
                  case 3:
                    jb[c[m >> 2] >> 1] = l;
                    f = 0;
                    q = A;
                    continue a;
                  case 4:
                    y[c[m >> 2] >> 0] = l;
                    f = 0;
                    q = A;
                    continue a;
                  case 6:
                    c[c[m >> 2] >> 2] = l;
                    f = 0;
                    q = A;
                    continue a;
                  case 7:
                    f = c[m >> 2] | 0;
                    c[f >> 2] = l;
                    c[f + 4 >> 2] = (0 > (l | 0)) << 31 >> 31;
                    f = 0;
                    q = A;
                    continue a;
                  default:
                    f = 0;
                    q = A;
                    continue a;
                }case 112:
                F = 120;
                f = 8 < N >>> 0 ? N : 8;
                q = R | 8;
                t = 62;
                break;
              case 88:
              case 120:
                f = N;
                q = R;
                t = 62;
                break;
              case 111:
                F = m;
                f = c[F >> 2] | 0;
                F = c[F + 4 >> 2] | 0;
                t = f;
                q = F;
                D = M;
                t |= 0;
                q |= 0;
                D |= 0;
                if (!(0 == (t | 0) & 0 == (q | 0))) {
                  do {
                    D = D + -1 | 0, y[D >> 0] = t & 7 | 48, t = na(t | 0, q | 0, 3) | 0, q = oa;
                  } while (!(0 == (t | 0) & 0 == (q | 0)));
                }
                E = D | 0;
                q = M - E | 0;
                w = 0;
                D = 1049;
                N = 0 == (R & 8 | 0) | (N | 0) > (q | 0) ? N : q + 1 | 0;
                q = R;
                t = 68;
                break;
              case 105:
              case 100:
                F = m;
                f = c[F >> 2] | 0;
                F = c[F + 4 >> 2] | 0;
                0 > (F | 0) ? (f = ya(0, 0, f | 0, F | 0) | 0, F = oa, q = m, c[q >> 2] = f, c[q + 4 >> 2] = F, q = 1, D = 1049) : (q = 0 != (R & 2049 | 0) & 1, D = 0 == (R & 2048 | 0) ? 0 == (R & 1 | 0) ? 1049 : 1051 : 1050);
                t = 67;
                break b;
              case 117:
                F = m;
                q = 0;
                D = 1049;
                f = c[F >> 2] | 0;
                F = c[F + 4 >> 2] | 0;
                t = 67;
                break;
              case 99:
                y[u >> 0] = c[m >> 2];
                v = u;
                w = 0;
                D = 1049;
                E = M;
                F = 1;
                break;
              case 109:
                t = c[893] | 0;
                var L = t |= 0;
                t = c[130] | 0;
                L |= 0;
                t |= 0;
                var Ca = 0;
                for (F = 0;;) {
                  if ((Ja[1119 + F >> 0] | 0) == (L | 0)) {
                    L = 2;
                    break;
                  }
                  Ca = F + 1 | 0;
                  if (87 == (Ca | 0)) {
                    Ca = 1207;
                    F = 87;
                    L = 5;
                    break;
                  } else {
                    F = Ca;
                  }
                }
                2 == (L | 0) && (F ? (Ca = 1207, L = 5) : Ca = 1207);
                if (5 == (L | 0)) {
                  for (;;) {
                    do {
                      L = Ca, Ca = Ca + 1 | 0;
                    } while (0 != (y[L >> 0] | 0));
                    F = F + -1 | 0;
                    if (!F) {
                      break;
                    }
                  }
                }
                F = Ca;
                L = c[t + 20 >> 2] | 0;
                F |= 0;
                L |= 0;
                var ma;
                t = F;
                t |= 0;
                if (L |= 0) {
                  F = c[L >> 2] | 0;
                  var wa = c[L + 4 >> 2] | 0, W = t;
                  F |= 0;
                  wa |= 0;
                  W |= 0;
                  var va = 0;
                  L = (c[F >> 2] | 0) + 1794895138 | 0;
                  var P = Ka(c[F + 8 >> 2] | 0, L) | 0;
                  var sa = Ka(c[F + 12 >> 2] | 0, L) | 0;
                  var V = Ka(c[F + 16 >> 2] | 0, L) | 0;
                  c: do {
                    if (P >>> 0 < wa >>> 2 >>> 0 && (va = wa - (P << 2) | 0, sa >>> 0 < va >>> 0 & V >>> 0 < va >>> 0) && 0 == ((V | sa) & 3 | 0)) {
                      va = sa >>> 2;
                      Ca = V >>> 2;
                      for (ma = 0;;) {
                        var Ra = P >>> 1;
                        var za = ma + Ra | 0;
                        var Fa = za << 1;
                        V = Fa + va | 0;
                        sa = Ka(c[F + (V << 2) >> 2] | 0, L) | 0;
                        V = Ka(c[F + (V + 1 << 2) >> 2] | 0, L) | 0;
                        if (!(V >>> 0 < wa >>> 0 & sa >>> 0 < (wa - V | 0) >>> 0)) {
                          sa = 0;
                          break c;
                        }
                        if (y[F + (V + sa) >> 0] | 0) {
                          sa = 0;
                          break c;
                        }
                        sa = W;
                        var Da = F + V | 0;
                        sa |= 0;
                        Da |= 0;
                        var Ea = y[sa >> 0] | 0;
                        V = y[Da >> 0] | 0;
                        if (0 != Ea << 24 >> 24 && Ea << 24 >> 24 == V << 24 >> 24) {
                          do {
                            sa = sa + 1 | 0, Da = Da + 1 | 0, Ea = y[sa >> 0] | 0, V = y[Da >> 0] | 0;
                          } while (0 != Ea << 24 >> 24 && Ea << 24 >> 24 == V << 24 >> 24);
                        }
                        sa = V;
                        sa = (Ea & 255) - (sa & 255) | 0;
                        if (!sa) {
                          break;
                        }
                        sa = 0 > (sa | 0);
                        if (1 == (P | 0)) {
                          sa = 0;
                          break c;
                        } else {
                          ma = sa ? ma : za, P = sa ? Ra : P - Ra | 0;
                        }
                      }
                      sa = Fa + Ca | 0;
                      V = Ka(c[F + (sa << 2) >> 2] | 0, L) | 0;
                      sa = Ka(c[F + (sa + 1 << 2) >> 2] | 0, L) | 0;
                      sa = sa >>> 0 < wa >>> 0 & V >>> 0 < (wa - sa | 0) >>> 0 ? 0 == (y[F + (sa + V) >> 0] | 0) ? F + sa | 0 : 0 : 0;
                    } else {
                      sa = 0;
                    }
                  } while (0);
                  L = sa | 0;
                } else {
                  L = 0;
                }
                F = (L | 0 ? L : t) | 0;
                t = 72;
                break;
              case 115:
                F = c[m >> 2] | 0;
                F = F | 0 ? F : 1059;
                t = 72;
                break;
              case 67:
                c[Ta >> 2] = c[m >> 2];
                c[H >> 2] = 0;
                c[m >> 2] = Ta;
                N = -1;
                q = Ta;
                t = 76;
                break;
              case 83:
                f = c[m >> 2] | 0;
                N ? (q = f, t = 76) : (Y(h, 32, O, 0, R), f = 0, t = 85);
                break;
              case 65:
              case 71:
              case 70:
              case 69:
              case 97:
              case 103:
              case 102:
              case 101:
                f = h;
                v = +ra[m >> 3];
                q = F;
                f |= 0;
                v = +v;
                O |= 0;
                N |= 0;
                R |= 0;
                q |= 0;
                F = 0;
                Fa = T;
                T = T + 560 | 0;
                D = Fa + 8 | 0;
                w = Fa;
                za = Ra = Fa + 524 | 0;
                E = Fa + 512 | 0;
                c[w >> 2] = 0;
                ma = E + 12 | 0;
                la(v) | 0;
                0 > (oa | 0) ? (v = -v, Ca = 1, L = 1066) : (Ca = 0 != (R & 2049 | 0) & 1, L = 0 == (R & 2048 | 0) ? 0 == (R & 1 | 0) ? 1067 : 1072 : 1069);
                la(v) | 0;
                do {
                  if (1 & 2146435072 == (oa & 2146435072 | 0)) {
                    Ra = 0 != (q & 32 | 0), P = Ca + 3 | 0, Y(f, 32, O, P, R & -65537), ka(f, L, Ca), ka(f, v != v | 0 ? Ra ? 1093 : 1097 : Ra ? 1085 : 1089, 3);
                  } else {
                    P = w;
                    v = +v;
                    P |= 0;
                    V = 2 * + + +Ha(v, P);
                    (P = 0 != V) && (c[w >> 2] = (c[w >> 2] | 0) + -1);
                    var Oa = q | 32;
                    if (97 == (Oa | 0)) {
                      va = q & 32;
                      Ea = 0 == (va | 0) ? L : L + 9 | 0;
                      sa = Ca | 2;
                      P = 12 - N | 0;
                      if (11 < N >>> 0 | 0 == (P | 0)) {
                        v = V;
                      } else {
                        v = 8;
                        do {
                          P = P + -1 | 0, v *= 16;
                        } while (0 != (P | 0));
                        v = 45 == (y[Ea >> 0] | 0) ? -(v + (-V - v)) : V + v - v;
                      }
                      wa = c[w >> 2] | 0;
                      P = 0 > (wa | 0) ? 0 - wa | 0 : wa;
                      P = pa(P, (0 > (P | 0)) << 31 >> 31, ma) | 0;
                      (P | 0) == (ma | 0) && (P = E + 11 | 0, y[P >> 0] = 48);
                      y[P + -1 >> 0] = (wa >> 31 & 2) + 43;
                      W = P + -2 | 0;
                      y[W >> 0] = q + 15;
                      D = 1 > (N | 0);
                      E = 0 == (R & 8 | 0);
                      P = Ra;
                      do {
                        var La = ~~v;
                        wa = P + 1 | 0;
                        y[P >> 0] = va | Ja[1101 + La >> 0];
                        v = 16 * (v - +(La | 0));
                        1 != (wa - za | 0) || E & D & 0 == v ? P = wa : (y[wa >> 0] = 46, P = P + 2 | 0);
                      } while (0 != v);
                      0 != (N | 0) && (-2 - za + P | 0) < (N | 0) ? (wa = P - za | 0, P = N + 2 | 0) : wa = P = P - za | 0;
                      ma = ma - W | 0;
                      za = ma + sa + P | 0;
                      Y(f, 32, O, za, R);
                      ka(f, Ea, sa);
                      Y(f, 48, O, za, R ^ 65536);
                      ka(f, Ra, wa);
                      Y(f, 48, P - wa | 0, 0, 0);
                      ka(f, W, ma);
                      Y(f, 32, O, za, R ^ 8192);
                      P = za;
                      break;
                    }
                    wa = 0 > (N | 0) ? 6 : N;
                    P ? (P = (c[w >> 2] | 0) + -28 | 0, c[w >> 2] = P, v = 268435456 * V) : (v = V, P = c[w >> 2] | 0);
                    D = La = 0 > (P | 0) ? D : D + 288 | 0;
                    do {
                      var Xa = ~~v >>> 0;
                      c[D >> 2] = Xa;
                      D = D + 4 | 0;
                      v = 1E9 * (v - +(Xa >>> 0));
                    } while (0 != v);
                    if (0 < (P | 0)) {
                      for (E = La, va = D;;) {
                        W = 29 > (P | 0) ? P : 29;
                        P = va + -4 | 0;
                        if (P >>> 0 >= E >>> 0) {
                          D = 0;
                          do {
                            var Ia = U(c[P >> 2] | 0, 0, W | 0) | 0;
                            Ia = Na(Ia | 0, oa | 0, D | 0, 0) | 0;
                            Xa = oa;
                            var Ua = ua(Ia | 0, Xa | 0, 1E9, 0) | 0;
                            c[P >> 2] = Ua;
                            D = xa(Ia | 0, Xa | 0, 1E9, 0) | 0;
                            P = P + -4 | 0;
                          } while (P >>> 0 >= E >>> 0);
                          D && (E = E + -4 | 0, c[E >> 2] = D);
                        }
                        for (D = va; !(D >>> 0 <= E >>> 0 || (P = D + -4 | 0, c[P >> 2] | 0));) {
                          D = P;
                        }
                        P = (c[w >> 2] | 0) - W | 0;
                        c[w >> 2] = P;
                        if (0 < (P | 0)) {
                          va = D;
                        } else {
                          break;
                        }
                      }
                    } else {
                      E = La;
                    }
                    if (0 > (P | 0)) {
                      N = ((wa + 25 | 0) / 9 | 0) + 1 | 0;
                      Da = 102 == (Oa | 0);
                      do {
                        Ea = 0 - P | 0;
                        Ea = 9 > (Ea | 0) ? Ea : 9;
                        if (E >>> 0 < D >>> 0) {
                          W = (1 << Ea) + -1 | 0;
                          va = 1E9 >>> Ea;
                          sa = 0;
                          P = E;
                          do {
                            Xa = c[P >> 2] | 0, c[P >> 2] = (Xa >>> Ea) + sa, sa = Ya(Xa & W, va) | 0, P = P + 4 | 0;
                          } while (P >>> 0 < D >>> 0);
                          P = 0 == (c[E >> 2] | 0) ? E + 4 | 0 : E;
                          sa ? (c[D >> 2] = sa, E = P, P = D + 4 | 0) : (E = P, P = D);
                        } else {
                          E = 0 == (c[E >> 2] | 0) ? E + 4 | 0 : E, P = D;
                        }
                        D = Da ? La : E;
                        D = (P - D >> 2 | 0) > (N | 0) ? D + (N << 2) | 0 : P;
                        P = (c[w >> 2] | 0) + Ea | 0;
                        c[w >> 2] = P;
                      } while (0 > (P | 0));
                    }
                    P = E;
                    N = D;
                    Xa = La;
                    if (P >>> 0 < N >>> 0) {
                      if (D = 9 * (Xa - P >> 2) | 0, W = c[P >> 2] | 0, 10 <= W >>> 0) {
                        E = 10;
                        do {
                          E = 10 * E | 0, D = D + 1 | 0;
                        } while (W >>> 0 >= E >>> 0);
                      }
                    } else {
                      D = 0;
                    }
                    Da = 103 == (Oa | 0);
                    Ua = 0 != (wa | 0);
                    E = wa - (102 != (Oa | 0) ? D : 0) + ((Ua & Da) << 31 >> 31) | 0;
                    if ((E | 0) < ((9 * (N - Xa >> 2) | 0) + -9 | 0)) {
                      E = E + 9216 | 0;
                      Ea = La + 4 + (((E | 0) / 9 | 0) + -1024 << 2) | 0;
                      E = (E | 0) % 9 | 0;
                      if (8 > (E | 0)) {
                        for (W = 10;;) {
                          if (W = 10 * W | 0, 7 > (E | 0)) {
                            E = E + 1 | 0;
                          } else {
                            break;
                          }
                        }
                      } else {
                        W = 10;
                      }
                      va = c[Ea >> 2] | 0;
                      sa = (va >>> 0) % (W >>> 0) | 0;
                      E = (Ea + 4 | 0) == (N | 0);
                      if (E & 0 == (sa | 0)) {
                        E = Ea;
                      } else {
                        if (V = 0 == (((va >>> 0) / (W >>> 0) | 0) & 1 | 0) ? 9007199254740992 : 9007199254740994, Ia = (W | 0) / 2 | 0, v = sa >>> 0 < Ia >>> 0 ? .5 : E & (sa | 0) == (Ia | 0) ? 1 : 1.5, Ca && (v = (Ia = 45 == (y[L >> 0] | 0)) ? -v : v, V = Ia ? -V : V), E = va - sa | 0, c[Ea >> 2] = E, V + v != V) {
                          Ia = E + W | 0;
                          c[Ea >> 2] = Ia;
                          if (999999999 < Ia >>> 0) {
                            for (D = Ea;;) {
                              if (E = D + -4 | 0, c[D >> 2] = 0, E >>> 0 < P >>> 0 && (P = P + -4 | 0, c[P >> 2] = 0), Ia = (c[E >> 2] | 0) + 1 | 0, c[E >> 2] = Ia, 999999999 < Ia >>> 0) {
                                D = E;
                              } else {
                                break;
                              }
                            }
                          } else {
                            E = Ea;
                          }
                          D = 9 * (Xa - P >> 2) | 0;
                          va = c[P >> 2] | 0;
                          if (10 <= va >>> 0) {
                            W = 10;
                            do {
                              W = 10 * W | 0, D = D + 1 | 0;
                            } while (va >>> 0 >= W >>> 0);
                          }
                        } else {
                          E = Ea;
                        }
                      }
                      E = E + 4 | 0;
                      E = N >>> 0 > E >>> 0 ? E : N;
                    } else {
                      E = N;
                    }
                    Ia = P;
                    for (Oa = E;;) {
                      if (Oa >>> 0 <= Ia >>> 0) {
                        w = 0;
                        break;
                      }
                      P = Oa + -4 | 0;
                      if (c[P >> 2] | 0) {
                        w = 1;
                        break;
                      } else {
                        Oa = P;
                      }
                    }
                    N = 0 - D | 0;
                    if (Da) {
                      if (P = wa + ((Ua ^ 1) & 1) | 0, (P | 0) > (D | 0) & -5 < (D | 0) ? (W = q + -1 | 0, wa = P + -1 - D | 0) : (W = q + -2 | 0, wa = P + -1 | 0), P = R & 8) {
                        Ea = P;
                      } else {
                        if (w && (F = c[Oa + -4 >> 2] | 0, 0 != (F | 0))) {
                          if ((F >>> 0) % 10 | 0) {
                            E = 0;
                          } else {
                            E = 0;
                            P = 10;
                            do {
                              P = 10 * P | 0, E = E + 1 | 0;
                            } while (!((F >>> 0) % (P >>> 0) | 0));
                          }
                        } else {
                          E = 9;
                        }
                        P = (9 * (Oa - Xa >> 2) | 0) + -9 | 0;
                        Ea = 102 == (W | 32) ? P - E | 0 : P + D - E | 0;
                        Ea = 0 < (Ea | 0) ? Ea : 0;
                        wa = (wa | 0) < (Ea | 0) ? wa : Ea;
                        Ea = 0;
                      }
                    } else {
                      W = q, Ea = R & 8;
                    }
                    Da = wa | Ea;
                    va = 0 != (Da | 0) & 1;
                    if (sa = 102 == (W | 32)) {
                      Ua = 0, P = 0 < (D | 0) ? D : 0;
                    } else {
                      P = 0 > (D | 0) ? N : D;
                      P = pa(P, (0 > (P | 0)) << 31 >> 31, ma) | 0;
                      E = ma;
                      if (2 > (E - P | 0)) {
                        do {
                          P = P + -1 | 0, y[P >> 0] = 48;
                        } while (2 > (E - P | 0));
                      }
                      y[P + -1 >> 0] = (D >> 31 & 2) + 43;
                      P = P + -2 | 0;
                      y[P >> 0] = W;
                      Ua = P;
                      P = E - P | 0;
                    }
                    P = Ca + 1 + wa + va + P | 0;
                    Y(f, 32, O, P, R);
                    ka(f, L, Ca);
                    Y(f, 48, O, P, R ^ 65536);
                    if (sa) {
                      W = Ia >>> 0 > La >>> 0 ? La : Ia;
                      va = Ea = Ra + 9 | 0;
                      sa = Ra + 8 | 0;
                      E = W;
                      do {
                        D = pa(c[E >> 2] | 0, 0, Ea) | 0;
                        if ((E | 0) == (W | 0)) {
                          (D | 0) == (Ea | 0) && (y[sa >> 0] = 48, D = sa);
                        } else {
                          if (D >>> 0 > Ra >>> 0) {
                            aa(Ra | 0, 48, D - za | 0) | 0;
                            do {
                              D = D + -1 | 0;
                            } while (D >>> 0 > Ra >>> 0);
                          }
                        }
                        ka(f, D, va - D | 0);
                        E = E + 4 | 0;
                      } while (E >>> 0 <= La >>> 0);
                      Da | 0 && ka(f, 1117, 1);
                      if (E >>> 0 < Oa >>> 0 & 0 < (wa | 0)) {
                        for (;;) {
                          D = pa(c[E >> 2] | 0, 0, Ea) | 0;
                          if (D >>> 0 > Ra >>> 0) {
                            aa(Ra | 0, 48, D - za | 0) | 0;
                            do {
                              D = D + -1 | 0;
                            } while (D >>> 0 > Ra >>> 0);
                          }
                          ka(f, D, 9 > (wa | 0) ? wa : 9);
                          E = E + 4 | 0;
                          D = wa + -9 | 0;
                          if (E >>> 0 < Oa >>> 0 & 9 < (wa | 0)) {
                            wa = D;
                          } else {
                            wa = D;
                            break;
                          }
                        }
                      }
                      Y(f, 48, wa + 9 | 0, 9, 0);
                    } else {
                      Da = w ? Oa : Ia + 4 | 0;
                      if (-1 < (wa | 0)) {
                        w = Ra + 9 | 0;
                        Ea = 0 == (Ea | 0);
                        N = w;
                        va = 0 - za | 0;
                        sa = Ra + 8 | 0;
                        W = Ia;
                        do {
                          D = pa(c[W >> 2] | 0, 0, w) | 0;
                          (D | 0) == (w | 0) && (y[sa >> 0] = 48, D = sa);
                          if ((W | 0) == (Ia | 0)) {
                            E = D + 1 | 0, ka(f, D, 1), Ea & 1 > (wa | 0) || ka(f, 1117, 1), D = E;
                          } else {
                            if (!(D >>> 0 <= Ra >>> 0)) {
                              aa(Ra | 0, 48, D + va | 0) | 0;
                              do {
                                D = D + -1 | 0;
                              } while (D >>> 0 > Ra >>> 0);
                            }
                          }
                          za = N - D | 0;
                          ka(f, D, (wa | 0) > (za | 0) ? za : wa);
                          wa = wa - za | 0;
                          W = W + 4 | 0;
                        } while (W >>> 0 < Da >>> 0 & -1 < (wa | 0));
                      }
                      Y(f, 48, wa + 18 | 0, 18, 0);
                      ka(f, Ua, ma - Ua | 0);
                    }
                  }
                  Y(f, 32, O, P, R ^ 8192);
                } while (0);
                T = Fa;
                f = ((P | 0) < (O | 0) ? O : P) | 0;
                q = A;
                continue a;
              default:
                w = 0, D = 1049, E = M, F = N, f = R;
            }
          } while (0);
          b: do {
            if (62 == (t | 0)) {
              R = m;
              v = c[R >> 2] | 0;
              R = c[R + 4 >> 2] | 0;
              N = v;
              t = R;
              D = M;
              E = F & 32;
              N |= 0;
              t |= 0;
              D |= 0;
              E |= 0;
              if (!(0 == (N | 0) & 0 == (t | 0))) {
                do {
                  D = D + -1 | 0, y[D >> 0] = Ja[1101 + (N & 15) >> 0] | 0 | E, N = na(N | 0, t | 0, 4) | 0, t = oa;
                } while (!(0 == (N | 0) & 0 == (t | 0)));
              }
              E = D | 0;
              w = (D = 0 == (q & 8 | 0) | 0 == (v | 0) & 0 == (R | 0)) ? 0 : 2;
              D = D ? 1049 : 1049 + (F >> 4) | 0;
              N = f;
              f = v;
              F = R;
              t = 68;
            } else {
              if (67 == (t | 0)) {
                E = pa(f, F, M) | 0, w = q, q = R, t = 68;
              } else {
                if (72 == (t | 0)) {
                  t = 0;
                  R = F;
                  v = 0;
                  q = N;
                  R |= 0;
                  v |= 0;
                  q |= 0;
                  w = v & 255;
                  D = 0 != (q | 0);
                  c: do {
                    if (D & 0 != (R & 3 | 0)) {
                      for (E = v & 255;;) {
                        if ((y[R >> 0] | 0) == E << 24 >> 24) {
                          L = 6;
                          break c;
                        }
                        R = R + 1 | 0;
                        q = q + -1 | 0;
                        D = 0 != (q | 0);
                        if (!(D & 0 != (R & 3 | 0))) {
                          L = 5;
                          break;
                        }
                      }
                    } else {
                      L = 5;
                    }
                  } while (0);
                  5 == (L | 0) && (D ? L = 6 : q = 0);
                  c: do {
                    if (6 == (L | 0) && (E = v & 255, (y[R >> 0] | 0) != E << 24 >> 24)) {
                      D = Ya(w, 16843009) | 0;
                      d: do {
                        if (3 < q >>> 0) {
                          for (;;) {
                            w = c[R >> 2] ^ D;
                            if ((w & -2139062144 ^ -2139062144) & w + -16843009 | 0) {
                              break;
                            }
                            R = R + 4 | 0;
                            q = q + -4 | 0;
                            if (3 >= q >>> 0) {
                              L = 11;
                              break d;
                            }
                          }
                        } else {
                          L = 11;
                        }
                      } while (0);
                      if (11 != (L | 0) || q) {
                        for (;;) {
                          if ((y[R >> 0] | 0) == E << 24 >> 24) {
                            break c;
                          }
                          R = R + 1 | 0;
                          q = q + -1 | 0;
                          if (!q) {
                            q = 0;
                            break;
                          }
                        }
                      } else {
                        q = 0;
                      }
                    }
                  } while (0);
                  R = (q | 0 ? R : 0) | 0;
                  q = 0 == (R | 0);
                  v = F;
                  w = 0;
                  D = 1049;
                  E = q ? F + N | 0 : R;
                  F = q ? N : R - F | 0;
                } else {
                  if (76 == (t | 0)) {
                    t = 0;
                    E = q;
                    for (F = f = 0;;) {
                      D = c[E >> 2] | 0;
                      if (!D) {
                        break;
                      }
                      F = da(B, D) | 0;
                      if (0 > (F | 0) | F >>> 0 > (N - f | 0) >>> 0) {
                        break;
                      }
                      f = F + f | 0;
                      if (N >>> 0 > f >>> 0) {
                        E = E + 4 | 0;
                      } else {
                        break;
                      }
                    }
                    if (0 > (F | 0)) {
                      l = -1;
                      break a;
                    }
                    Y(h, 32, O, f, R);
                    if (f) {
                      for (D = 0;;) {
                        F = c[q >> 2] | 0;
                        if (!F) {
                          t = 85;
                          break b;
                        }
                        F = da(B, F) | 0;
                        D = F + D | 0;
                        if ((D | 0) > (f | 0)) {
                          t = 85;
                          break b;
                        }
                        ka(h, B, F);
                        if (D >>> 0 >= f >>> 0) {
                          t = 85;
                          break;
                        } else {
                          q = q + 4 | 0;
                        }
                      }
                    } else {
                      f = 0, t = 85;
                    }
                  }
                }
              }
            }
          } while (0);
          if (68 == (t | 0)) {
            t = 0, F = 0 != (f | 0) | 0 != (F | 0), f = 0 != (N | 0) | F, F = M - E + ((F ^ 1) & 1) | 0, v = f ? E : M, E = M, F = f ? (N | 0) > (F | 0) ? N : F : N, f = -1 < (N | 0) ? q & -65537 : q;
          } else {
            if (85 == (t | 0)) {
              t = 0;
              Y(h, 32, O, f, R ^ 8192);
              f = (O | 0) > (f | 0) ? O : f;
              q = A;
              continue;
            }
          }
          N = E - v | 0;
          E = (F | 0) < (N | 0) ? N : F;
          R = E + w | 0;
          q = (O | 0) < (R | 0) ? R : O;
          Y(h, 32, q, R, f);
          ka(h, D, w);
          Y(h, 48, q, R, f ^ 65536);
          Y(h, 48, E, N, 0);
          ka(h, v, N);
          Y(h, 32, q, R, f ^ 8192);
          f = q;
          q = A;
        }
      }
      a: do {
        if (88 == (t | 0) && !h) {
          if (q) {
            for (l = 1;;) {
              f = c[g + (l << 2) >> 2] | 0;
              if (!f) {
                break;
              }
              Ga(e + (l << 3) | 0, f, d);
              f = l + 1 | 0;
              if (9 > (l | 0)) {
                l = f;
              } else {
                l = f;
                break;
              }
            }
            if (10 > (l | 0)) {
              for (;;) {
                if (c[g + (l << 2) >> 2] | 0) {
                  l = -1;
                  break a;
                }
                if (9 > (l | 0)) {
                  l = l + 1 | 0;
                } else {
                  l = 1;
                  break;
                }
              }
            } else {
              l = 1;
            }
          } else {
            l = 0;
          }
        }
      } while (0);
      T = m;
      return l | 0;
    }
    function ka(h, l, d) {
      h |= 0;
      l |= 0;
      d |= 0;
      if (!(c[h >> 2] & 32)) {
        l |= 0;
        d |= 0;
        h |= 0;
        var e, f = 0;
        var g = h + 16 | 0;
        if (e = c[g >> 2] | 0) {
          f = 5;
        } else {
          var m = h;
          m |= 0;
          var t = m + 74 | 0;
          var ja = y[t >> 0] | 0;
          y[t >> 0] = ja + 255 | ja;
          t = c[m >> 2] | 0;
          t & 8 ? (c[m >> 2] = t | 32, m = -1) : (c[m + 8 >> 2] = 0, c[m + 4 >> 2] = 0, ja = c[m + 44 >> 2] | 0, c[m + 28 >> 2] = ja, c[m + 20 >> 2] = ja, c[m + 16 >> 2] = ja + (c[m + 48 >> 2] | 0), m = 0);
          m | 0 ? g = 0 : (e = c[g >> 2] | 0, f = 5);
        }
        a: do {
          if (5 == (f | 0)) {
            if (t = h + 20 | 0, g = m = c[t >> 2] | 0, (e - m | 0) >>> 0 < d >>> 0) {
              g = bb[c[h + 36 >> 2] & 3](h, l, d) | 0;
            } else {
              b: do {
                if (-1 < (y[h + 75 >> 0] | 0)) {
                  for (m = d;;) {
                    if (!m) {
                      f = 0;
                      e = l;
                      break b;
                    }
                    e = m + -1 | 0;
                    if (10 == (y[l + e >> 0] | 0)) {
                      break;
                    } else {
                      m = e;
                    }
                  }
                  g = bb[c[h + 36 >> 2] & 3](h, l, m) | 0;
                  if (g >>> 0 < m >>> 0) {
                    break a;
                  }
                  f = m;
                  e = l + m | 0;
                  d = d - m | 0;
                  g = c[t >> 2] | 0;
                } else {
                  f = 0, e = l;
                }
              } while (0);
              V(g | 0, e | 0, d | 0) | 0;
              c[t >> 2] = (c[t >> 2] | 0) + d;
              g = f + d | 0;
            }
          }
        } while (0);
        g | 0;
      }
    }
    function Pa(h) {
      h |= 0;
      if (S(y[c[h >> 2] >> 0] | 0) | 0) {
        var l = 0;
        do {
          var d = c[h >> 2] | 0;
          l = (10 * l | 0) + -48 + (y[d >> 0] | 0) | 0;
          d = d + 1 | 0;
          c[h >> 2] = d;
        } while (0 != (S(y[d >> 0] | 0) | 0));
      } else {
        l = 0;
      }
      return l | 0;
    }
    function Ga(h, l, d) {
      h |= 0;
      l |= 0;
      d |= 0;
      a: do {
        if (20 >= l >>> 0) {
          do {
            switch(l | 0) {
              case 9:
                var e = (c[d >> 2] | 0) + 3 & -4;
                l = c[e >> 2] | 0;
                c[d >> 2] = e + 4;
                c[h >> 2] = l;
                break a;
              case 10:
                e = (c[d >> 2] | 0) + 3 & -4;
                l = c[e >> 2] | 0;
                c[d >> 2] = e + 4;
                e = h;
                c[e >> 2] = l;
                c[e + 4 >> 2] = (0 > (l | 0)) << 31 >> 31;
                break a;
              case 11:
                e = (c[d >> 2] | 0) + 3 & -4;
                l = c[e >> 2] | 0;
                c[d >> 2] = e + 4;
                e = h;
                c[e >> 2] = l;
                c[e + 4 >> 2] = 0;
                break a;
              case 12:
                l = e = (c[d >> 2] | 0) + 7 & -8;
                var f = c[l >> 2] | 0;
                l = c[l + 4 >> 2] | 0;
                c[d >> 2] = e + 8;
                e = h;
                c[e >> 2] = f;
                c[e + 4 >> 2] = l;
                break a;
              case 13:
                f = (c[d >> 2] | 0) + 3 & -4;
                e = c[f >> 2] | 0;
                c[d >> 2] = f + 4;
                e = (e & 65535) << 16 >> 16;
                f = h;
                c[f >> 2] = e;
                c[f + 4 >> 2] = (0 > (e | 0)) << 31 >> 31;
                break a;
              case 14:
                f = (c[d >> 2] | 0) + 3 & -4;
                e = c[f >> 2] | 0;
                c[d >> 2] = f + 4;
                f = h;
                c[f >> 2] = e & 65535;
                c[f + 4 >> 2] = 0;
                break a;
              case 15:
                f = (c[d >> 2] | 0) + 3 & -4;
                e = c[f >> 2] | 0;
                c[d >> 2] = f + 4;
                e = (e & 255) << 24 >> 24;
                f = h;
                c[f >> 2] = e;
                c[f + 4 >> 2] = (0 > (e | 0)) << 31 >> 31;
                break a;
              case 16:
                f = (c[d >> 2] | 0) + 3 & -4;
                e = c[f >> 2] | 0;
                c[d >> 2] = f + 4;
                f = h;
                c[f >> 2] = e & 255;
                c[f + 4 >> 2] = 0;
                break a;
              case 17:
                f = (c[d >> 2] | 0) + 7 & -8;
                l = +ra[f >> 3];
                c[d >> 2] = f + 8;
                ra[h >> 3] = l;
                break a;
              case 18:
                f = (c[d >> 2] | 0) + 7 & -8;
                l = +ra[f >> 3];
                c[d >> 2] = f + 8;
                ra[h >> 3] = l;
                break a;
              default:
                break a;
            }
          } while (0);
        }
      } while (0);
    }
    function pa(c, d, e) {
      c |= 0;
      d |= 0;
      e |= 0;
      if (0 < d >>> 0 | 0 == (d | 0) & 4294967295 < c >>> 0) {
        for (;;) {
          var h = ua(c | 0, d | 0, 10, 0) | 0;
          e = e + -1 | 0;
          y[e >> 0] = h & 255 | 48;
          h = c;
          c = xa(c | 0, d | 0, 10, 0) | 0;
          if (9 < d >>> 0 | 9 == (d | 0) & 4294967295 < h >>> 0) {
            d = oa;
          } else {
            break;
          }
        }
      }
      if (d = c) {
        for (; !(e = e + -1 | 0, y[e >> 0] = (d >>> 0) % 10 | 48, 10 > d >>> 0);) {
          d = (d >>> 0) / 10 | 0;
        }
      }
      return e | 0;
    }
    function Y(c, d, e, f, g) {
      c |= 0;
      d |= 0;
      e |= 0;
      f |= 0;
      g |= 0;
      var h = T;
      T = T + 256 | 0;
      if ((e | 0) > (f | 0) & 0 == (g & 73728 | 0)) {
        g = e - f | 0;
        aa(h | 0, d << 24 >> 24 | 0, (256 > g >>> 0 ? g : 256) | 0) | 0;
        if (255 < g >>> 0) {
          d = e - f | 0;
          do {
            ka(c, h, 256), g = g + -256 | 0;
          } while (255 < g >>> 0);
          g = d & 255;
        }
        ka(c, h, g);
      }
      T = h;
    }
    function da(h, d) {
      h |= 0;
      d |= 0;
      h ? (h |= 0, d |= 0, h ? 128 > d >>> 0 ? (y[h >> 0] = d, h = 1) : c[c[130] >> 2] | 0 ? 2048 > d >>> 0 ? (y[h >> 0] = d >>> 6 | 192, y[h + 1 >> 0] = d & 63 | 128, h = 2) : 55296 > d >>> 0 | 57344 == (d & -8192 | 0) ? (y[h >> 0] = d >>> 12 | 224, y[h + 1 >> 0] = d >>> 6 & 63 | 128, y[h + 2 >> 0] = d & 63 | 128, h = 3) : 1048576 > (d + -65536 | 0) >>> 0 ? (y[h >> 0] = d >>> 18 | 240, y[h + 1 >> 0] = d >>> 12 & 63 | 128, y[h + 2 >> 0] = d >>> 6 & 63 | 128, y[h + 3 >> 0] = d & 63 | 128, h = 4) : 
      (c[893] = 84, h = -1) : 57216 == (d & -128 | 0) ? (y[h >> 0] = d, h = 1) : (c[893] = 84, h = -1) : h = 1, h |= 0) : h = 0;
      return h | 0;
    }
    function la(h) {
      h = +h;
      ra[za >> 3] = h;
      h = c[za >> 2] | 0;
      oa = c[za + 4 >> 2] | 0;
      return h | 0;
    }
    function Ha(h, d) {
      h = +h;
      d |= 0;
      ra[za >> 3] = h;
      var l = c[za >> 2] | 0;
      var e = c[za + 4 >> 2] | 0;
      var f = na(l | 0, e | 0, 52) | 0;
      switch(f & 2047) {
        case 0:
          0 != h ? (h = +Ha(1.8446744073709552E19 * h, d), l = (c[d >> 2] | 0) + -64 | 0) : l = 0;
          c[d >> 2] = l;
          break;
        case 2047:
          break;
        default:
          c[d >> 2] = (f & 2047) + -1022, c[za >> 2] = l, c[za + 4 >> 2] = e & -2146435073 | 1071644672, h = +ra[za >> 3];
      }
      return +h;
    }
    function Ka(c, d) {
      c |= 0;
      d |= 0;
      var h = L(c | 0) | 0;
      return (0 == (d | 0) ? c : h) | 0;
    }
    function Na(c, d, e, f) {
      c |= 0;
      d |= 0;
      e |= 0;
      f |= 0;
      e = c + e >>> 0;
      return (oa = d + f + (e >>> 0 < c >>> 0 | 0) >>> 0, e | 0) | 0;
    }
    function ya(c, d, e, f) {
      c |= 0;
      d |= 0;
      e |= 0;
      f |= 0;
      f = d - f - (e >>> 0 > c >>> 0 | 0) >>> 0;
      return (oa = f, c - e >>> 0 | 0) | 0;
    }
    function W(c) {
      c |= 0;
      var d = y[Da + (c & 255) >> 0] | 0;
      if (8 > (d | 0)) {
        return d | 0;
      }
      d = y[Da + (c >> 8 & 255) >> 0] | 0;
      if (8 > (d | 0)) {
        return d + 8 | 0;
      }
      d = y[Da + (c >> 16 & 255) >> 0] | 0;
      return 8 > (d | 0) ? d + 16 | 0 : (y[Da + (c >>> 24) >> 0] | 0) + 24 | 0;
    }
    function va(d, l, e, f, g) {
      d |= 0;
      l |= 0;
      e |= 0;
      f |= 0;
      g |= 0;
      var h, m;
      var t = d;
      var p = h = l;
      var ja = e;
      var G = m = f;
      if (!p) {
        var u = 0 != (g | 0);
        if (G) {
          if (!u) {
            return g = m = 0, (oa = m, g) | 0;
          }
          c[g >> 2] = d | 0;
          c[g + 4 >> 2] = l & 0;
          g = m = 0;
        } else {
          u && (c[g >> 2] = (t >>> 0) % (ja >>> 0), c[g + 4 >> 2] = 0), m = 0, g = (t >>> 0) / (ja >>> 0) >>> 0;
        }
        return (oa = m, g) | 0;
      }
      u = 0 == (G | 0);
      do {
        if (ja) {
          if (!u) {
            u = (La(G | 0) | 0) - (La(p | 0) | 0) | 0;
            if (31 >= u >>> 0) {
              var y = u + 1 | 0;
              G = 31 - u | 0;
              l = u - 31 >> 31;
              ja = y;
              d = t >>> (y >>> 0) & l | p << G;
              l &= p >>> (y >>> 0);
              u = 0;
              G = t << G;
              break;
            }
            if (!g) {
              return g = m = 0, (oa = m, g) | 0;
            }
            c[g >> 2] = d | 0;
            c[g + 4 >> 2] = h | l & 0;
            g = m = 0;
            return (oa = m, g) | 0;
          }
          u = ja - 1 | 0;
          if (u & ja | 0) {
            G = (La(ja | 0) | 0) + 33 - (La(p | 0) | 0) | 0;
            var v = 64 - G | 0;
            y = 32 - G | 0;
            h = y >> 31;
            var B = G - 32 | 0;
            l = B >> 31;
            ja = G;
            d = y - 1 >> 31 & p >>> (B >>> 0) | (p << y | t >>> (G >>> 0)) & l;
            l &= p >>> (G >>> 0);
            u = t << v & h;
            G = (p << v | t >>> (B >>> 0)) & h | t << y & G - 33 >> 31;
            break;
          }
          g | 0 && (c[g >> 2] = u & t, c[g + 4 >> 2] = 0);
          1 == (ja | 0) ? (B = h | l & 0, v = d | 0) : (v = W(ja | 0) | 0, B = p >>> (v >>> 0) | 0, v = p << 32 - v | t >>> (v >>> 0) | 0);
        } else {
          if (u) {
            return g | 0 && (c[g >> 2] = (p >>> 0) % (ja >>> 0), c[g + 4 >> 2] = 0), B = 0, v = (p >>> 0) / (ja >>> 0) >>> 0, (oa = B, v) | 0;
          }
          if (!t) {
            return g | 0 && (c[g >> 2] = 0, c[g + 4 >> 2] = (p >>> 0) % (G >>> 0)), B = 0, v = (p >>> 0) / (G >>> 0) >>> 0, (oa = B, v) | 0;
          }
          u = G - 1 | 0;
          if (!(u & G)) {
            return g | 0 && (c[g >> 2] = d | 0, c[g + 4 >> 2] = u & p | l & 0), B = 0, v = p >>> ((W(G | 0) | 0) >>> 0), (oa = B, v) | 0;
          }
          u = (La(G | 0) | 0) - (La(p | 0) | 0) | 0;
          if (30 >= u >>> 0) {
            l = u + 1 | 0;
            G = 31 - u | 0;
            ja = l;
            d = p << G | t >>> (l >>> 0);
            l = p >>> (l >>> 0);
            u = 0;
            G = t << G;
            break;
          }
          if (!g) {
            return v = B = 0, (oa = B, v) | 0;
          }
          c[g >> 2] = d | 0;
          c[g + 4 >> 2] = h | l & 0;
          v = B = 0;
        }
        return (oa = B, v) | 0;
      } while (0);
      if (ja) {
        y = e | 0;
        t = m | f & 0;
        p = Na(y | 0, t | 0, -1, -1) | 0;
        e = oa;
        h = G;
        G = 0;
        do {
          f = h, h = u >>> 31 | h << 1, u = G | u << 1, f = d << 1 | f >>> 31 | 0, m = d >>> 31 | l << 1 | 0, ya(p | 0, e | 0, f | 0, m | 0) | 0, v = oa, B = v >> 31 | (0 > (v | 0) ? -1 : 0) << 1, G = B & 1, d = ya(f | 0, m | 0, B & y | 0, ((0 > (v | 0) ? -1 : 0) >> 31 | (0 > (v | 0) ? -1 : 0) << 1) & t | 0) | 0, l = oa, ja = ja - 1 | 0;
        } while (0 != (ja | 0));
        p = h;
        h = 0;
      } else {
        p = G, G = h = 0;
      }
      ja = 0;
      g | 0 && (c[g >> 2] = d, c[g + 4 >> 2] = l);
      B = (u | 0) >>> 31 | (p | ja) << 1 | (ja << 1 | u >>> 31) & 0 | h;
      v = (u << 1 | 0) & -2 | G;
      return (oa = B, v) | 0;
    }
    function xa(c, d, e, f) {
      c |= 0;
      d |= 0;
      e |= 0;
      f |= 0;
      return va(c, d, e, f, 0) | 0;
    }
    function ua(d, l, e, f) {
      d |= 0;
      l |= 0;
      e |= 0;
      f |= 0;
      var h = T;
      T = T + 16 | 0;
      var g = h | 0;
      va(d, l, e, f, g) | 0;
      T = h;
      return (oa = c[g + 4 >> 2] | 0, c[g >> 2] | 0) | 0;
    }
    function na(c, d, e) {
      c |= 0;
      d |= 0;
      e |= 0;
      if (32 > (e | 0)) {
        return oa = d >>> e, c >>> e | (d & (1 << e) - 1) << 32 - e;
      }
      oa = 0;
      return d >>> e - 32 | 0;
    }
    function U(c, d, e) {
      c |= 0;
      d |= 0;
      e |= 0;
      if (32 > (e | 0)) {
        return oa = d << e | (c & (1 << e) - 1 << 32 - e) >>> 32 - e, c << e;
      }
      oa = c << e - 32;
      return 0;
    }
    function L(c) {
      c |= 0;
      return (c & 255) << 24 | (c >> 8 & 255) << 16 | (c >> 16 & 255) << 8 | c >>> 24 | 0;
    }
    function V(d, e, f) {
      d |= 0;
      e |= 0;
      f |= 0;
      var h;
      if (8192 <= (f | 0)) {
        return Za(d | 0, e | 0, f | 0) | 0;
      }
      var l = d | 0;
      var g = d + f | 0;
      if ((d & 3) == (e & 3)) {
        for (; d & 3;) {
          if (!f) {
            return l | 0;
          }
          y[d >> 0] = y[e >> 0] | 0;
          d = d + 1 | 0;
          e = e + 1 | 0;
          f = f - 1 | 0;
        }
        f = g & -4 | 0;
        for (h = f - 64 | 0; (d | 0) <= (h | 0);) {
          c[d >> 2] = c[e >> 2], c[d + 4 >> 2] = c[e + 4 >> 2], c[d + 8 >> 2] = c[e + 8 >> 2], c[d + 12 >> 2] = c[e + 12 >> 2], c[d + 16 >> 2] = c[e + 16 >> 2], c[d + 20 >> 2] = c[e + 20 >> 2], c[d + 24 >> 2] = c[e + 24 >> 2], c[d + 28 >> 2] = c[e + 28 >> 2], c[d + 32 >> 2] = c[e + 32 >> 2], c[d + 36 >> 2] = c[e + 36 >> 2], c[d + 40 >> 2] = c[e + 40 >> 2], c[d + 44 >> 2] = c[e + 44 >> 2], c[d + 48 >> 2] = c[e + 48 >> 2], c[d + 52 >> 2] = c[e + 52 >> 2], c[d + 56 >> 2] = c[e + 56 >> 2], c[d + 60 >> 
          2] = c[e + 60 >> 2], d = d + 64 | 0, e = e + 64 | 0;
        }
        for (; (d | 0) < (f | 0);) {
          c[d >> 2] = c[e >> 2], d = d + 4 | 0, e = e + 4 | 0;
        }
      } else {
        for (f = g - 4 | 0; (d | 0) < (f | 0);) {
          y[d >> 0] = y[e >> 0] | 0, y[d + 1 >> 0] = y[e + 1 >> 0] | 0, y[d + 2 >> 0] = y[e + 2 >> 0] | 0, y[d + 3 >> 0] = y[e + 3 >> 0] | 0, d = d + 4 | 0, e = e + 4 | 0;
        }
      }
      for (; (d | 0) < (g | 0);) {
        y[d >> 0] = y[e >> 0] | 0, d = d + 1 | 0, e = e + 1 | 0;
      }
      return l | 0;
    }
    function aa(d, e, f) {
      d |= 0;
      e |= 0;
      f |= 0;
      var h;
      var l = d + f | 0;
      e &= 255;
      if (67 <= (f | 0)) {
        for (; d & 3;) {
          y[d >> 0] = e, d = d + 1 | 0;
        }
        var g = l & -4 | 0;
        var m = g - 64 | 0;
        for (h = e | e << 8 | e << 16 | e << 24; (d | 0) <= (m | 0);) {
          c[d >> 2] = h, c[d + 4 >> 2] = h, c[d + 8 >> 2] = h, c[d + 12 >> 2] = h, c[d + 16 >> 2] = h, c[d + 20 >> 2] = h, c[d + 24 >> 2] = h, c[d + 28 >> 2] = h, c[d + 32 >> 2] = h, c[d + 36 >> 2] = h, c[d + 40 >> 2] = h, c[d + 44 >> 2] = h, c[d + 48 >> 2] = h, c[d + 52 >> 2] = h, c[d + 56 >> 2] = h, c[d + 60 >> 2] = h, d = d + 64 | 0;
        }
        for (; (d | 0) < (g | 0);) {
          c[d >> 2] = h, d = d + 4 | 0;
        }
      }
      for (; (d | 0) < (l | 0);) {
        y[d >> 0] = e, d = d + 1 | 0;
      }
      return l - f | 0;
    }
    function ma(d) {
      d |= 0;
      var e = c[Fa >> 2] | 0;
      var h = e + d | 0;
      if (0 < (d | 0) & (h | 0) < (e | 0) | 0 > (h | 0)) {
        return Ma() | 0, Qa(12), -1;
      }
      c[Fa >> 2] = h;
      return (h | 0) > (ab() | 0) && 0 == (Ua() | 0) ? (c[Fa >> 2] = e, Qa(12), -1) : e | 0;
    }
    "use asm";
    var y = new d.Int8Array(g), jb = new d.Int16Array(g), c = new d.Int32Array(g), Ja = new d.Uint8Array(g);
    new d.Uint16Array(g);
    new d.Uint32Array(g);
    new d.Float32Array(g);
    var ra = new d.Float64Array(g), Fa = e.DYNAMICTOP_PTR | 0, za = e.tempDoublePtr | 0, T = e.STACKTOP | 0, Da = e.cttz_i8 | 0, Oa = 0, oa = 0, Ya = d.Math.imul, La = d.Math.clz32, Ia = e.abort, Ua = e.enlargeMemory, ab = e.getTotalMemory, Ma = e.abortOnCannotGrowMemory, Qa = e.___setErrNo, Wa = e.___syscall140, db = e.___syscall146, Sa = e.___syscall54, ob = e.___syscall6, Za = e._emscripten_memcpy_big, eb = [function(c) {
      Ia(0);
      return 0;
    }, function(d) {
      d |= 0;
      var e = T;
      T = T + 16 | 0;
      var h = e >> 2;
      d = c[d + 60 >> 2] | 0;
      d |= 0;
      c[h] = d | 0;
      d = M(ob(6, e | 0) | 0) | 0;
      T = e;
      return d | 0;
    }], bb = [function(c, d, e) {
      Ia(1);
      return 0;
    }, function(d, e, f) {
      d |= 0;
      e |= 0;
      f |= 0;
      var h = T;
      T = T + 32 | 0;
      var l = h;
      c[d + 36 >> 2] = 3;
      0 == (c[d >> 2] & 64 | 0) && (c[l >> 2] = c[d + 60 >> 2], c[l + 4 >> 2] = 21523, c[l + 8 >> 2] = h + 16, Sa(54, l | 0) | 0) && (y[d + 75 >> 0] = -1);
      l = J(d, e, f) | 0;
      T = h;
      return l | 0;
    }, function(d, e, f) {
      d |= 0;
      e |= 0;
      f |= 0;
      var h = T;
      T = T + 32 | 0;
      var l = h + 20 | 0;
      c[h >> 2] = c[d + 60 >> 2];
      c[h + 4 >> 2] = 0;
      c[h + 8 >> 2] = e;
      c[h + 12 >> 2] = l;
      c[h + 16 >> 2] = f;
      d = 0 > (M(Wa(140, h | 0) | 0) | 0) ? c[l >> 2] = -1 : c[l >> 2] | 0;
      T = h;
      return d | 0;
    }, J];
    return {_KangarooTwelve_Final:function(d, e, f, g) {
      d |= 0;
      e |= 0;
      f |= 0;
      g |= 0;
      var h = T;
      T = T + 48 | 0;
      var l = h + 32 | 0;
      var m = d + 440 | 0;
      if (1 != (c[m >> 2] | 0)) {
        return m = 1, T = h, m | 0;
      }
      if (g) {
        if (R(d, f, g) | 0) {
          return m = 1, T = h, m | 0;
        }
        f = 0;
        var t = g;
        do {
          f = f + 1 | 0, t >>>= 8;
        } while (0 != (t | 0) & 4 > f >>> 0);
        t = 1;
        do {
          y[l + (t + -1) >> 0] = g >>> (f - t << 3), t = t + 1 | 0;
        } while (f >>> 0 >= t >>> 0);
      } else {
        f = 0;
      }
      y[l + f >> 0] = f;
      if (R(d, l, f + 1 | 0) | 0) {
        return m = 1, T = h, m | 0;
      }
      t = d + 432 | 0;
      if (f = c[t >> 2] | 0) {
        if (c[d + 436 >> 2] | 0) {
          if (c[t >> 2] = f + 1, 0 == (v(d, 11) | 0) && (w(d, h, 32) | 0, 0 == (p(d + 216 | 0, h, 32) | 0))) {
            f = c[t >> 2] | 0;
          } else {
            return m = 1, T = h, m | 0;
          }
        }
        g = f + -1 | 0;
        if (c[t >> 2] = g) {
          f = 0;
          t = g;
          do {
            f = f + 1 | 0, t >>>= 8;
          } while (0 != (t | 0) & 4 > f >>> 0);
          t = 1;
          do {
            y[l + (t + -1) >> 0] = g >>> (f - t << 3), t = t + 1 | 0;
          } while (f >>> 0 >= t >>> 0);
        } else {
          f = 0;
        }
        y[l + f >> 0] = f;
        y[l + (f + 1) >> 0] = -1;
        y[l + (f + 2) >> 0] = -1;
        t = d + 216 | 0;
        if (p(t, l, f + 3 | 0) | 0) {
          return m = 1, T = h, m | 0;
        }
        f = 6;
      } else {
        f = 7, t = d + 216 | 0;
      }
      if (v(t, f) | 0) {
        return m = 1, T = h, m | 0;
      }
      (f = c[d + 428 >> 2] | 0) ? (c[m >> 2] = 2, w(t, e, f) | 0) : c[m >> 2] = 3;
      m = 0;
      T = h;
      return m | 0;
    }, _KangarooTwelve_Initialize:function(d, e) {
      d |= 0;
      e |= 0;
      c[d + 428 >> 2] = e;
      c[d + 436 >> 2] = 0;
      c[d + 432 >> 2] = 0;
      c[d + 440 >> 2] = 1;
      aa(d + 216 | 0, 0, 200) | 0;
      c[d + 416 >> 2] = 1344;
      c[d + 420 >> 2] = 0;
      return c[d + 424 >> 2] = 0;
    }, _KangarooTwelve_IsAbsorbing:function(d) {
      d |= 0;
      if (!d) {
        return d = 0, d | 0;
      }
      d = 1 == (c[d + 440 >> 2] | 0) & 1;
      return d | 0;
    }, _KangarooTwelve_IsSqueezing:function(d) {
      d |= 0;
      if (!d) {
        return d = 0, d | 0;
      }
      d = 3 == (c[d + 440 >> 2] | 0) & 1;
      return d | 0;
    }, _KangarooTwelve_Squeeze:function(d, e, f) {
      d |= 0;
      e |= 0;
      f |= 0;
      if (3 != (c[d + 440 >> 2] | 0)) {
        return f = 1, f | 0;
      }
      w(d + 216 | 0, e, f) | 0;
      f = 0;
      return f | 0;
    }, _KangarooTwelve_Update:R, _KangarooTwelve_phase:function(d) {
      d |= 0;
      var e = T;
      T = T + 16 | 0;
      var h = e;
      var f = d + 440 | 0;
      c[h >> 2] = c[f >> 2];
      var g = 576, m = h;
      g |= 0;
      m |= 0;
      h = T;
      T = T + 16 | 0;
      c[h >> 2] = m;
      m = c[51] | 0;
      var p = h;
      m |= 0;
      g |= 0;
      p |= 0;
      var t = T;
      T = T + 224 | 0;
      var u = t + 120 | 0;
      var v = t + 80 | 0;
      var J = t + 136 | 0;
      var M = v;
      var R = M + 40 | 0;
      do {
        c[M >> 2] = 0, M = M + 4 | 0;
      } while ((M | 0) < (R | 0));
      c[u >> 2] = c[p >> 2];
      if (0 > (Ca(0, g, u, t, v) | 0)) {
        p = -1;
      } else {
        p = c[m >> 2] | 0;
        var H = p & 32;
        1 > (y[m + 74 >> 0] | 0) && (c[m >> 2] = p & -33);
        M = m + 48 | 0;
        if (c[M >> 2] | 0) {
          p = Ca(m, g, u, t, v) | 0;
        } else {
          R = m + 44 | 0;
          var B = c[R >> 2] | 0;
          c[R >> 2] = J;
          var w = m + 28 | 0;
          c[w >> 2] = J;
          var L = m + 20 | 0;
          c[L >> 2] = J;
          c[M >> 2] = 80;
          var S = m + 16 | 0;
          c[S >> 2] = J + 80;
          p = Ca(m, g, u, t, v) | 0;
          B && (bb[c[m + 36 >> 2] & 3](m, 0, 0) | 0, p = 0 == (c[L >> 2] | 0) ? -1 : p, c[R >> 2] = B, c[M >> 2] = 0, c[S >> 2] = 0, c[w >> 2] = 0, c[L >> 2] = 0);
        }
        M = c[m >> 2] | 0;
        c[m >> 2] = M | H;
        p = 0 == (M & 32 | 0) ? p : -1;
      }
      T = t;
      m = p | 0;
      T = h;
      m | 0;
      if (!d) {
        return h = 0, T = e, h | 0;
      }
      h = c[f >> 2] | 0;
      T = e;
      return h | 0;
    }, _NewKangarooTwelve:function() {
      return H(448) | 0;
    }, ___errno_location:function() {
      return 3572;
    }, ___udivdi3:xa, ___uremdi3:ua, _bitshift64Lshr:na, _bitshift64Shl:U, _free:function(d) {
      d |= 0;
      var e;
      if (d) {
        var f = d + -8 | 0;
        var h = c[757] | 0;
        d = c[d + -4 >> 2] | 0;
        var g = d & -8;
        var m = f + g | 0;
        do {
          if (d & 1) {
            var p = e = f;
          } else {
            var t = c[f >> 2] | 0;
            if (!(d & 3)) {
              return;
            }
            p = f + (0 - t) | 0;
            var u = t + g | 0;
            if (p >>> 0 < h >>> 0) {
              return;
            }
            if ((c[758] | 0) == (p | 0)) {
              d = m + 4 | 0;
              g = c[d >> 2] | 0;
              if (3 != (g & 3 | 0)) {
                e = p;
                g = u;
                break;
              }
              c[755] = u;
              c[d >> 2] = g & -2;
              c[p + 4 >> 2] = u | 1;
              c[p + u >> 2] = u;
              return;
            }
            f = t >>> 3;
            if (256 > t >>> 0) {
              d = c[p + 8 >> 2] | 0, g = c[p + 12 >> 2] | 0, (g | 0) == (d | 0) ? c[753] &= ~(1 << f) : (c[d + 12 >> 2] = g, c[g + 8 >> 2] = d);
            } else {
              h = c[p + 24 >> 2] | 0;
              d = c[p + 12 >> 2] | 0;
              do {
                if ((d | 0) == (p | 0)) {
                  f = p + 16 | 0;
                  g = f + 4 | 0;
                  d = c[g >> 2] | 0;
                  if (!d) {
                    if (d = c[f >> 2] | 0) {
                      g = f;
                    } else {
                      d = 0;
                      break;
                    }
                  }
                  for (;;) {
                    if (f = d + 20 | 0, t = c[f >> 2] | 0, t | 0) {
                      d = t, g = f;
                    } else {
                      if (f = d + 16 | 0, t = c[f >> 2] | 0) {
                        d = t, g = f;
                      } else {
                        break;
                      }
                    }
                  }
                  c[g >> 2] = 0;
                } else {
                  e = c[p + 8 >> 2] | 0, c[e + 12 >> 2] = d, c[d + 8 >> 2] = e;
                }
              } while (0);
              if (h) {
                g = c[p + 28 >> 2] | 0;
                f = 3316 + (g << 2) | 0;
                if ((c[f >> 2] | 0) == (p | 0)) {
                  if (c[f >> 2] = d, !d) {
                    c[754] &= ~(1 << g);
                    e = p;
                    g = u;
                    break;
                  }
                } else {
                  if (c[h + 16 + (((c[h + 16 >> 2] | 0) != (p | 0) & 1) << 2) >> 2] = d, !d) {
                    e = p;
                    g = u;
                    break;
                  }
                }
                c[d + 24 >> 2] = h;
                g = p + 16 | 0;
                f = c[g >> 2] | 0;
                f | 0 && (c[d + 16 >> 2] = f, c[f + 24 >> 2] = d);
                if (g = c[g + 4 >> 2] | 0) {
                  c[d + 20 >> 2] = g, c[g + 24 >> 2] = d;
                }
              }
            }
            e = p;
            g = u;
          }
        } while (0);
        if (!(p >>> 0 >= m >>> 0) && (d = m + 4 | 0, t = c[d >> 2] | 0, t & 1)) {
          if (t & 2) {
            c[d >> 2] = t & -2, c[e + 4 >> 2] = g | 1, h = c[p + g >> 2] = g;
          } else {
            if ((c[759] | 0) == (m | 0)) {
              m = (c[756] | 0) + g | 0;
              c[756] = m;
              c[759] = e;
              c[e + 4 >> 2] = m | 1;
              if ((e | 0) != (c[758] | 0)) {
                return;
              }
              c[758] = 0;
              c[755] = 0;
              return;
            }
            if ((c[758] | 0) == (m | 0)) {
              m = (c[755] | 0) + g | 0;
              c[755] = m;
              c[758] = p;
              c[e + 4 >> 2] = m | 1;
              c[p + m >> 2] = m;
              return;
            }
            h = (t & -8) + g | 0;
            f = t >>> 3;
            do {
              if (256 > t >>> 0) {
                g = c[m + 8 >> 2] | 0, d = c[m + 12 >> 2] | 0, (d | 0) == (g | 0) ? c[753] &= ~(1 << f) : (c[g + 12 >> 2] = d, c[d + 8 >> 2] = g);
              } else {
                u = c[m + 24 >> 2] | 0;
                d = c[m + 12 >> 2] | 0;
                do {
                  if ((d | 0) == (m | 0)) {
                    f = m + 16 | 0;
                    g = f + 4 | 0;
                    d = c[g >> 2] | 0;
                    if (!d) {
                      if (d = c[f >> 2] | 0) {
                        g = f;
                      } else {
                        f = 0;
                        break;
                      }
                    }
                    for (;;) {
                      if (f = d + 20 | 0, t = c[f >> 2] | 0, t | 0) {
                        d = t, g = f;
                      } else {
                        if (f = d + 16 | 0, t = c[f >> 2] | 0) {
                          d = t, g = f;
                        } else {
                          break;
                        }
                      }
                    }
                    c[g >> 2] = 0;
                  } else {
                    f = c[m + 8 >> 2] | 0, c[f + 12 >> 2] = d, c[d + 8 >> 2] = f;
                  }
                  f = d;
                } while (0);
                if (u | 0) {
                  d = c[m + 28 >> 2] | 0;
                  g = 3316 + (d << 2) | 0;
                  if ((c[g >> 2] | 0) == (m | 0)) {
                    if (c[g >> 2] = f, !f) {
                      c[754] &= ~(1 << d);
                      break;
                    }
                  } else {
                    if (c[u + 16 + (((c[u + 16 >> 2] | 0) != (m | 0) & 1) << 2) >> 2] = f, !f) {
                      break;
                    }
                  }
                  c[f + 24 >> 2] = u;
                  d = m + 16 | 0;
                  g = c[d >> 2] | 0;
                  g | 0 && (c[f + 16 >> 2] = g, c[g + 24 >> 2] = f);
                  d = c[d + 4 >> 2] | 0;
                  d | 0 && (c[f + 20 >> 2] = d, c[d + 24 >> 2] = f);
                }
              }
            } while (0);
            c[e + 4 >> 2] = h | 1;
            c[p + h >> 2] = h;
            if ((e | 0) == (c[758] | 0)) {
              c[755] = h;
              return;
            }
          }
          d = h >>> 3;
          if (256 > h >>> 0) {
            f = 3052 + (d << 1 << 2) | 0, g = c[753] | 0, d = 1 << d, g & d ? (g = f + 8 | 0, d = c[g >> 2] | 0) : (c[753] = g | d, d = f, g = f + 8 | 0), c[g >> 2] = e, c[d + 12 >> 2] = e, c[e + 8 >> 2] = d, c[e + 12 >> 2] = f;
          } else {
            (d = h >>> 8) ? 16777215 < h >>> 0 ? d = 31 : (p = (d + 1048320 | 0) >>> 16 & 8, m = d << p, u = (m + 520192 | 0) >>> 16 & 4, m <<= u, d = (m + 245760 | 0) >>> 16 & 2, d = 14 - (u | p | d) + (m << d >>> 15) | 0, d = h >>> (d + 7 | 0) & 1 | d << 1) : d = 0;
            t = 3316 + (d << 2) | 0;
            c[e + 28 >> 2] = d;
            c[e + 20 >> 2] = 0;
            c[e + 16 >> 2] = 0;
            g = c[754] | 0;
            f = 1 << d;
            do {
              if (g & f) {
                g = h << (31 == (d | 0) ? 0 : 25 - (d >>> 1) | 0);
                for (f = c[t >> 2] | 0;;) {
                  if ((c[f + 4 >> 2] & -8 | 0) == (h | 0)) {
                    d = 73;
                    break;
                  }
                  t = f + 16 + (g >>> 31 << 2) | 0;
                  if (d = c[t >> 2] | 0) {
                    g <<= 1, f = d;
                  } else {
                    d = 72;
                    break;
                  }
                }
                72 == (d | 0) ? (c[t >> 2] = e, c[e + 24 >> 2] = f, c[e + 12 >> 2] = e, c[e + 8 >> 2] = e) : 73 == (d | 0) && (p = f + 8 | 0, m = c[p >> 2] | 0, c[m + 12 >> 2] = e, c[p >> 2] = e, c[e + 8 >> 2] = m, c[e + 12 >> 2] = f, c[e + 24 >> 2] = 0);
              } else {
                c[754] = g | f, c[t >> 2] = e, c[e + 24 >> 2] = t, c[e + 12 >> 2] = e, c[e + 8 >> 2] = e;
              }
            } while (0);
            m = (c[761] | 0) + -1 | 0;
            c[761] = m;
            if (!m) {
              for (d = 3468;;) {
                if (d = c[d >> 2] | 0) {
                  d = d + 8 | 0;
                } else {
                  break;
                }
              }
              c[761] = -1;
            }
          }
        }
      }
    }, _i64Add:Na, _i64Subtract:ya, _llvm_bswap_i32:L, _malloc:H, _memcpy:V, _memset:aa, _sbrk:ma, dynCall_ii:function(c, d) {
      c |= 0;
      d |= 0;
      return eb[c & 1](d | 0) | 0;
    }, dynCall_iiii:function(c, d, e, f) {
      c |= 0;
      d |= 0;
      e |= 0;
      f |= 0;
      return bb[c & 3](d | 0, e | 0, f | 0) | 0;
    }, establishStackSpace:function(c, d) {
      T = c |= 0;
    }, getTempRet0:function() {
      return oa | 0;
    }, runPostSets:function() {
    }, setTempRet0:function(c) {
      oa = c |= 0;
    }, setThrew:function(c, d) {
      c |= 0;
      Oa || (Oa = c);
    }, stackAlloc:function(c) {
      c |= 0;
      var d = T;
      T = T + c | 0;
      T = T + 15 & -16;
      return d | 0;
    }, stackRestore:function(c) {
      T = c |= 0;
    }, stackSave:function() {
      return T | 0;
    }};
  }(m.asmGlobalArg, m.asmLibraryArg, da);
  m._KangarooTwelve_Final = da._KangarooTwelve_Final;
  m._KangarooTwelve_Initialize = da._KangarooTwelve_Initialize;
  m._KangarooTwelve_IsAbsorbing = da._KangarooTwelve_IsAbsorbing;
  m._KangarooTwelve_IsSqueezing = da._KangarooTwelve_IsSqueezing;
  m._KangarooTwelve_Squeeze = da._KangarooTwelve_Squeeze;
  m._KangarooTwelve_Update = da._KangarooTwelve_Update;
  m._KangarooTwelve_phase = da._KangarooTwelve_phase;
  m._NewKangarooTwelve = da._NewKangarooTwelve;
  m.___errno_location = da.___errno_location;
  m.___udivdi3 = da.___udivdi3;
  m.___uremdi3 = da.___uremdi3;
  m._bitshift64Lshr = da._bitshift64Lshr;
  m._bitshift64Shl = da._bitshift64Shl;
  m._free = da._free;
  m._i64Add = da._i64Add;
  m._i64Subtract = da._i64Subtract;
  m._llvm_bswap_i32 = da._llvm_bswap_i32;
  var Sa = m._malloc = da._malloc;
  m._memcpy = da._memcpy;
  m._memset = da._memset;
  m._sbrk = da._sbrk;
  m.establishStackSpace = da.establishStackSpace;
  m.getTempRet0 = da.getTempRet0;
  m.runPostSets = da.runPostSets;
  m.setTempRet0 = da.setTempRet0;
  m.setThrew = da.setThrew;
  var cb = m.stackAlloc = da.stackAlloc;
  m.stackRestore = da.stackRestore;
  m.stackSave = da.stackSave;
  m.dynCall_ii = da.dynCall_ii;
  m.dynCall_iiii = da.dynCall_iiii;
  m.asm = da;
  m.stringToUTF8 = function(d, e, f) {
    var g = pa;
    if (0 < f) {
      var m = e;
      f = e + f - 1;
      for (var p = 0; p < d.length; ++p) {
        var u = d.charCodeAt(p);
        55296 <= u && 57343 >= u && (u = 65536 + ((u & 1023) << 10) | d.charCodeAt(++p) & 1023);
        if (127 >= u) {
          if (e >= f) {
            break;
          }
          g[e++] = u;
        } else {
          if (2047 >= u) {
            if (e + 1 >= f) {
              break;
            }
            g[e++] = 192 | u >> 6;
          } else {
            if (65535 >= u) {
              if (e + 2 >= f) {
                break;
              }
              g[e++] = 224 | u >> 12;
            } else {
              if (2097151 >= u) {
                if (e + 3 >= f) {
                  break;
                }
                g[e++] = 240 | u >> 18;
              } else {
                if (67108863 >= u) {
                  if (e + 4 >= f) {
                    break;
                  }
                  g[e++] = 248 | u >> 24;
                } else {
                  if (e + 5 >= f) {
                    break;
                  }
                  g[e++] = 252 | u >> 30;
                  g[e++] = 128 | u >> 24 & 63;
                }
                g[e++] = 128 | u >> 18 & 63;
              }
              g[e++] = 128 | u >> 12 & 63;
            }
            g[e++] = 128 | u >> 6 & 63;
          }
          g[e++] = 128 | u & 63;
        }
      }
      g[e] = 0;
      d = e - m;
    } else {
      d = 0;
    }
    return d;
  };
  if (Qa) {
    if (la(Qa) || ("function" === typeof m.locateFile ? Qa = m.locateFile(Qa) : m.memoryInitializerPrefixURL && (Qa = m.memoryInitializerPrefixURL + Qa)), d || S) {
      S = m.readBinary(Qa), pa.set(S, 8);
    } else {
      var mb = function() {
        m.readAsync(Qa, M, function() {
          throw "could not load memory initializer " + Qa;
        });
      };
      Ma++;
      m.monitorRunDependencies && m.monitorRunDependencies(Ma);
      var M = function(d) {
        d.byteLength && (d = new Uint8Array(d));
        pa.set(d, 8);
        m.memoryInitializerRequest && delete m.memoryInitializerRequest.response;
        Ma--;
        m.monitorRunDependencies && m.monitorRunDependencies(Ma);
        0 == Ma && (null !== lb && (clearInterval(lb), lb = null), fb && (d = fb, fb = null, d()));
      };
      (S = xa(Qa)) ? M(S.buffer) : m.memoryInitializerRequest ? (S = function() {
        var d = m.memoryInitializerRequest, e = d.response;
        if (200 !== d.status && 0 !== d.status) {
          if (e = xa(m.memoryInitializerRequestURL)) {
            e = e.buffer;
          } else {
            console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + d.status + ", retrying " + Qa);
            mb();
            return;
          }
        }
        M(e);
      }, m.memoryInitializerRequest.response ? setTimeout(S, 0) : m.memoryInitializerRequest.addEventListener("load", S)) : mb();
    }
  }
  V.prototype = Error();
  V.prototype.constructor = V;
  fb = function Ca() {
    m.calledRun || ua();
    m.calledRun || (fb = Ca);
  };
  m.run = ua;
  m.exit = function(e, f) {
    if (!f || !m.noExitRuntime || 0 !== e) {
      if (!m.noExitRuntime && (ma = !0, gb = void 0, Y(Ia), m.onExit)) {
        m.onExit(e);
      }
      d && process.exit(e);
      m.quit(e, new V(e));
    }
  };
  m.abort = Ja;
  if (m.preInit) {
    for ("function" == typeof m.preInit && (m.preInit = [m.preInit]); 0 < m.preInit.length;) {
      m.preInit.pop()();
    }
  }
  m.noExitRuntime = !0;
  ua();
  return k12Module.exports;
}(k12Module);
function KangarooTwelve() {
  const e = {k:0, keybuf:0, keybuflen:0, buf:0, bufMaps:new WeakMap, outbuf:0, realBuf:null};
  var g = {init() {
    k12._KangarooTwelve_Initialize(e.k, 0);
  }, drop() {
    k12._free(e.keybuf);
    k12._free(e.buf);
    k12._free(e.k);
  }, update(f) {
    f.length > e.keybuflen && (e.keybuf && k12._free(e.keybuf), e.keybuflen = f.length + 1, e.keybuf = k12._malloc(f.length + 1));
    if ("string" === typeof f) {
      k12.stringToUTF8(f, e.keybuf, 3 * f.length + 1);
    } else {
      if (f instanceof Uint32Array) {
        var g = new Uint32Array(k12.HEAPU32.buffer, e.keybuf, f.length);
        var v = 4 * f.length;
        for (var w = 0; w < f.length; w++) {
          g[w] = f[w];
        }
      } else {
        if (f instanceof Uint8Array) {
          for (g = new Uint8Array(k12.HEAPU8.buffer, e.keybuf, f.length), v = f.length, w = 0; w < f.length; w++) {
            g[w] = f[w];
          }
        }
      }
    }
    new Uint8Array(k12.HEAPU8.buffer, e.keybuf, v);
    k12._KangarooTwelve_Update(e.k, e.keybuf, v);
  }, final() {
    k12._KangarooTwelve_Final(e.k, 0, 0, 0);
  }, squeeze(f) {
    k12._KangarooTwelve_Squeeze(e.k, e.outbuf, f);
    return e.realBuf;
  }, release(e) {
  }, absorbing:null, squeezing:null, clone() {
  }, copy(e) {
  }, phase() {
    return k12._KangarooTwelve_phase(e.k);
  }};
  e.k = k12._NewKangarooTwelve();
  e.outbuf = k12._malloc(64);
  e.realBuf = new Uint8Array(k12.HEAPU8.buffer, e.outbuf, 64);
  g.absorbing = k12._KangarooTwelve_IsAbsorbing.bind(k12, e.k);
  g.squeezing = k12._KangarooTwelve_IsSqueezing.bind(k12, e.k);
  g.init();
  return g;
}
function BlockShuffle_ByteShuffler(e) {
  var g = {map:[], dmap:[]}, f;
  for (f = 0; 256 > f; f++) {
    g.map[f] = f;
  }
  for (f = 0; 256 > f; f++) {
    var p = e.getByte();
    var v = g.map[p];
    g.map[p] = g.map[f];
    g.map[f] = v;
  }
  for (f = 0; 256 > f; f++) {
    g.dmap[g.map[f]] = f;
  }
  return g;
}
function BlockShuffle_SubByte(e, g) {
  return e.map[g];
}
function BlockShuffle_BusByte(e, g) {
  return e.dmap[g];
}
function BlockShuffle_SubBytes(e, g, f, p, v) {
  const w = e.map;
  for (e = 0; e < v; e++) {
    f[p + e] = w[g[p + e]];
  }
}
function BlockShuffle_BusBytes(e, g, f, p, v) {
  const w = e.dmap;
  for (e = 0; e < v; e++) {
    f[p + e] = w[g[p + e]];
  }
}
const RNGHASH = 256, localCiphers = [];
function SRG_XSWS_encryptData(e, g, f) {
  function p(e, f, g, p, v, H) {
    var w, L = v / 4;
    for (w = 0; w < L; w++) {
      f[w] ^= H[w % (RNGHASH / 32)];
    }
    BlockShuffle_SubBytes(e, g, g, p, v);
    f = 85;
    for (w = 0; w < v; w++) {
      f = g[w] ^= f;
    }
    BlockShuffle_SubBytes(e, g, g, p, v);
    f = 170;
    for (w = v - 1; 0 <= w; w--) {
      f = g[w] ^= f;
    }
    BlockShuffle_SubBytes(e, g, g, p, v);
  }
  if (e.buffer.byteLength & 7) {
    throw Error("buffer to encode must be a multiple of 64 bits; (should also include last byte of padding specification)");
  }
  var v = localCiphers.pop();
  v || (v = exports.SaltyRNG(null, {mode:1}), v.initialEntropy = null);
  v.reset();
  v.feed(g);
  v.feed(f);
  g = new Uint32Array(v.getBuffer(RNGHASH));
  f = BlockShuffle_ByteShuffler(v);
  for (var w = 4 * e.length, H = new Uint8Array(e.buffer), U = 0; U < w; U += 4096) {
    var L = w - U;
    4096 < L ? p(f, e, H, U, 4096, g) : p(f, e, H, U, L, g);
  }
  localCiphers.push(v);
  return H;
}
function SRG_XSWS_encryptString(e, g, f) {
  var p = new Uint32Array(2);
  p[0] = g & 4294967295;
  p[1] = g / 4294967296 & 4294967295;
  e = myTextEncoder(e);
  e = new Uint32Array(e.buffer);
  return SRG_XSWS_encryptData(e, p, f);
}
function SRG_XSWS_decryptData(e, g, f) {
  function p(e, f, g, p, v, w, m) {
    BlockShuffle_BusBytes(e, f, w, g, p);
    for (f = 0; f < p - 1; f++) {
      w[g + f] ^= w[g + f + 1];
    }
    w[g + f] = v[g + f] ^ 170;
    BlockShuffle_BusBytes(e, w, w, g, p);
    for (f = p - 1; 0 < f; f--) {
      w[g + f] ^= w[g + f - 1];
    }
    w[g + 0] ^= 85;
    BlockShuffle_BusBytes(e, w, w, g, p);
    e = p / 4;
    for (f = 0; f < e; f++) {
      v[g + f] ^= m[f % (RNGHASH / 32)];
    }
  }
  var v = localCiphers.pop();
  v || (v = exports.SaltyRNG(null, {mode:1}), v.initialEntropy = null);
  v.reset();
  v.feed(g);
  v.feed(f);
  g = new Uint32Array(v.getBuffer(RNGHASH));
  f = BlockShuffle_ByteShuffler(v);
  for (var w = new Uint32Array(e.length), H = new Uint8Array(w.buffer), U = new Uint8Array(e.buffer), L = e.buffer.byteLength, Y = 0; Y < L; Y += 4096) {
    var la = L - Y;
    4096 < la ? p(f, U, Y, 4096, w, H, g) : p(f, U, Y, la, w, H, g);
  }
  w = new Uint8Array(H, 0, w.length - w[0] + e.buffer.length - 1);
  localCiphers.push(v);
  return w;
}
function SRG_XSWS_decryptString(e, g, f) {
  var p = new Uint32Array(2);
  p[0] = g & 4294967295;
  p[1] = g / 4294967296 & 4294967295;
  e = SRG_XSWS_decryptData(e, p, f);
  return myTextDecoder(e);
}
function myTextEncoder(e) {
  e = [...e];
  for (var g = 0, f = 0; f < e.length; f++) {
    var p = e[f].codePointAt(0);
    128 > p ? g++ : 2048 > p ? g += 2 : 65536 > p ? g += 3 : 1114112 > p && (g += 4);
  }
  g += 2;
  var v = new Uint8Array(g + (g & 7 ? 8 - (g & 7) : 0));
  for (f = g = 0; f < e.length; f++) {
    p = e[f].codePointAt(0), 128 > p ? v[g++] = p : 2048 > p ? (v[g++] = (p & 1984) >> 6 | 192, v[g++] = p & 63 | 128) : 65536 > p ? (v[g++] = (p & 61440) >> 12 | 224, v[g++] = (p & 4032) >> 6 | 128, v[g++] = p & 63 | 128) : 1114112 > p && (v[g++] = (p & 1835008) >> 18 | 240, v[g++] = (p & 258048) >> 12 | 224, v[g++] = (p & 4032) >> 6 | 128, v[g++] = p & 63 | 128);
  }
  v[g] = 255;
  v[v.length - 1] = v.length - g;
  return v;
}
function myTextDecoder(e) {
  for (var g = "", f = 0; f < e.length && 255 !== e[f]; f++) {
    0 == (e[f] & 128) ? g += String.fromCodePoint(e[f]) : 128 != (e[f] & 192) && (192 == (e[f] & 224) ? (g += String.fromCodePoint((e[f] & 31) << 6 | e[f + 1] & 63), f++) : 224 == (e[f] & 240) ? (g += String.fromCodePoint((e[f] & 15) << 12 | (e[f + 1] & 63) << 6 | e[f + 2] & 63), f += 2) : 240 == (e[f] & 248) ? (g += String.fromCodePoint((e[f] & 7) << 18 | (e[f + 1] & 63) << 12 | (e[f + 2] & 63) << 6 | e[f + 3] & 63), f += 3) : 248 == (e[f] & 252) && (g += String.fromCodePoint((e[f] & 3) << 24 | 
    (e[f + 1] & 63) << 18 | (e[f + 2] & 63) << 12 | (e[f + 3] & 63) << 6 | e[f + 4] & 63), f += 4));
  }
  return g;
}
function GetCurrentTick() {
  var e = new Date, g = 256 * e.getTime();
  return g |= -e.getTimezoneOffset() / 15 & 255;
}
function TickToTime(e) {
}
exports.SRG_XSWS_encryptString = SRG_XSWS_encryptString;
exports.SRG_XSWS_decryptString = SRG_XSWS_decryptString;
exports.SRG_XSWS_encryptData = SRG_XSWS_encryptData;
exports.SRG_XSWS_decryptData = SRG_XSWS_decryptData;
exports.TickToTime = TickToTime;
exports.GetCurrentTick = GetCurrentTick;
if ("undefined" === typeof module) {
  var module = {exports:exports || this};
  exports = module.exports;
}
const u8_encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_", u8xor_code_encodings2 = new Uint8Array(8192);
for (let e = 0; 64 > e; e++) {
  for (let g = 0; g < u8_encodings.length; g++) {
    u8xor_code_encodings2[(e << 7) + u8_encodings.codePointAt(g)] = e ^ g;
  }
}
function node_u8xor(e, g) {
  e = Buffer.from(e, "utf8");
  g.keybuf || (g.keybuf = Buffer.from(g.key, "utf8"));
  let f = g.keybuf, p = new Buffer(e.length), v = g.step;
  g.step += e.length;
  let w = g.key.length - 5;
  g.step %= w;
  g = 63;
  let H = 0;
  for (var U = 0; U < e.length; U++) {
    let L = e[U], Y = g;
    if (0 == (L & 128)) {
      if (H) {
        throw Error("short utf8 sequence found");
      }
      g = Y = 63;
    } else {
      if (128 == (L & 192)) {
        if (!H) {
          throw Error("invalid utf8 sequence");
        }
        H--;
        g = 63;
      } else {
        if (192 == (L & 224)) {
          if (H) {
            throw Error("short utf8 sequence found");
          }
          Y = H = 1;
          g = 63;
        } else {
          if (224 == (L & 240)) {
            if (H) {
              throw Error("short utf8 sequence found");
            }
            H = 2;
            Y = 0;
            g = 31;
          } else {
            if (240 == (L & 248)) {
              if (H) {
                throw Error("short utf8 sequence found");
              }
              H = 3;
              Y = 0;
              g = 15;
            } else {
              if (248 == (L & 252)) {
                if (H) {
                  throw Error("short utf8 sequence found");
                }
                H = 4;
                Y = 0;
                g = 7;
              } else {
                if (252 == (L & 254)) {
                  if (H) {
                    throw Error("short utf8 sequence found");
                  }
                  H = 5;
                  Y = 0;
                  g = 3;
                }
              }
            }
          }
        }
      }
    }
    p[U] = Y ? L & ~Y | u8xor_code_encodings2[((L & Y) << 7) + f[(U + v) % w]] & Y : L;
  }
  return p.toString("utf8");
}
exports.u8xor = u8xor;
function u8xor(e, g) {
  e = TE.encode(e);
  g.keybuf || (g.keybuf = TE.encode(g.key));
  let f = g.keybuf;
  var p = new Uint8Array(e.length), v = g.step;
  g.step += e.length;
  var w = g.key.length - 5;
  g.step %= w;
  g = 63;
  let H = 0;
  for (let U = 0; U < e.length; U++) {
    let L = e[U], Y = g;
    if (0 == (L & 128)) {
      if (H) {
        throw Error("short utf8 sequence found");
      }
      g = Y = 63;
    } else {
      if (128 == (L & 192)) {
        if (!H) {
          throw Error("invalid utf8 sequence");
        }
        H--;
        g = 63;
      } else {
        if (192 == (L & 224)) {
          if (H) {
            throw Error("short utf8 sequence found");
          }
          Y = H = 1;
          g = 63;
        } else {
          if (224 == (L & 240)) {
            if (H) {
              throw Error("short utf8 sequence found");
            }
            H = 2;
            Y = 0;
            g = 31;
          } else {
            if (240 == (L & 248)) {
              if (H) {
                throw Error("short utf8 sequence found");
              }
              H = 3;
              Y = 0;
              g = 15;
            } else {
              if (248 == (L & 252)) {
                if (H) {
                  throw Error("short utf8 sequence found");
                }
                H = 4;
                Y = 0;
                g = 7;
              } else {
                if (252 == (L & 254)) {
                  if (H) {
                    throw Error("short utf8 sequence found");
                  }
                  H = 5;
                  Y = 0;
                  g = 3;
                }
              }
            }
          }
        }
      }
    }
    p[U] = Y ? L & ~Y | u8xor_code_encodings2[((L & Y) << 7) + f[(U + v) % w]] & Y : L;
  }
  return TD.decode(p);
}
Object.freeze(u8xor);
var TD, TE;
"undefined" === typeof TextDecoder ? (myTextDecoder = function() {
  this.decode = function(e) {
    for (var g = "", f = 0; f < e.length; f++) {
      0 == (e[f] & 128) ? g += String.fromCodePoint(e[f]) : 128 != (e[f] & 192) && (192 == (e[f] & 224) ? (g += String.fromCodePoint((e[f] & 31) << 6 | e[f + 1] & 63), f++) : 224 == (e[f] & 240) ? (g += String.fromCodePoint((e[f] & 15) << 12 | (e[f + 1] & 63) << 6 | e[f + 2] & 63), f += 2) : 240 == (e[f] & 248) ? (g += String.fromCodePoint((e[f] & 7) << 18 | (e[f + 1] & 63) << 12 | (e[f + 2] & 63) << 6 | e[f + 3] & 63), f += 3) : 248 == (e[f] & 252) && (g += String.fromCodePoint((e[f] & 3) << 24 | 
      (e[f + 1] & 63) << 18 | (e[f + 2] & 63) << 12 | (e[f + 3] & 63) << 6 | e[f + 4] & 63), f += 4));
    }
    return g;
  };
}, myTextEncoder = function() {
  this.encode = function(e) {
    e = [...e];
    for (var g = 0, f = 0; f < e.length; f++) {
      var p = e[f].codePointAt(0);
      128 > p ? g++ : 2048 > p ? g += 2 : 65536 > p ? g += 3 : 1114112 > p && (g += 4);
    }
    var v = new Uint8Array(g);
    for (f = g = 0; f < e.length; f++) {
      p = e[f].codePointAt(0), 128 > p ? v[g++] = p : 2048 > p ? (v[g++] = (p & 1984) >> 6 | 192, v[g++] = p & 63 | 128) : 65536 > p ? (v[g++] = (p & 61440) >> 12 | 224, v[g++] = (p & 4032) >> 6 | 128, v[g++] = p & 63 | 128) : 1114112 > p && (v[g++] = (p & 1835008) >> 18 | 240, v[g++] = (p & 258048) >> 12 | 224, v[g++] = (p & 4032) >> 6 | 128, v[g++] = p & 63 | 128);
    }
    return v;
  };
}, TD = new myTextDecoder, TE = new myTextEncoder) : (TD = new TextDecoder, TE = new TextEncoder);
var RNG, RNG2, SaltyRNG = exports.SaltyRNG;
if (SaltyRNG) {
  RNG = SaltyRNG((e) => e.push(Date.now()));
  RNG2 = SaltyRNG(getSalt2);
  var idGen = {};
  exports = idGen;
} else {
  var sack = global.sack;
  sack || (sack = require("sack-gui"));
  RNG = sack.SaltyRNG((e) => e.push(Date.now()));
  RNG2 = sack.SaltyRNG(getSalt2);
}
var salt = null;
function getSalt2(e) {
  salt && (e.push(salt), salt = null);
}
exports.generator = function() {
  return base64ArrayBuffer(RNG.getBuffer(256));
};
exports.short_generator = function() {
  var e = RNG.getBuffer(96), g = Date.now() / 1000 | 0;
  e[0] = (g & 16711680) >> 16;
  e[1] = (g & 65280) >> 8;
  e[2] = g & 255;
  return base64ArrayBuffer(e);
};
exports.regenerator = function(e) {
  salt = e;
  RNG2.reset();
  return base64ArrayBuffer(RNG2.getBuffer(256));
};
exports.u16generator = function() {
  for (var e = [], g = 0; 25 > g; g++) {
    var f = RNG.getBits(10);
    32 > f && (f |= 64);
    e[g] = String.fromCodePoint(f);
  }
  return e.join("");
};
const encodings = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$_";
for (var u8 = "", x = 0; 256 > x; x++) {
  u8 += String.fromCharCode(x);
}
function base64ArrayBuffer(e) {
  var g = "";
  e = new Uint8Array(e);
  var f = e.byteLength, p = f % 3;
  f -= p;
  for (var v, w, H, U, L = 0; L < f; L += 3) {
    U = e[L] << 16 | e[L + 1] << 8 | e[L + 2], v = (U & 16515072) >> 18, w = (U & 258048) >> 12, H = (U & 4032) >> 6, U &= 63, g += encodings[v] + encodings[w] + encodings[H] + encodings[U];
  }
  1 == p ? (U = e[f], v = (U & 252) >> 2, w = (U & 3) << 4, g += encodings[v] + encodings[w] + "==") : 2 == p && (U = e[f] << 8 | e[f + 1], v = (U & 64512) >> 10, w = (U & 1008) >> 4, H = (U & 15) << 2, g += encodings[v] + encodings[w] + encodings[H] + "=");
  return g;
}
for (var xor_code_encodings = {}, a = 0; a < encodings.length; a++) {
  for (var r = xor_code_encodings[encodings[a]] = {}, b = 0; b < encodings.length; b++) {
    r[encodings[b]] = encodings[a ^ b];
  }
}
xor_code_encodings["="] = {"=":"="};
function xor(e, g) {
  for (var f = "", p = 0; p < e.length; p++) {
    f += xor_code_encodings[e[p]][g[p]];
  }
  return f;
}
exports.xor = xor;
function dexor(e, g, f, p) {
  var v = "", w = (f - 1) * (e.length / p | 0);
  f = e.length / p * f | 0;
  for (p = 0; p < w; p++) {
    v += e[p];
  }
  for (; p < f; p++) {
    v += xor_code_encodings[e[p]][g[p]];
  }
  for (; p < f; p++) {
    v += e[p];
  }
  return v;
}
exports.dexor = dexor;
exports.u8xor = exports.u8xor;
function txor(e, g) {
  const f = [...g].map((e) => e.codePointAt(0)), p = f.length;
  return [...e].map((e, g) => String.fromCodePoint(e.codePointAt(0) ^ f[g % p])).join("");
}
exports.u16xor = txor;
function makeXKey(e, g) {
  return {key:e, keybuf:e ? toUTF8Array(e) : null, step:g ? g : 0, setKey(e, g) {
    this.key = e;
    this.keybuf = toUTF8Array(e);
    this.step = g ? g : 0;
  }};
}
function makeU16Key() {
  return exports.u16generator();
}
exports.xkey = makeXKey;
exports.ukey = makeU16Key;
var JSOX = {};
exports = exports || {};
exports.JSOX = JSOX;
function privateizeEverything() {
  function e() {
    var e = L.pop();
    e || (e = {context:0, current_class:null, current_class_field:0, arrayType:-1, elements:null, element_array:null});
    return e;
  }
  function g() {
    var e = Y.pop();
    e ? e.n = 0 : e = {buf:null, n:0};
    return e;
  }
  function f(e) {
    var f = "";
    e = new Uint8Array(e);
    var d = e.byteLength, g = d % 3;
    d -= g;
    for (var m, p, v, u, w = 0; w < d; w += 3) {
      u = e[w] << 16 | e[w + 1] << 8 | e[w + 2], m = (u & 16515072) >> 18, p = (u & 258048) >> 12, v = (u & 4032) >> 6, u &= 63, f += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[m] + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[p] + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[v] + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[u];
    }
    1 == g ? (u = e[d], m = (u & 252) >> 2, p = (u & 3) << 4, f += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[m] + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[p] + "==") : 2 == g && (u = e[d] << 8 | e[d + 1], m = (u & 64512) >> 10, p = (u & 1008) >> 4, v = (u & 15) << 2, f += "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[m] + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[p] + "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[v] + 
    "=");
    return f;
  }
  function p(e) {
    var f = new ArrayBuffer(3 * (e.length + 3 >> 2 | 0) - (("=" === e[e.length - 1] ? 1 : 0) + ("=" === e[e.length - 2] ? 1 : 0))), d = new Uint8Array(f), g, p = e.length + 3 >> 2;
    for (g = 0; g < p; g++) {
      var v = m[e[4 * g + 1]], w = m[e[4 * g + 2]], u = m[e[4 * g + 3]];
      d[3 * g] = m[e[4 * g]] << 2 | v >> 4;
      0 <= w && (d[3 * g + 1] = v << 4 | w >> 2 & 15);
      0 <= u && (d[3 * g + 2] = w << 6 | u & 63);
    }
    return f;
  }
  const v = "function" === typeof BigInt, w = "ab u8 cu8 s8 u16 s16 u32 s32 u64 s64 f32 f64".split(" "), H = [ArrayBuffer, Uint8Array, Uint8ClampedArray, Int8Array, Uint16Array, Int16Array, Uint32Array, Int32Array, null, null, Float32Array, Float64Array], U = {["true"]:!0, ["false"]:!1, ["null"]:null, ["NaN"]:NaN, ["Infinity"]:Infinity, ["undefined"]:void 0}, L = [], Y = [];
  JSOX.escape = function(e) {
    var f, d = "";
    if (!e) {
      return e;
    }
    for (f = 0; f < e.length; f++) {
      if ('"' == e[f] || "\\" == e[f] || "`" == e[f] || "'" == e[f]) {
        d += "\\";
      }
      d += e[f];
    }
    return d;
  };
  var la = new WeakMap, aa = new Map, ya = new Map;
  JSOX.begin = function(f, m) {
    const d = {name:null, value_type:0, string:"", contains:null, className:null}, R = {line:1, col:1};
    let J = 0, U;
    var V = new Map, u = 0, aa = !0, pa = !1, da = null, na = null, Ha = void 0, la = [], ua = {first:null, last:null, saved:null, push(d) {
      var e = this.saved;
      e ? (this.saved = e.next, e.node = d, e.next = null, e.prior = this.last) : e = {node:d, next:null, prior:this.last};
      this.last || (this.first = e);
      this.last = e;
      this.length++;
    }, pop() {
      var d = this.last;
      if (!d) {
        return null;
      }
      (this.last = d.prior) || (this.first = null);
      d.next = this.saved;
      this.saved = d;
      this.length--;
      return d.node;
    }, length:0}, xa = [], Ja = {}, Fa = null, za = 0, Wa = -1, W = 0, va = 0, db = !1, Ua = !1, Ia = !1, La = !1, oa = !1, ab = {first:null, last:null, saved:null, push(d) {
      var e = this.saved;
      e ? (this.saved = e.next, e.node = d, e.next = null, e.prior = this.last) : e = {node:d, next:null, prior:this.last};
      this.last || (this.first = e);
      this.last = e;
    }, shift() {
      var d = this.first;
      if (!d) {
        return null;
      }
      (this.first = d.next) || (this.last = null);
      d.next = this.saved;
      this.saved = d;
      return d.node;
    }, unshift(d) {
      var e = this.saved;
      e ? (this.saved = e.next, e.node = d, e.next = this.first, e.prior = null) : e = {node:d, next:this.first, prior:null};
      this.first || (this.last = e);
      this.first = e;
    }}, ob = null, kb = !1, bb = !1, Ma = !1, lb = !1, fb = !1, Qa = !1, ib = !1, ra = 0, Za = 0, nb = !1, Sa = !1, cb = !1, mb = !1;
    return {registerFromJSOX(d, e) {
      if (V.get(d)) {
        throw Error("Existing fromJSOX has been registered for prototype");
      }
      V.set(d, e);
    }, value() {
      var d = da;
      da = void 0;
      return d;
    }, reset() {
      u = 0;
      aa = !0;
      ab.last && (ab.last.next = ab.save);
      ab.save = ab.first;
      ab.first = ab.last = null;
      ua.last && (ua.last.next = ua.save);
      ua.save = ab.first;
      la = ua.first = ua.last = null;
      Ha = void 0;
      W = 0;
      xa = [];
      Ja = {};
      Fa = null;
      za = 0;
      d.value_type = 0;
      d.name = null;
      d.string = "";
      d.className = null;
      R.line = 1;
      R.col = 1;
      pa = !1;
      va = 0;
      lb = Ma = kb = Sa = !1;
    }, usePrototype(d, e) {
      Ja[d] = e;
    }, write(d) {
      "string" !== typeof d && (d = String(d));
      for (d = this._write(d, !1); 0 < d && !(da && ("function" === typeof m && function pb(d, e) {
        var f, g = d[e];
        if (g && "object" === typeof g) {
          for (f in g) {
            if (Object.prototype.hasOwnProperty.call(g, f)) {
              var p = pb(g, f);
              void 0 !== p ? g[f] = p : delete g[f];
            }
          }
        }
        return m.call(d, e, g);
      }({"":da}, ""), f(da), da = void 0), 2 > d); d = this._write()) {
      }
    }, _write(f, m) {
      function M(d, e) {
        throw Error(`${d} '${String.fromCodePoint(e)}' unexpected at ${J} (near '${$a.substr(4 < J ? J - 4 : 0, 4 < J ? 3 : J - 1)}[${String.fromCodePoint(e)}]${$a.substr(J, 10)}') [${R.line}:${R.col}]`);
      }
      function S() {
        d.value_type = 0;
        d.string = "";
      }
      function ma(d) {
        if (mb) {
          if (v) {
            return BigInt(d);
          }
          throw Error("no builtin BigInt()", 0);
        }
        return cb ? new Date(d) : 1 < d.length && !db && !Ua && !Ia && 48 === d.charCodeAt(0) ? (pa ? -1 : 1) * Number("0o" + d) : (pa ? -1 : 1) * Number(d);
      }
      function Pa() {
        var e = null;
        switch(d.value_type) {
          case 5:
            if (mb) {
              if (v) {
                return BigInt(d.string);
              }
              throw Error("no builtin BigInt()", 0);
            }
            return cb ? new Date(d.string) : ma(d.string);
          case 4:
            return d.className && ((e = V.get(d.className)) || (e = ya.get(d.className)), d.className = null, e) ? e.call(d.string) : d.string;
          case 2:
            return !0;
          case 3:
            return !1;
          case 7:
            return NaN;
          case 8:
            return NaN;
          case 9:
            return -Infinity;
          case 10:
            return Infinity;
          case 1:
            return null;
          case -1:
            break;
          case 12:
            break;
          case 6:
            return d.className && ((e = V.get(d.className)) || (e = ya.get(d.className)), d.className = null, e) ? e.call(d.contains) : d.contains;
          case 13:
            if (0 <= Wa) {
              return e = p(d.contains[0]), 0 === Wa ? e : new H[Wa](e);
            }
            if (-2 === Wa) {
              var f = na;
              d.contains.forEach((d) => f = f[d]);
              return f;
            }
            return d.className && ((e = V.get(d.className)) || (e = ya.get(d.className)), d.className = null, e) ? e.call(d.contains) : d.contains;
          default:
            console.log("Unhandled value conversion.", d);
        }
      }
      function Ka() {
        switch(d.value_type) {
          case 12:
            la.push(void 0);
            delete la[la.length - 1];
            break;
          default:
            la.push(Pa());
        }
        S();
      }
      function Na() {
        12 !== d.value_type && (Ha[d.name] = Pa(), S());
      }
      function Da(e) {
        if (0 !== u) {
          switch(pa && (valstring += "-", pa = !1), u) {
            case 31:
              switch(d.value_type) {
                case 2:
                  d.string += "true";
                  break;
                case 3:
                  d.string += "false";
                  break;
                case 1:
                  d.string += "null";
                  break;
                case 10:
                  d.string += "Infinity";
                  break;
                case 9:
                  d.string += "-Infinity";
                  break;
                case 8:
                  d.string += "NaN";
                  break;
                case 7:
                  d.string += "-NaN";
                  break;
                case -1:
                  d.string += "undefined";
                  break;
                default:
                  console.log("Value of type " + d.value_type + " is not restored...");
              }case 1:
              d.string += "t";
              break;
            case 2:
              d.string += "tr";
              break;
            case 3:
              d.string += "tru";
              break;
            case 5:
              d.string += "f";
              break;
            case 6:
              d.string += "fa";
              break;
            case 7:
              d.string += "fal";
              break;
            case 8:
              d.string += "fals";
              break;
            case 9:
              d.string += "n";
              break;
            case 10:
              d.string += "nu";
              break;
            case 11:
              d.string += "nul";
              break;
            case 12:
              d.string += "u";
              break;
            case 13:
              d.string += "un";
              break;
            case 14:
              d.string += "und";
              break;
            case 15:
              d.string += "unde";
              break;
            case 16:
              d.string += "undef";
              break;
            case 17:
              d.string += "undefi";
              break;
            case 18:
              d.string += "undefin";
              break;
            case 19:
              d.string += "undefine";
              break;
            case 20:
              d.string += "M";
              break;
            case 21:
              d.string += "Na";
              break;
            case 22:
              d.string += "I";
              break;
            case 23:
              d.string += "In";
              break;
            case 24:
              d.string += "Inf";
              break;
            case 25:
              d.string += "Infi";
              break;
            case 26:
              d.string += "Infin";
              break;
            case 27:
              d.string += "Infini";
              break;
            case 28:
              d.string += "Infinit";
          }
        }
        d.value_type = 4;
        u = 29;
        123 == e ? Ya() : 91 == e ? eb() : 32 != e && 13 != e && 10 != e && 9 != e && 65279 != e && 2028 != e && 2029 != e && (44 == e || 125 == e || 93 == e || 58 == e ? M("Invalid character near identifier", e) : d.string += U);
      }
      function Ga(e) {
        let f = 0;
        for (; 0 == f && J < $a.length;) {
          U = $a.charAt(J);
          let g = $a.codePointAt(J++);
          65536 <= g && (U += $a.charAt(J), J++);
          R.col++;
          if (g == e) {
            Ma ? (d.string += U, Ma = !1) : (nb ? M("Incomplete Octal sequence", g) : ib ? M("Incomplete hexidecimal sequence", g) : Qa ? M("Incomplete unicode sequence", g) : fb && M("Incomplete long unicode sequence", g), f = 1);
          } else {
            if (Ma) {
              if (nb) {
                if (3 > Za && 48 <= g && 57 >= g) {
                  ra *= 8, ra += g - 48, Za++, 3 === Za && (d.string += String.fromCodePoint(ra), Ma = nb = !1);
                } else {
                  if (255 < ra) {
                    M("(escaped character, parsing octal escape val=%d) fault while parsing", g);
                    f = -1;
                    break;
                  }
                  d.string += String.fromCodePoint(ra);
                  Ma = nb = !1;
                }
              } else {
                if (fb) {
                  125 == g ? (d.string += String.fromCodePoint(ra), Ma = Qa = fb = !1) : (ra *= 16, 48 <= g && 57 >= g ? ra += g - 48 : 65 <= g && 70 >= g ? ra += g - 65 + 10 : 97 <= g && 102 >= g ? ra += g - 97 + 10 : (M("(escaped character, parsing hex of \\u)", g), f = -1, Ma = fb = !1));
                } else {
                  if (ib || Qa) {
                    if (0 === Za && 123 === g) {
                      fb = !0;
                      continue;
                    }
                    if (2 > Za || Qa && 4 > Za) {
                      ra *= 16;
                      if (48 <= g && 57 >= g) {
                        ra += g - 48;
                      } else {
                        if (65 <= g && 70 >= g) {
                          ra += g - 65 + 10;
                        } else {
                          if (97 <= g && 102 >= g) {
                            ra += g - 97 + 10;
                          } else {
                            M(Qa ? "(escaped character, parsing hex of \\u)" : "(escaped character, parsing hex of \\x)", g);
                            f = -1;
                            Ma = ib = !1;
                            continue;
                          }
                        }
                      }
                      Za++;
                      Qa ? 4 == Za && (d.string += String.fromCodePoint(ra), Ma = Qa = !1) : 2 == Za && (d.string += String.fromCodePoint(ra), Ma = ib = !1);
                      continue;
                    }
                  }
                  switch(g) {
                    case 13:
                      lb = !0;
                      R.col = 1;
                      continue;
                    case 10:
                    case 2028:
                    case 2029:
                      R.line++;
                      break;
                    case 116:
                      d.string += "\t";
                      break;
                    case 98:
                      d.string += "\b";
                      break;
                    case 110:
                      d.string += "\n";
                      break;
                    case 114:
                      d.string += "\r";
                      break;
                    case 102:
                      d.string += "\f";
                      break;
                    case 48:
                    case 49:
                    case 50:
                    case 51:
                      nb = !0;
                      ra = g - 48;
                      Za = 1;
                      continue;
                    case 120:
                      ib = !0;
                      ra = Za = 0;
                      continue;
                    case 117:
                      Qa = !0;
                      ra = Za = 0;
                      continue;
                    default:
                      d.string += U;
                  }
                  Ma = !1;
                }
              }
            } else {
              92 === g ? Ma ? (d.string += "\\", Ma = !1) : Ma = !0 : lb ? (lb = !1, 10 == g ? (R.line++, R.col = 1, Ma = !1) : (R.line++, R.col = 1)) : d.string += U;
            }
          }
        }
        return f;
      }
      function jb() {
        let e;
        for (; (e = J) < $a.length;) {
          U = $a.charAt(e);
          let f = $a.codePointAt(J++);
          65536 <= f && (M("fault while parsing number;", f), U += $a.charAt(J), J++);
          if (95 != f) {
            if (R.col++, 48 <= f && 57 >= f) {
              Ia && (oa = !0), d.string += U;
            } else {
              if (45 == f || 43 == f) {
                0 == d.string.length || Ia && !La && !oa ? (d.string += U, La = !0) : (d.string += U, cb = !0);
              } else {
                if (58 == f && cb) {
                  d.string += U, cb = !0;
                } else {
                  if (84 == f && cb) {
                    d.string += U, cb = !0;
                  } else {
                    if (90 == f && cb) {
                      d.string += U, cb = !0;
                    } else {
                      if (46 == f) {
                        if (Ua || db || Ia) {
                          aa = !1;
                          M("fault while parsing number;", f);
                          break;
                        } else {
                          d.string += U, Ua = !0;
                        }
                      } else {
                        if (110 == f) {
                          mb = !0;
                          break;
                        } else {
                          if (120 == f || 98 == f || 111 == f || 88 == f || 66 == f || 79 == f) {
                            if (db || "0" != d.string) {
                              aa = !1;
                              M("fault while parsing number;", f);
                              break;
                            } else {
                              db = !0, d.string += U;
                            }
                          } else {
                            if (101 == f || 69 == f) {
                              if (Ia) {
                                aa = !1;
                                M("fault while parsing number;", f);
                                break;
                              } else {
                                d.string += U, Ia = !0;
                              }
                            } else {
                              32 == f || 13 == f || 10 == f || 9 == f || 65279 == f || 44 == f || 125 == f || 93 == f || 58 == f ? J = e : m && (aa = !1, M("fault while parsing number;", f));
                              break;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        m || J != $a.length ? (bb = !1, d.value_type = 5, 0 == W && (Sa = !0)) : bb = !0;
      }
      function Ya() {
        let f, g = null, m = {};
        0 < u && 29 > u && Da();
        if (0 == W) {
          29 == u && d.string.length ? (V.get(d.string) ? d.className = d.string : ya.get(d.string) && (d.className = d.string), (g = xa.find((e) => e.name === d.string)) ? (m = Object.assign(m, g.protoObject), Object.setPrototypeOf(m, Object.getPrototypeOf(g.protoObject)), f = 6) : (xa.push(g = {name:d.string, protoObject:Ja[d.string] || Object.create({}), fields:[]}), f = 5), u = 0) : (f = 3, u = 29);
        } else {
          if (29 == u || 1 === W || 4 === W) {
            0 != u ? (V.get(d.string) ? d.className = d.string : ya.get(d.string) && (d.className = d.string), (g = xa.find((e) => e.name === d.string)) || M("Referenced class " + d.string + " has not been defined", ka), m = Object.assign(m, g.protoObject), Object.setPrototypeOf(m, Object.getPrototypeOf(g.protoObject)), f = 6) : f = 3, u = 0;
          } else {
            if (3 == W && 0 == u) {
              return M("fault while parsing; getting field name unexpected ", ka), aa = !1;
            }
            f = 3;
          }
        }
        {
          let p = e();
          d.value_type = 6;
          0 == W ? da = Ha = m : 4 == W && (Ha[d.name] = m);
          p.context = W;
          p.elements = Ha;
          p.element_array = la;
          p.name = d.name;
          p.current_class = Fa;
          p.current_class_field = za;
          p.arrayType = Wa;
          p.className = d.className;
          d.className = null;
          Fa = g;
          za = 0;
          Ha = m;
          na || (na = Ha);
          ua.push(p);
          S();
          W = f;
        }
        return !0;
      }
      function eb() {
        0 < u && 29 > u && Da();
        if (29 == u && d.string.length) {
          var f = w.findIndex((e) => e === d.string);
          0 <= f ? (u = 0, Wa = f) : "ref" === d.string ? Wa = -2 : V.get(d.string) ? d.className = d.string : ya.get(d.string) ? d.className = d.string : M("Unknown type specified for array:" + d.string, ka);
        } else {
          if (3 == W || 29 == u || 30 == u) {
            return M("Fault while parsing; while getting field name unexpected", ka), aa = !1;
          }
        }
        {
          f = e();
          d.value_type = 13;
          let g = [];
          0 == W ? da = la = g : 4 == W && (Ha[d.name] = g);
          f.context = W;
          f.elements = Ha;
          f.element_array = la;
          f.name = d.name;
          f.current_class = Fa;
          f.current_class_field = za;
          f.arrayType = Wa;
          f.className = d.className;
          Fa = d.className = null;
          za = 0;
          la = g;
          na || (na = la);
          ua.push(f);
          S();
          W = 1;
        }
        return !0;
      }
      var gb = 0;
      if (!aa) {
        return -1;
      }
      if (f && f.length) {
        var hb = g();
        hb.buf = f;
        ab.push(hb);
      } else {
        bb && (bb = !1, d.value_type = 5, 0 == W && (Sa = !0), gb = 1);
      }
      for (; aa && (hb = ab.shift());) {
        J = hb.n;
        var $a = hb.buf;
        kb && (f = Ga(ob), 0 > f ? aa = !1 : 0 < f && (kb = !1, aa && (d.value_type = 4)));
        for (bb && jb(); !Sa && aa && J < $a.length;) {
          U = $a.charAt(J);
          var ka = $a.codePointAt(J++);
          65536 <= ka && (U += $a.charAt(J), J++);
          R.col++;
          if (va) {
            if (1 == va) {
              if (42 == ka) {
                va = 3;
                continue;
              }
              47 != ka ? (M("fault while parsing;", ka), aa = !1) : va = 2;
              continue;
            }
            if (2 == va) {
              10 == ka && (va = 0);
              continue;
            }
            if (3 == va) {
              42 == ka && (va = 4);
              continue;
            }
            if (4 == va) {
              47 == ka ? va = 0 : 42 != ka && (va = 3);
              continue;
            }
          }
          switch(ka) {
            case 47:
              va || (va = 1);
              break;
            case 123:
              Ya();
              break;
            case 91:
              eb();
              break;
            case 58:
              3 == W ? 0 != u && 29 != u && 30 != u ? (aa = FALSE, thorwError(`fault while parsing; unquoted keyword used as object field name (state:${u})`, ka)) : (u = 0, d.name = d.string, d.string = "", W = 4, d.value_type = 0) : (1 == W ? M("(in array, got colon out of string):parsing fault;", ka) : M("(outside any object, got colon out of string):parsing fault;", ka), aa = !1);
              break;
            case 125:
              u = 0;
              5 == W ? Fa ? (d.string && (Fa.protoObject[d.string] = void 0, Fa.fields.push(d.string)), S(), f = ua.pop(), u = W = 0, d.name = f.name, Ha = f.elements, la = f.element_array, Fa = f.current_class, za = f.current_class_field, Wa = f.arrayType, d.className = f.className, na = null, L.push(f)) : M("State error; gathering class fields, and lost the class", ka) : 3 == W || 6 == W ? (0 != d.value_type && (d.name = Fa.fields[za++], Na()), d.value_type = 6, d.contains = Ha, d.string = "", 
              f = ua.pop(), W = f.context, d.name = f.name, Ha = f.elements, la = f.element_array, Fa = f.current_class, za = f.current_class_field, Wa = f.arrayType, d.className = f.className, L.push(f), 0 == W && (Sa = !0)) : 4 == W ? (0 != d.value_type && Na(), d.value_type = 6, d.contains = Ha, f = ua.pop(), d.name = f.name, W = f.context, d.name = f.name, Ha = f.elements, Fa = f.current_class, za = f.current_class_field, Wa = f.arrayType, d.className = f.className, la = f.element_array, L.push(f), 
              0 == W && (Sa = !0)) : (M("Fault while parsing; unexpected", ka), aa = !1);
              pa = !1;
              break;
            case 93:
              31 == u && (u = 0);
              1 == W ? (0 != d.value_type && Ka(), d.contains = la, f = ua.pop(), d.name = f.name, W = f.context, Ha = f.elements, Fa = f.current_class, za = f.current_class_field, Wa = f.arrayType, d.className = f.className, la = f.element_array, L.push(f), d.value_type = 13, 0 == W && (Sa = !0)) : (M(`bad context ${W}; fault while parsing`, ka), aa = !1);
              pa = !1;
              break;
            case 44:
              if (31 == u || 29 == u) {
                u = 0;
              }
              5 == W ? Fa ? (Fa.protoObject[d.string] = void 0, Fa.fields.push(d.string), d.string = "", u = 29) : M("State error; gathering class fields, and lost the class", ka) : 3 == W ? Fa ? (d.name = Fa.fields[za++], 0 != d.value_type && (Na(), S())) : M("State error; gathering class values, and lost the class", ka) : 6 == W ? Fa ? (d.name = Fa.fields[za++], 0 != d.value_type && (Na(), S())) : M("State error; gathering class values, and lost the class", ka) : 1 == W ? (0 == d.value_type && 
              (d.value_type = 12), 0 != d.value_type && (Ka(), S())) : 4 == W ? (W = 3, 0 != d.value_type && (Na(), S())) : (aa = !1, M("bad context; excessive commas while parsing;", ka));
              pa = !1;
              break;
            default:
              if (0 == W || 4 == W && 29 == u || 3 == W || 5 == W) {
                switch(ka) {
                  case 96:
                  case 34:
                  case 39:
                    0 == u || 29 == u ? (d.string.length && (d.className = d.string, d.string = ""), Ga(ka) ? d.value_type = 4 : (ob = ka, kb = !0)) : M("fault while parsing; quote not at start of field name", ka);
                    break;
                  case 10:
                    R.line++, R.col = 1;
                  case 13:
                  case 32:
                  case 9:
                  case 65279:
                    if (31 === u) {
                      u = 0;
                      0 === W && (Sa = !0);
                      break;
                    }
                    0 === u || 30 === u ? 0 == W && d.value_type && (Sa = !0) : 29 === u ? 0 === W ? (u = 0, Sa = !0) : d.string.length && (u = 30) : (aa = !1, M("fault while parsing; whitepsace unexpected", ka));
                    break;
                  default:
                    0 == u && (48 <= ka && 57 >= ka || 43 == ka || 46 == ka || 45 == ka) ? (Ua = oa = La = mb = cb = Ia = db = !1, d.string = U, hb.n = J, jb()) : (30 === u && (aa = !1, M("fault while parsing; character unexpected", ka)), 0 === u && (u = 29, d.value_type = 4), d.string += U);
                }
              } else {
                switch(ka) {
                  case 96:
                  case 34:
                  case 39:
                    Ga(ka) ? (d.value_type = 4, u = 31) : (ob = ka, kb = !0);
                    break;
                  case 10:
                    R.line++, R.col = 1;
                  case 32:
                  case 9:
                  case 13:
                  case 2028:
                  case 2029:
                  case 65279:
                    if (31 == u) {
                      u = 0;
                      0 == W && (Sa = !0);
                      break;
                    }
                    0 != u && 30 != u && (29 == u ? d.string.length && (u = 30) : (aa = !1, M("fault parsing whitespace", ka)));
                    break;
                  case 116:
                    0 == u ? u = 1 : 27 == u ? u = 28 : Da(ka);
                    break;
                  case 114:
                    1 == u ? u = 2 : Da(ka);
                    break;
                  case 117:
                    2 == u ? u = 3 : 9 == u ? u = 10 : 0 == u ? u = 12 : Da(ka);
                    break;
                  case 101:
                    3 == u ? (d.value_type = 2, u = 31) : 8 == u ? (d.value_type = 3, u = 31) : 14 == u ? u = 15 : 18 == u ? u = 19 : Da(ka);
                    break;
                  case 110:
                    0 == u ? u = 9 : 12 == u ? u = 13 : 17 == u ? u = 18 : 22 == u ? u = 23 : 25 == u ? u = 26 : Da(ka);
                    break;
                  case 100:
                    13 == u ? u = 14 : 19 == u ? (d.value_type = -1, u = 31) : Da(ka);
                    break;
                  case 105:
                    16 == u ? u = 17 : 24 == u ? u = 25 : 26 == u ? u = 27 : Da(ka);
                    break;
                  case 108:
                    10 == u ? u = 11 : 11 == u ? (d.value_type = 1, u = 31) : 6 == u ? u = 7 : Da(ka);
                    break;
                  case 102:
                    0 == u ? u = 5 : 15 == u ? u = 16 : 23 == u ? u = 24 : Da(ka);
                    break;
                  case 97:
                    5 == u ? u = 6 : 20 == u ? u = 21 : Da(ka);
                    break;
                  case 115:
                    7 == u ? u = 8 : Da(ka);
                    break;
                  case 73:
                    0 == u ? u = 22 : Da(ka);
                    break;
                  case 78:
                    0 == u ? u = 20 : 21 == u ? (d.value_type = pa ? 7 : 8, pa = !1, u = 31) : Da(ka);
                    break;
                  case 121:
                    28 == u ? (d.value_type = pa ? 9 : 10, pa = !1, u = 31) : Da(ka);
                    break;
                  case 45:
                    0 == u ? pa = !pa : Da(ka);
                    break;
                  default:
                    0 == u && (48 <= ka && 57 >= ka || 43 == ka || 46 == ka || 45 == ka) ? (Ua = oa = La = mb = cb = Ia = db = !1, d.string = U, hb.n = J, jb()) : Da(ka);
                }
              }
          }
          if (Sa) {
            31 == u && (u = 0);
            break;
          }
        }
        J == $a.length ? (Y.push(hb), kb || bb || 3 == W ? gb = 0 : 0 != W || 0 == d.value_type && !da || (Sa = !0, gb = 1)) : (hb.n = J, ab.unshift(hb), gb = 2);
        if (Sa) {
          na = null;
          break;
        }
      }
      if (!aa) {
        return -1;
      }
      Sa && 0 != d.value_type && (da = Pa(), pa = !1, d.string = "", d.value_type = 0);
      Sa = !1;
      return gb;
    }};
  };
  const xa = [Object.freeze(JSOX.begin())];
  var V = 0;
  JSOX.parse = function(e, f) {
    var d = V++;
    xa.length <= d && xa.push(Object.freeze(JSOX.begin()));
    d = xa[d];
    "string" !== typeof e && (e = String(e));
    d.reset();
    if (0 < d._write(e, !0)) {
      return e = d.value(), "function" === typeof f && function ma(d, e) {
        var g, m = d[e];
        if (m && "object" === typeof m) {
          for (g in m) {
            if (Object.prototype.hasOwnProperty.call(m, g)) {
              var p = ma(m, g);
              void 0 !== p ? m[g] = p : delete m[g];
            }
          }
        }
        return f.call(d, e, m);
      }({"":e}, ""), V--, e;
    }
  };
  var ua = function() {
    return this && this.valueOf();
  };
  la.set(Object.prototype, {external:!1, name:Object.prototype.constructor.name, cb:null});
  la.set(Date.prototype, {external:!1, name:"Date", cb:function() {
    var e = -this.getTimezoneOffset(), f = 0 <= e ? "+" : "-", d = function(d) {
      d = Math.floor(Math.abs(d));
      return (10 > d ? "0" : "") + d;
    };
    return [this.getFullYear(), "-", d(this.getMonth() + 1), "-", d(this.getDate()), "T", d(this.getHours()), ":", d(this.getMinutes()), ":", d(this.getSeconds()), f, d(e / 60), ":", d(e % 60)].join("");
  }});
  la.set(Boolean.prototype, {external:!1, name:"Boolean", cb:ua});
  la.set(Number.prototype, {external:!1, name:"Number", cb:function() {
    return isNaN(this) ? "NaN" : isFinite(this) ? String(this) : 0 > this ? "-Infinity" : "Infinity";
  }});
  la.set(String.prototype, {external:!1, name:"String", cb:function() {
    return '"' + JSOX.escape(ua.apply(this)) + '"';
  }});
  "function" === typeof BigInt && la.set(BigInt.prototype, {external:!1, name:"BigInt", cb:function() {
    return this + "n";
  }});
  la.set(ArrayBuffer.prototype, {external:!0, name:"ab", cb:function() {
    return "[" + f(this) + "]";
  }});
  la.set(Uint8Array.prototype, {external:!0, name:"u8", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  la.set(Uint8ClampedArray.prototype, {external:!0, name:"uc8", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  la.set(Int8Array.prototype, {external:!0, name:"s8", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  la.set(Uint16Array.prototype, {external:!0, name:"u16", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  la.set(Int16Array.prototype, {external:!0, name:"s16", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  la.set(Uint32Array.prototype, {external:!0, name:"u32", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  la.set(Int32Array.prototype, {external:!0, name:"s32", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  "undefined" != typeof Uint64Array && la.set(Uint64Array.prototype, {external:!0, name:"u64", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  "undefined" != typeof Int64Array && la.set(Int64Array.prototype, {external:!0, name:"s64", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  la.set(Float32Array.prototype, {external:!0, name:"f32", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  la.set(Float64Array.prototype, {external:!0, name:"f64", cb:function() {
    return "[" + f(this.buffer) + "]";
  }});
  JSOX.registerToJSOX = function(e, f, d) {
    if (f.prototype && f.prototype !== Object.prototype) {
      if (la.get(f)) {
        throw Error("Existing toJSOX has been registered for prototype");
      }
      console.log("PUSH PROTOTYPE");
      la.set(f, {external:!0, name:e || d.constructor.name, cb:d});
    } else {
      f = Object.keys(f).toString();
      if (aa.get(f)) {
        throw Error("Existing toJSOX has been registered for object type");
      }
      aa.set(f, {external:!0, name:e, cb:d});
    }
  };
  JSOX.registerFromJSOX = function(e, f) {
    if (ya.get(e)) {
      throw Error("Existing fromJSOX has been registered for prototype");
    }
    ya.set(e, f);
  };
  JSOX.registerToFrom = function(e, f, d, g) {
    JSOX.registerToJSOX(e, f, d);
    JSOX.registerFromJSOX(e, g);
  };
  var Ja;
  JSOX.stringifier = function() {
    function e(e, f) {
      var g, m = Object.getPrototypeOf(e);
      if (g = d.find((d) => {
        if (d.proto && d.proto === m) {
          return !0;
        }
      })) {
        return g;
      }
      if (f) {
        f = f.map((d) => {
          if ("string" === typeof d) {
            return d;
          }
        });
        var p = f.toString();
      } else {
        p = Object.keys(e).toString();
      }
      return g = d.find((d) => {
        if (d.tag === p) {
          return !0;
        }
      });
    }
    function f(f, w, H) {
      function R(f, w) {
        Ja.cb = function() {
          var d = [];
          let e = p.length;
          for (let f = 0; f < this.length; f += 1) {
            p[e] = f, d[f] = R(f, this) || "null";
          }
          p.splice(e, 1);
          return 0 === d.length ? "[]" : J ? ["[\n", J, d.join(",\n" + J), "\n", H, "]"].join("") : "[" + d.join(",") + "]";
        };
        var H = J;
        let W = p.length;
        var S = w[f], V = void 0 !== S && null !== S && (v.get(Object.getPrototypeOf(S)) || la.get(Object.getPrototypeOf(S)) || null);
        var Y = !V && void 0 !== S && null !== S && (u.get(Object.keys(S).toString()) || aa.get(Object.keys(S).toString()) || null);
        var ma = V && V.cb || Y && Y.cb;
        if (void 0 !== S && null !== S && "function" === typeof ma) {
          J += da;
          if ("object" === typeof S) {
            if (null === S) {
              var pa = void 0;
            } else {
              pa = m.get(S), pa || (m.set(S, JSON.stringify(p)), pa = void 0);
            }
            if (pa) {
              return "ref" + pa;
            }
          }
          S = ma.apply(S);
          J = H;
        } else {
          "object" === typeof S && (null === S ? pa = void 0 : (pa = m.get(S), pa || (m.set(S, JSON.stringify(p)), pa = void 0)));
        }
        "function" === typeof L && (S = L.call(w, f, S));
        switch(typeof S) {
          case "string":
          case "number":
            var oa = "";
            "" === f && (oa = d.map((d) => d.name + "{" + d.fields.join(",") + "}").join(J ? "\n" : "") + (J ? "\n" : ""));
            return V && V.external ? oa + V.name + S : Y && Y.external ? oa + Y.name + S : oa + S;
          case "boolean":
          case "null":
            return String(S);
          case "object":
            if (pa) {
              return "ref" + pa;
            }
            if (!S) {
              return "null";
            }
            J += da;
            Y = null;
            w = [];
            if (L && "object" === typeof L) {
              var na = L.length;
              Y = e(S, L);
              for (ma = 0; ma < na; ma += 1) {
                "string" === typeof L[ma] && (oa = L[ma], p[W] = oa, (pa = R(oa, S)) && (Y ? w.push(pa) : w.push((oa in U || /((\n|\r|\t)|s|S|[ \{\}\(\)<>!\+\-\*\/\.:, ])/.test(oa) ? g + JSOX.escape(oa) + g : oa) + (J ? ": " : ":") + pa)));
              }
            } else {
              Y = e(S);
              ma = [];
              for (oa in S) {
                if (Object.prototype.hasOwnProperty.call(S, oa)) {
                  for (na = 0; na < ma.length; na++) {
                    if (ma[na] > oa) {
                      ma.splice(na, 0, oa);
                      break;
                    }
                  }
                  na == ma.length && ma.push(oa);
                }
              }
              for (na = 0; na < ma.length; na++) {
                oa = ma[na], Object.prototype.hasOwnProperty.call(S, oa) && (p[W] = oa, (pa = R(oa, S)) && (Y ? w.push(pa) : w.push((oa in U || /((\n|\r|\t)|s|S|[ \{\}\(\)<>!\+\-\*\/\.:, ])/.test(oa) ? g + JSOX.escape(oa) + g : oa) + (J ? ": " : ":") + pa)));
              }
            }
            p.splice(W, 1);
            S = "" === f ? d.map((d) => d.name + "{" + d.fields.join(",") + "}").join(J ? "\n" : "") + (J ? "\n" : "") : "";
            V && V.external && (S = "" === f ? S + V.name : S + '"' + V.name + '"');
            f = null;
            Y && (f = Y.name in U || /((\n|\r|\t)|s|S|[ \{\}\(\)<>!\+\-\*\/\.:, ])/.test(Y.name) ? g + JSOX.escape(Y.name) + g : Y.name);
            pa = S + (0 === w.length ? "{}" : J ? (Y ? f : "") + "{\n" + J + w.join(",\n" + J) + "\n" + H + "}" : (Y ? f : "") + "{" + w.join(",") + "}");
            J = H;
            return pa;
        }
      }
      if (void 0 === f) {
        return "undefined";
      }
      if (null !== f) {
        var J, L;
        var S = typeof H;
        var V = typeof w;
        var da = J = "";
        if ("number" === S) {
          for (S = 0; S < H; S += 1) {
            da += " ";
          }
        } else {
          "string" === S && (da = H);
        }
        if ((L = w) && "function" !== V && ("object" !== V || "number" !== typeof w.length)) {
          throw Error("JSOX.stringify");
        }
        p = [];
        m = new WeakMap;
        return R("", {"":f});
      }
    }
    var d = [], g = '"', m = new WeakMap, p = [], v = new WeakMap, u = new Map;
    la.get(Array.prototype) || la.set(Array.prototype, Ja = {external:!1, name:Array.prototype.constructor.name, cb:null});
    return {defineClass(e, f) {
      d.push(e = {name:e, tag:Object.keys(f).toString(), proto:Object.getPrototypeOf(f), fields:Object.keys(f)});
      for (f = 1; f < e.fields.length; f++) {
        if (e.fields[f] < e.fields[f - 1]) {
          let d = e.fields[f - 1];
          e.fields[f - 1] = e.fields[f];
          e.fields[f] = d;
          1 < f && (f -= 2);
        }
      }
      e.proto === Object.getPrototypeOf({}) && (e.proto = null);
    }, stringify(d, e, g) {
      return f(d, e, g);
    }, setQuote(d) {
      g = d;
    }, registerToJSOX(d, e, f) {
      if (e.prototype && e.prototype !== Object.prototype) {
        if (v.get(e)) {
          throw Error("Existing toJSOX has been registered for prototype");
        }
        v.set(e, {external:!0, name:d || f.constructor.name, cb:f});
      } else {
        e = Object.keys(e).toString();
        if (u.get(e)) {
          throw Error("Existing toJSOX has been registered for object type");
        }
        u.set(e, {external:!0, name:d, cb:f});
      }
    }};
  };
  const m = {"=":-1};
  for (var da = 0; 256 > da; da++) {
    64 > da && (m["ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[da]] = da);
  }
  JSOX.stringify = function(e, f, d) {
    return JSOX.stringifier().stringify(e, f, d);
  };
  [[0, 384, [16767487, 16739071, 130048, 3670016, 0, 16777208, 16777215, 8388607, 8388608, 0, 128, 0, 0, 0, 0, 0]]].map((e) => ({firstChar:e[0], lastChar:e[1], bits:e[2]}));
}
privateizeEverything();
function protocolHidder() {
  function e(f, d, g, p, xa) {
    function R() {
      var e = localStorage.getItem("clientKey");
      localStorage.getItem("sessionKey");
      e || 0 !== d ? 0 == d ? (na.send("AUTH"), J = setTimeout(() => {
        g({op:"status", status:" AUTH not responding..."});
        console.log("Auth timed out...");
      }, 5000)) : (na.send(p), na.send('{op:"hello"}')) : na.send('{op:"getClientKey"}');
    }
    var u = !1, S = {key:idGen.generator(), step:0}, pa = {key:S.key, step:1};
    d || (V = 0);
    var ya = !1;
    V && !xa && console.log("Need to re-request service....", f, V);
    L++;
    g({op:"status", status:"connecting..." + V + " " + f});
    try {
      var na = new WebSocket(0 == d ? H : xa, f, 0 < d ? {perMessageDeflate:!1} : null);
      xa = null;
      1 === d ? Y = na : 1 < d && ("chatStorage" === f && (aa = na, la && (la.storage = na)), "KCHAT" === f && (la = na, aa && (la.storage = aa)));
    } catch (Ha) {
      console.log("CONNECTION ERROR?", Ha);
      return;
    }
    na.onopen = function() {
      ya = !0;
      g({op:"status", status:d + " Opened...."});
      na.send(S.key);
      na.send = ((d) => (e) => {
        d(u8xor(e, S));
      })(na.send.bind(na));
      R();
    };
    na.onmessage = function(f) {
      var m = u8xor(f.data, pa);
      if (f = JSON.parse(m)) {
        if (0 < d) {
          if ("addMethod" === f.op) {
            try {
              (new Function("JSON", "config", "localStorage", "idGen", f.code)).call(na, JSON, U, localStorage, idGen), Ja && (m = Ja, da && (clearTimeout(da), da = null), Ja = null, m({op:"connected", ws:na})), na === la && (pendingSetContacts && la.setContacts(pendingSetContacts), pendingSetGroups && la.setGroups(pendingSetGroups), pendingSetGroups = pendingSetContacts = null), "setEventCallback" in na ? na.setEventCallback(g) : 1 === d && (V = d, g({op:"login", ws:na}));
            } catch (Ya) {
              console.log("Function compilation error:", Ya, "\n", f.code);
            }
          } else {
            this.fw_message && this.fw_message(na, f, m);
          }
        } else {
          0 == d && ("setClientKey" === f.op ? (localStorage.setItem("clientKey", f.key), R()) : "redirect" === f.op && (u = !0, e("Auth0", 1, g, f.id, "wss://" + f.address + ":" + f.port + "/"), 0 == d && (na.close(1000, "done"), J && (clearTimeout(J), J = null))));
        }
      }
    };
    na.onerror = function(d) {
      console.log("Can I get anything from err?", d);
      d.target.url.includes("chatment.com");
    };
    na.onclose = function(p) {
      1000 != p.code && (ya ? (ya = !1, 0 != d && 2 != d || !Ja || (Ja(null), da && (clearTimeout(da), da = null), Ja = null), u && 0 == d || (xa && 1 <= d ? (1 < d ? console.log("Cannot auto-reconnect; need to re-request service") : e(m, V = ++d, g), xa = null) : (v.loggedIn = !1, v.doneWithAuth = !1, g({op:"status", status:"Disconnected... waiting a moment to reconnect..."}), g({op:"disconnect"}), ua || (ua = setTimeout(() => {
        ua = null;
        e("chatment.core", 0, w);
      }, 5000))))) : (g({op:"status", status:"connection failing..." + [".", ".", ".", "."].slice(0, L % 4).join("")}), setTimeout(() => {
        e(f, d, g);
      }, 5000)));
    };
  }
  function g() {
    ya && (ya(!1, "Timeout"), ya = null);
  }
  function f() {
    Ja && (Ja({op:"status", status:"Service not available..."}), Y.abortRequest(), da && (clearTimeout(da), da = null), Ja = null);
  }
  var p = {connect:function(f) {
    w = f;
    e("chatment.core", 0, f);
  }, login:function(e, d, f) {
    ya ? console.log("login already in progress") : 1 !== V ? (1 < V && console.log("already logged in?"), console.log("Login is not ready yet..."), f(!1, "Login is not ready yet...")) : (ya = f, Y && 1 == V && (Y.login(e, d, (d, e, g) => {
      clearTimeout(xa);
      ya = null;
      f(d, e, g, Y);
    }), xa = setTimeout(g, 5000)));
  }, connectTo:function(f, d, g, m) {
    e(d, 3, m, g, f);
  }, request:function(g, d, v, w) {
    if (Ja) {
      Ja({op:"status", status:"Service request pending..."});
    } else {
      var H = function() {
        da = setTimeout(f, 5000);
        Y.request(g, function(d, f) {
          d ? (m = d.service, e(d.service, "KCHAT" === d.service ? 2 : 3, w, d.id, "wss://" + d.address + ":" + d.port + "/")) : w(!1, f);
        });
      };
      m = g;
      Ja = w;
      d && v ? Y.login(d, v, (d, e, f) => {
        p.username = f;
        p.userid = e;
        d ? H() : (w({op:"status", status:e}), Ja = null);
      }) : Y ? H() : w({op:"status", status:"Not Logged In"});
    }
  }, connected:!1, loggedIn:!1, doneWithAuth:!1, username:null, userkey:null, requestKey(e, d) {
    Y.requestKey(e, d);
  }, selfDestruct() {
    aa.dropStorage();
  }, deleteMessages(e) {
    aa.deleteMessages(e.name);
  }, deleteGroupMessages(e) {
    aa.deleteGroupMessages(e.group_id);
  }, deleteGroup(e) {
    la.groupLeave(e.group_id);
    aa.deleteGroup(null, e.group_id, null);
  }, acceptGroupInvite(e) {
    aa.storeGroup(e.name, e.group_id, e.data = e.data || idGen.generator());
    la.groupInviteAccept(e, e.data);
  }, getGroups() {
    la.getGroups();
  }, closeAuth() {
    Y.close(1000, "done");
  }};
  const v = p;
  var w;
  "undefined" === typeof localStorage && (window.localStorage = localStorage || {getItem(e) {
    return sack.Sqlite.op(e, "");
  }, setItem(e, d) {
    sack.Sqlite.so(e, d);
  }});
  JSON = exports.JSOX;
  var H = "wss://chatment.com:8000/userAuth", U = {run:{["\u039b"]:localStorage.getItem("deviceKey")}};
  U.run["\u039b"] || (U.run["\u039b"] = idGen.generator(), localStorage.setItem("deviceKey", U.run["\u039b"]));
  var L = 0, Y, la, aa, ya, xa = null, V = 0, ua = null, Ja = null, m = "", da = null, J;
  return p;
}
var protocol = protocolHidder();

