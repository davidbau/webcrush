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
    '<script>' + writecompressed + '("' + compressed + '")</script>';
}

// A minified form of js/decompressor.js.
var writecompressed = (
    '!function(p){function r(r){return w[p.charAt(r)]}var o,a,t,c,e,i,v,f,h' +
    '=String.fromCharCode,n=document,s=32,u="ABCDEFGHIJKLMNOPQRSTUVWXYZabcd' +
    'efghijklmnopqrstuvwxyz0123456789+/=",w={},A=Math.pow,b=[],k=4,d=4,g=3,' +
    'm="",C=[],j={v:r(0),p:s,i:1};for(a=0;a<u.length;a++)w[u.charAt(a)]=a;f' +
    'or(a=0;3>a;a+=1)b[a]=a;for(c=0,i=A(2,2),v=1;v!=i;)e=j.v&j.p,j.p>>=1,0=' +
    '=j.p&&(j.p=s,j.v=r(j.i++)),c|=(e>0?1:0)*v,v<<=1;switch(o=c){case 0:for' +
    '(c=0,i=A(2,8),v=1;v!=i;)e=j.v&j.p,j.p>>=1,0==j.p&&(j.p=s,j.v=r(j.i++))' +
    ',c|=(e>0?1:0)*v,v<<=1;f=h(c);break;case 1:for(c=0,i=A(2,16),v=1;v!=i;)' +
    'e=j.v&j.p,j.p>>=1,0==j.p&&(j.p=s,j.v=r(j.i++)),c|=(e>0?1:0)*v,v<<=1;f=' +
    'h(c)}for(b[3]=f,t=f,C.push(f);;){for(c=0,i=A(2,g),v=1;v!=i;)e=j.v&j.p,' +
    'j.p>>=1,0==j.p&&(j.p=s,j.v=r(j.i++)),c|=(e>0?1:0)*v,v<<=1;switch(f=c){' +
    'case 0:for(c=0,i=A(2,8),v=1;v!=i;)e=j.v&j.p,j.p>>=1,0==j.p&&(j.p=s,j.v' +
    '=r(j.i++)),c|=(e>0?1:0)*v,v<<=1;b[d++]=h(c),f=d-1,k--;break;case 1:for' +
    '(c=0,i=A(2,16),v=1;v!=i;)e=j.v&j.p,j.p>>=1,0==j.p&&(j.p=s,j.v=r(j.i++)' +
    '),c|=(e>0?1:0)*v,v<<=1;b[d++]=h(c),f=d-1,k--;break;case 2:return n.wri' +
    'te(C.join(""))}0==k&&(k=A(2,g),g++),b[f]?m=b[f]:f===d&&(m=t+t.charAt(0' +
    ')),C.push(m),b[d++]=t+m.charAt(0),k--,t=m,0==k&&(k=A(2,g),g++)}}' /* end */
);

module.exports.packhtml = packhtml;
module.exports.decompressor = writecompressed;

if (process.browser) {
  window.webcrush = module.exports;
}
