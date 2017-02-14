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
    return minified;
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
  prefix = prefix.replace(/ </g, '<');
  // Step 4: compress the remainder of the minified text.
  compressed = lzstring.compressToBase64(suffix);
  // Step 5: wrap it all in a LZW decompression script.
  return prefix +
    '<script>document.write(' + decompressor +
      '("' + compressed + '"))</script>';
}

// A minified form of js/decompressor.js.
var decompressor = (
    'function(r){function n(n){return v[r.charAt(n)]}function t(r){for(var ' +
    't=0,a=1;a!=r;){var c=f&d;d>>=1,0==d&&(d=i,f=n(j++)),t|=(c>0?1:0)*a,a<<' +
    '=1}return t}function a(r){A[l++]=r,g--,g||(g=1<<p,p++)}function c(){va' +
    'r r=t(1<<p);switch(r){case 0:case 1:a(h(t(1<<8*r+8))),r=l-1;break;case' +
    ' 2:j=0}return r}var e,o,u,f,h=String.fromCharCode,i=32,s="ABCDEFGHIJKL' +
    'MNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",v={},A=[0,1,2],' +
    'g=1,l=3,p=2,C="",b=[],d=i,j=1;for(e=0;e<s.length;e++)v[s.charAt(e)]=e;' +
    'for(f=n(0),o=A[c()],b.push(o);j<r.length;){if(u=c(),2==u)return b.join' +
    '("");C=u==l?o+o.charAt(0):A[u],b.push(C),a(o+C.charAt(0)),o=C}}' /* end */
);

module.exports.packhtml = packhtml;
module.exports.decompressor = decompressor;

if (process.browser) {
  window.webcrush = module.exports;
}
