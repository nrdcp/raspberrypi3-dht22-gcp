const fs = require('fs');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');
const nodeDhtSensor = require('node-dht-sensor');

nodeDhtSensor.initialize(22, 2); // `2` => GPIO2

var projectId = 'pi-iot-252121';
var cloudRegion = 'europe-west1';
var registryId = 'pi3-dht22-nodes';
var deviceId = 'pi3-dht22-node';

var mqttHost = 'mqtt.googleapis.com';
var mqttPort = 8883;
var privateKeyFile = './certs/rsa_private.pem';
var algorithm = 'RS256';
var messageType = 'state'; // or event

var tokenExpMins = 20; // set to 20mins
var iatTime;

var mqttClientId = 'projects/' + projectId + '/locations/' + cloudRegion + '/registries/' + registryId + '/devices/' + deviceId;
var mqttTopic = '/devices/' + deviceId + '/' + messageType;

var client = getClient();

function getClient() {
  var connectionArgs = {
    clean: true,
    host: mqttHost,
    port: mqttPort,
    clientId: mqttClientId,
    username: 'unused',
    password: createJwt(projectId, privateKeyFile, algorithm),
    protocol: 'mqtts',
    secureProtocol: 'TLSv1_2_method'
  };

  console.log('connecting...');
  const client = mqtt.connect(connectionArgs);

  // Subscribe to the /devices/{device-id}/config topic to receive config updates.
  client.subscribe('/devices/' + deviceId + '/config');

  client.on('connect', function(success) {
    if (success) {
      console.log('Client connected...');
      attemptSendData();
    } else {
      console.log('Client not connected...');
    }
  });

  client.on('error', function(err) {
    console.log('error', err);
  });

  client.on('message', function(topic, message, packet) {
    console.log(topic, 'message received: ', Buffer.from(message, 'base64').toString('ascii'));
  });

  return client;
}

function createJwt(projectId, privateKeyFile, algorithm) {
  iatTime = parseInt(Date.now() / 1000);

  var token = {
    'iat': iatTime,
    'exp': iatTime + tokenExpMins * 60, // 20 minutes
    'aud': projectId
  };
  var privateKey = fs.readFileSync(privateKeyFile);
  return jwt.sign(token, privateKey, {
    algorithm: algorithm
  });
}

function fetchData() {
  var readout = nodeDhtSensor.read();
  var temp = readout.temperature.toFixed(2);
  var humd = readout.humidity.toFixed(2);

  return {
    'temp': temp,
    'humd': humd,
    'time': new Date().toISOString().slice(0, 19).replace('T', ' ') // https://stackoverflow.com/a/11150727/1015046
  };
}

function attemptSendData() {
  const secsFromIssue = parseInt(Date.now() / 1000) - iatTime;
  if (secsFromIssue > tokenExpMins * 60) {
    console.log(`\tRefreshing token after ${secsFromIssue} seconds.`);

    // reconnect as callback
    client.on('close', function() {
      console.log('close');
      client = getClient()
    });
    client.end();
  } else {
    sendData();
  }
}

function sendData() {
  var payload = fetchData();

  payload = JSON.stringify(payload);
  console.log(mqttTopic, ': Publishing message:', payload);
  client.publish(mqttTopic, payload, { qos: 1 });

  console.log('Transmitting in 120 seconds');
  setTimeout(attemptSendData, 120000);
}
