/* eslint-disable class-methods-use-this */
const nodeDhtSensor = require('node-dht-sensor');
const config = require('./config');

class DhtSensor {
  constructor() {
    nodeDhtSensor.initialize(22, 2); // `2` => GPIO2
  }

  getReadingTime() {
    // https://stackoverflow.com/a/11150727/1015046
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  fetchData() {
    if (config.useFakeSensor) {
      return {
        temp: '20.0',
        humd: '50.0',
        time: this.getReadingTime(),
        isFake: true,
      };
    }

    const readout = nodeDhtSensor.read();
    const temp = readout.temperature.toFixed(2);
    const humd = readout.humidity.toFixed(2);

    return {
      temp,
      humd,
      time: this.getReadingTime(),
    };
  }
}

module.exports = DhtSensor;
