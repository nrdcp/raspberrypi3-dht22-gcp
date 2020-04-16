const config = require('./config');

module.exports.debug = (message) => {
  if (config.debug) {
    console.log(`DEBUG:: (${new Date().toISOString().slice(0, 19)}) ${message}`);
  }
};
