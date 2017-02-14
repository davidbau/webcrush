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
  var f = String.fromCharCode,
      resetValue = 32,
      keyStrBase64 =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
      baseReverseDic = {},
      dictionary = [0,1,2],

  // Original decompress starts here.
        enlargeIn = 1,
        dictSize = 3,
        numBits = 2,
        entry = "",
        result = [],
        i,
        w,
        bits, resb, maxpower, power,
        c,
        data_val,
        data_position = resetValue,
        data_index = 1;

    for (i = 0; i < keyStrBase64.length ; i++) {
      baseReverseDic[keyStrBase64.charAt(i)] = i;
    }
    function getNextValue(i) { return baseReverseDic[input.charAt(i)]; }
    data_val = getNextValue(0);

    function decode(maxpower) {
      var bits = 0,
          power = 1;
      while (power!=maxpower) {
        var resb = data_val & data_position;
        data_position >>= 1;
        if (data_position == 0) {
          data_position = resetValue;
          data_val = getNextValue(data_index++);
        }
        bits |= (resb>0 ? 1 : 0) * power;
        power <<= 1;
      }
      return bits;
    }
    function remember(s) {
      dictionary[dictSize++] = s;
      enlargeIn--;
      if (!enlargeIn) {
        enlargeIn = 1 << numBits;
        numBits++;
      }
    }
    function nextKey() {
      var c = decode(1 << numBits);

      switch (c) {
        case 0:
        case 1:
          remember(f(decode(1 << (c*8+8))));
          c = dictSize-1;
          break;
        case 2:
          data_index = 0;
      }
      return c;
    }
    // Read the first character.
    w = dictionary[nextKey()];
    result.push(w);

    while (data_index < input.length) {
      c = nextKey();
      if (c == 2) return result.join('');
      if (c == dictSize) {
        entry = w + w.charAt(0);
      } else {
        entry = dictionary[c];
      }
      result.push(entry);

      // Add w+entry[0] to the dictionary.
      remember(w + entry.charAt(0));
      w = entry;
    }
})("");

