/* eslint-disable no-console, no-use-before-define, import/no-unresolved */
const debug = require('debug')('sensor');
const config = require('./config');
const MqttClient = require('./mqtt-client');
const DhtSensor = require('./dht-sensor');

const dhtSensor = new DhtSensor();
const mqttClient = new MqttClient();

function sendSensorData() {
  const sensorData = dhtSensor.fetchData();
  debug(`Got a sensor reading. Next reading in ${config.transmissionTimeoutSec} seconds`);

  mqttClient.pushMessageToQueue({ message: sensorData });

  setTimeout(sendSensorData, config.transmissionTimeoutSec * 1000);
}

sendSensorData();
