const config = require('./config');

module.exports.debug = (message) => {
  if (config.debug) {
    console.log(`DEBUG:: ${message}`);
  }
};
