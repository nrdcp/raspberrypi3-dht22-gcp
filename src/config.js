const projectId = 'pi-iot-252121';
const cloudRegion = 'europe-west1';
const registryId = 'pi3-dht22-nodes';
const deviceId = 'pi3-dht22-node';

const config = {
  mqtt: {
    clientId: `projects/${projectId}/locations/${cloudRegion}/registries/${registryId}/devices/${deviceId}`,
    host: 'mqtt.googleapis.com',
    port: 8883,
    topic: `/devices/${deviceId}/state`,
  },
  jwt: {
    TTLMins: 15,
  },
  privateKeyFile: '../certs/rsa_private.pem',
  deviceId,
  projectId,
  transmissionTimeoutSec: 60 * 10,
  useFakeSensor: false,
};

module.exports = config;
