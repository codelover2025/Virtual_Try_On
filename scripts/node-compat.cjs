const util = require('node:util');

if (util.styleText) {
  const origStyleText = util.styleText;
  util.styleText = (format, text, ...rest) => {
    if (Array.isArray(format)) {
      return format.reduce((acc, f) => origStyleText(f, acc, ...rest), text);
    }
    return origStyleText(format, text, ...rest);
  };
}
