/* eslint-disable no-console, import/no-unresolved */
const debug = require('debug')('mqtt-client');
const mqtt = require('mqtt');
const config = require('./config');
const { createJwtToken } = require('./jwt');

class MqttClient {
  constructor() {
    this.client = null;
    this.clientReady = false;
    this.tokenIssuedAtTime = 0;
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
      keepalive: 60 * 45,
    };

    debug('connecting...');
    this.tokenIssuedAtTime = issuedAtTime;
    this.client = mqtt.connect(connectionArgs);
    this.setListeners();
  }

  setListeners() {
    this.client.subscribe(`/devices/${config.deviceId}/config`);

    this.client.on('error', (err) => {
      debug('error', err);
      if (!this.getIsTokenValid()) {
        this.client.end();
        this.createClientConnection();
      }
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
    });
  }

  getIsTokenValid() {
    let isValid = true;
    debug('MQTT: checking token age');
    const tokenAgeSec = parseInt((Date.now() / 1000), 10) - this.tokenIssuedAtTime;
    if (tokenAgeSec > config.jwt.TTLMins * 60) {
      debug(`MQTT: refreshing token after ${tokenAgeSec} seconds.`);
      isValid = false;
    }

    return isValid;
  }

  publishNextQueuedMessage() {
    if (this.queue.length) {
      debug(`queue size is ${this.queue.length}`);
      const message = { ...this.queue[0] };

      if (this.getIsTokenValid()) {
        this.publish(message);
      } else {
        this.client.end();
        this.createClientConnection();
      }
    }
  }

  removeFromQueue(message) {
    this.queue = this.queue.filter((queueMessage) => queueMessage.time !== message.time);
  }

  publish(message) {
    debug(`MQTT: publishing ${message.time}`);
    const payload = JSON.stringify(message);

    if (!message.isFake) {
      this.client.publish(config.mqtt.topic, payload, { qos: 1 });
    }

    this.removeFromQueue(message);

    if (this.queue.length) {
      debug(`queue size is ${this.queue.length}`);
      setTimeout(() => this.publishNextQueuedMessage, 1000);
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
