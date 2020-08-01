/* eslint-disable no-console, import/no-unresolved, class-methods-use-this */
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
    const issuedAtTime = this.getTimestamp();
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

    this.client.on('error', this.onErrorHandler.bind(this));
    this.client.on('message', this.onMessageHandler.bind(this));
    this.client.on('connect', this.onConnectHandler.bind(this));
    this.client.on('close', this.onCloseHandler.bind(this));
  }

  onConnectHandler(success) {
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
  }

  onCloseHandler() {
    this.clientReady = false;
    this.publishInProgress = false;
    debug('MQTT: setting publishInProgress = false');
    debug('MQTT: client closed.');
  }

  onMessageHandler(topic, message) {
    debug(topic, 'message received: ', Buffer.from(message, 'base64').toString('ascii'));
  }

  onErrorHandler(error) {
    debug('error', error);

    if (!this.getIsTokenValid()) {
      this.client.end();
      this.createClientConnection();
    }
  }

  getTimestamp() {
    return parseInt((Date.now() / 1000), 10);
  }

  getIsTokenValid() {
    let isValid = true;
    debug('MQTT: checking token age');
    const tokenAgeSec = this.getTimestamp() - this.tokenIssuedAtTime;
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

  publish(message) {
    debug(`MQTT: publishing ${message.time}`);
    const payload = JSON.stringify(message);

    if (!message.isFake) {
      this.client.publish(config.mqtt.topic, payload, { qos: 1 });
    }

    this.dequeueMessage(message);

    if (this.queue.length) {
      debug(`queue size is ${this.queue.length}`);
      setTimeout(() => this.publishNextQueuedMessage(), 1000);
    } else {
      debug('MQTT: setting publishInProgress = false');
      this.publishInProgress = false;
    }
  }

  enqueueMessage({ message }) {
    debug(`MQTT: pushing to queue ${message.time}`);

    this.queue.push(message);

    if (this.clientReady && !this.publishInProgress) {
      debug('MQTT: setting publishInProgress = true');
      this.publishInProgress = true;
      this.publishNextQueuedMessage();
    }
  }

  dequeueMessage(message) {
    this.queue = this.queue.filter((queueMessage) => queueMessage.time !== message.time);
  }
}

module.exports = MqttClient;
