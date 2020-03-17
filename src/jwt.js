/* eslint-disable import/no-unresolved */
const fs = require('fs');
const path = require("path");
const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports.createJwtToken = ({ iatTime }) => {
  const token = {
    iat: iatTime,
    exp: iatTime + config.jwt.TTLMins * 60,
    aud: config.projectId,
  };

  const privateKey = fs.readFileSync(path.resolve(__dirname, config.privateKeyFile));

  return jwt.sign(token, privateKey, {
    algorithm: 'RS256',
  });
};

