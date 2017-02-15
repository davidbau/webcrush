var htmlminifier = require('html-minifier');
var lzstring = require('lz-string');

function packhtml(text, options) {
  // Collect default options and any overrides.
  var settings = {
    html5: true,
    collapseWhitespace: true,
    conservativeCollapse: true,
    minifyJS: { mangle: { toplevel: true } },
    minifyCSS: true,
    removeComments: true,
    keepClosingSlash: true,
    removeAttributeQuotes: true,
    lzCompress: true,
    writeOffDomainScripts: false,
  };
  Object.assign(settings, options);
  // Step 1: minify the HTML code and minify inline JS and CSS
  var minified = htmlminifier.minify(text, settings);
  if (!settings.lzCompress) {
    return minified.replace(/^ </, '<');
  }
  // Step 2: exempt doctype, html, head start-tags from compression.
  var prefix = minified.match(
    /^(?:\s*<!doctype\s*html\s*>)?(?:\s*<html[^>]*>)?(?:\s*<head[^>]*>)?/i);
  prefix = prefix ? prefix[0] : '';
  var suffix = minified.substr(prefix.length);
  // Step 3: find all the offdomain scripts (odd-indexed entries in chopped).
  if (!settings.writeOffDomainScripts) {
    var chopped = suffix.split(/(\s?<script src="?https?:[^>]*><\/script>)/i);
    suffix = '';
    for (var j = 0; j < chopped.length; j++) {
      if (j % 2) {
        prefix += chopped[j];
      } else {
        suffix += chopped[j];
      }
    }
  }
  // Tags in the prefix do not need spaces before them.
  prefix = prefix.replace(/\s*</g, '<').replace('\s*$', '');
  // Step 4: compress the remainder of the minified text.
  compressed = lzstring.compressToBase64(suffix);
  // Step 5: wrap it all in a LZW decompression script.
  return prefix +
    '<script>document.write(["' + compressed +
      '"].map(' + decompressor + '))</script>';
}

// A minified form of js/decompressor.js.
var decompressor = (
    'function(r){function n(n){for(var o=0,f=1;f!=n;)o|=i&m&&f,f*=2,m>>=1,0' +
    '==m&&(m=32,i=c[r[S++]]);return o}function o(r){e[C++]=r,v--,v||(v=1<<d' +
    ',d++)}function f(){var r=n(1<<d);return 2>r&&(o(a(n(1<<8*r+8))),r=C-1)' +
    ',r}for(var t,u,i,a=String.fromCharCode,c={},e=[,,""],v=1,C=3,d=2,g="",' +
    'h=64,m=32,S=1;--h>=0;)c[a(h>61?4*(1&h)+43:h+[65,71,-4][h/26&3])]=h;for' +
    '(i=c[r[0]],t=e[f()];t;)g+=t,u=t,h=f(),t=h==C?u+u[0]:e[h],o(u+t[0]);ret' +
    'urn g}' /* end */
);

module.exports.packhtml = packhtml;
module.exports.decompressor = decompressor;

if (process.browser) {
  window.webcrush = module.exports;
}
