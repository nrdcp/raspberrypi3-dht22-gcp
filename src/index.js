/* eslint-disable no-console, no-use-before-define, import/no-unresolved */
const nodeDhtSensor = require('node-dht-sensor');
const config = require('./config');
const {
  createMqttClient,
  getMqttClient,
} = require('./mqttClient');

nodeDhtSensor.initialize(22, 2); // `2` => GPIO2

function run() {
  createMqttClient();

  const { client } = getMqttClient();

  // Subscribe to the /devices/{device-id}/config topic to receive config updates.
  client.subscribe(`/devices/${config.deviceId}/config`);

  client.on('error', (err) => {
    console.log('error', err);
  });

  client.on('message', (topic, message) => {
    console.log(topic, 'message received: ', Buffer.from(message, 'base64').toString('ascii'));
  });

  client.on('connect', (success) => {
    if (success) {
      console.log('Client connected...');
      attemptSendData();
    } else {
      console.log('Client not connected...');
    }
  });

  // reconnect as callback
  client.on('close', () => {
    console.log('close');
    run();
  });
}

// CHANGE_ME: move to a different file
function fetchData() {
  const readout = nodeDhtSensor.read();
  const temp = readout.temperature.toFixed(2);
  const humd = readout.humidity.toFixed(2);

  return {
    temp,
    humd,
    time: new Date().toISOString().slice(0, 19).replace('T', ' '), // https://stackoverflow.com/a/11150727/1015046
  };
}

function sendData() {
  const { client } = getMqttClient();
  const sensorData = fetchData();

  const payload = JSON.stringify(sensorData);
  console.log(config.mqttTopic, ': Publishing message:', payload);
  client.publish(config.mqttTopic, payload, { qos: 1 });

  console.log(`Transmitting in ${config.transmissionTimeoutSec} seconds`);
  setTimeout(attemptSendData, config.transmissionTimeoutSec * 1000);
}

function attemptSendData() {
  const {
    client,
    iatTime,
  } = getMqttClient();

  // Move to mqtt (isClientTokenExpired)
  const secsFromIssue = parseInt((Date.now() / 1000), 10) - iatTime;
  if (secsFromIssue > config.tokenExpMins * 60) {
    console.log(`\tRefreshing token after ${secsFromIssue} seconds.`);

    
    client.end();
  } else {
    sendData();
  }
}

run();
