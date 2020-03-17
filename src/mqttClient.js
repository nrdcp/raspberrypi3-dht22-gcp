/* eslint-disable no-console, import/no-unresolved */
const mqtt = require('mqtt');
const config = require('./config');
const { createJwtToken } = require('./jwt');
const { debug } = require('./debug');

class MqttClient {
  constructor() {
    this.client;
    this.clientReady = false;
    this.tokenIssuedAtTime;
    this.publishInProgress = false;
    this.queue = [];

    this.createClientConnection();
  }

  createClientConnection() {
    const issuedAtTime = parseInt((Date.now() / 1000), 10);
    const jwtToken = createJwtToken({ iatTime: issuedAtTime });

    const connectionArgs = {
      clean: true,
      host: config.mqtt.host,
      port: config.mqtt.port,
      clientId: config.mqtt.clientId,
      username: 'unused',
      password: jwtToken,
      protocol: 'mqtts',
      secureProtocol: 'TLSv1_2_method',
    };

    debug('connecting...');
    this.tokenIssuedAtTime = issuedAtTime;
    this.client = mqtt.connect(connectionArgs);
    this.setListeners();
  }

  setListeners() {
    // Subscribe to the /devices/{device-id}/config topic to receive config updates.
    this.client.subscribe(`/devices/${config.deviceId}/config`);

    this.client.on('error', (err) => {
      debug('error', err);
    });

    this.client.on('message', (topic, message) => {
      debug(topic, 'message received: ', Buffer.from(message, 'base64').toString('ascii'));
    });

    this.client.on('connect', (success) => {
      if (success) {
        debug('Client connected...');
        this.clientReady = true;

        if (!this.publishInProgress) {
          debug('MQTT: setting publishInProgress = true');
          this.publishInProgress = true;
          this.publishNextQueuedMessage();
        }
      } else {
        this.clientReady = false;
        debug('Client not connected...');
      }
    });

    this.client.on('close', () => {
      this.clientReady = false;
      this.publishInProgress = false;
      debug('MQTT: setting publishInProgress = false');
      debug('MQTT: client closed.');
      this.createClientConnection();
    });
  }

  publishNextQueuedMessage() {
    if (this.queue.length) {
      debug(`queue size is ${this.queue.length}`);
      const message = { ...this.queue[0] };
      this.prePublish(message);
    }
  }

  removeFromQueue(message) {
    this.queue = this.queue.filter(queueMessage => queueMessage.time !== message.time);
  }

  prePublish(message) {
    debug(`MQTT: checking token age ${message.time}`);
    const tokenAgeSec = parseInt((Date.now() / 1000), 10) - this.tokenIssuedAtTime;
    if (tokenAgeSec > config.jwt.TTLMins * 60) {
      debug(`MQTT: refreshing token after ${tokenAgeSec} seconds.`);
      this.client.end();
    } else {
      this.publish(message);
    }
  }

  publish(message) {
    debug(`MQTT: publishing ${message.time}`);
    const payload = JSON.stringify(message);

    this.client.publish(config.mqtt.topic, payload, { qos: 1 });

    this.removeFromQueue(message);

    if (this.queue.length) {
      debug(`queue size is ${this.queue.length}`);
      setTimeout(this.publishNextQueuedMessage, 1000);
    } else {
      debug('MQTT: setting publishInProgress = false');
      this.publishInProgress = false;
    }
  }

  pushMessageToQueue({ message }) {
    debug(`MQTT: pushing to queue ${message.time}`);
    
    this.queue.push(message);

    if (this.clientReady && !this.publishInProgress) {
      debug('MQTT: setting publishInProgress = true');
      this.publishInProgress = true;
      this.publishNextQueuedMessage();
    }
  }
}

module.exports = MqttClient;