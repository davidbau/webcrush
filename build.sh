#!/bin/sh

# Uglify decompressor, fold it to 70 chars per line, format it as a string,
# and insert it into webcrush.js.
node_modules/uglifyjs/bin/uglifyjs js/decompressor.js -c -m | \
  sed 's/("");$//' | sed 's/^!//' | \
  fold -w 70 | \
  sed "s/^/    '/" | sed "$ ! s/$/' +/" | sed "$ s/$/' \/* end *\/\n/" | \
  sed -e "/'!function(/r /dev/stdin" \
      -e "/'!function(/,/}' \/\* end \*\//d" \
      -i lib/webcrush.js

# Browserify webcrush to create an HTML version of the utility.
node_modules/browserify/bin/cmd.js lib/webcrush.js -o js/webcrush.js
