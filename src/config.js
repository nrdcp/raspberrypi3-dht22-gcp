const projectId = 'pi-iot-252121';
const cloudRegion = 'europe-west1';
const registryId = 'pi3-dht22-nodes';
const deviceId = 'pi3-dht22-node';

const messageType = 'state'; // or event

const config = {
  mqttHost: 'mqtt.googleapis.com',
  mqttPort: 8883,
  privateKeyFile: '../certs/rsa_private.pem',
  tokenExpMins: 0.5,
  deviceId,
  mqttClientId: `projects/${projectId}/locations/${cloudRegion}/registries/${registryId}/devices/${deviceId}`,
  mqttTopic: `/devices/${deviceId}/${messageType}`,
  projectId,
  transmissionTimeoutSec: 20,
};

module.exports = config;
