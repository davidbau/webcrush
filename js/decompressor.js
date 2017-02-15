// Decompressor derived from LZ-String, with unused code removed.
// Portions licensed under WTFPL
// Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
// This work is free. You can redistribute it and/or modify it
// under the terms of the WTFPL, Version 2
// For more information see LICENSE.txt or http://www.wtfpl.net/
//
// For more information, the home page:
// http://pieroxy.net/blog/pages/lz-string/testing.html
//
// LZ-based compression algorithm, version 1.4.4
/*
*/
(function(input) {
  var charFor = String.fromCharCode,
      base64Lookup = {},
      dictionary = [,,''], // dictionary[2] = '' is an EOF marker.

  // This is a minifiable version of Pieroxy's _decompress{} method.
        enlargeIn = 1,
        dictSize = 3,
        numBits = 2,
        result = "",
        entry,
        prev,
        c = 64,
        data_val,
        data_position = 32,
        data_index = 1;

    // Reads the next number from 0-(maxpower-1) from the stream.
    function decode(maxpower) {
      var bits = 0,
          power = 1;
      while (power != maxpower) {
        // Extract the bits from the current base64 char, one bit at a time.
        bits |= (data_val & data_position) && power;
        power *= 2;
        data_position >>= 1;
        if (data_position == 0) {
          // Advance to the next base64 char once bits are exhausted.
          data_position = 32;
          data_val = base64Lookup[input[data_index++]];
        }
      }
      return bits;
    }
    // Assigns a string to the next dictionary key.
    function remember(s) {
      dictionary[dictSize++] = s;
      enlargeIn--;
      if (!enlargeIn) {
        // As the dictionary grows, referencing keys requires more bits.
        enlargeIn = 1 << numBits;
        numBits++;
      }
    }
    // Returns the next dictionary key in the stream.
    function nextKey() {
      var c = decode(1 << numBits);
      if (c < 2) {
        // A key of 0 or 1 prefixes a new character for the dictionary.
        remember(charFor(decode(1 << (c*8+8))));
        c = dictSize-1;
      }
      return c;
    }
    // Initialize base64Lookup, which maps each char to its index in
    // "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    while (--c >= 0) {
      base64Lookup[charFor(c > 61 ? (c & 1) * 4 + 43 // 62 -> '+', 63 -> '/'
        : c + [65, 71, -4][c / 26 & 3])] = c; // 0 -> 'A', 26 -> 'a', 52 -> '0'
    }
    // Prime the buffer.
    data_val = base64Lookup[input[0]];
    // Read the first character.
    entry = dictionary[nextKey()];
    while (entry) {
      // Accumulate the result
      result += entry; // see http://stackoverflow.com/questions/16696632
      prev = entry;
      c = nextKey();
      if (c == dictSize) {
        entry = prev + prev[0];
      } else {
        entry = dictionary[c];
        // At EOF, dictionary[2]='' will stop the loop
      }

      // Add prev+entry[0] to the dictionary.
      remember(prev + entry[0]);
    }
    return result;
})("");

