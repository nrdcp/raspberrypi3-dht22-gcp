/* eslint-disable no-console, import/no-unresolved */
const mqtt = require('mqtt');
const config = require('./config');
const { createJwtToken } = require('./jwt');

let mqttClient;
let iatTime;

function setMqttClient({ client, issuedAtTime }) {
  mqttClient = client;
  iatTime = issuedAtTime;
}

module.exports.getMqttClient = () => ({
  client: mqttClient,
  iatTime,
});

module.exports.createMqttClient = () => {
  const issuedAtTime = parseInt((Date.now() / 1000), 10);
  const jwtToken = createJwtToken({ iatTime: issuedAtTime });

  const connectionArgs = {
    clean: true,
    host: config.mqttHost,
    port: config.mqttPort,
    clientId: config.mqttClientId,
    username: 'unused',
    password: jwtToken,
    protocol: 'mqtts',
    secureProtocol: 'TLSv1_2_method',
  };

  console.log('connecting...');
  const client = mqtt.connect(connectionArgs);

  setMqttClient({
    client,
    issuedAtTime,
  });
};
