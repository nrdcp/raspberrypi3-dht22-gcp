/* eslint-disable class-methods-use-this */
const nodeDhtSensor = require('node-dht-sensor');
const config = require('./config');

class DhtSensor {
  constructor() {
    nodeDhtSensor.initialize(22, 2); // `2` => GPIO2
  }

  fetchData() {
    if (config.useFakeSensor) {
      return {
        temp: '20.0',
        humd: '50.0',
        time: new Date().toISOString().slice(0, 19).replace('T', ' '),
        isFake: true,
      };
    }

    const readout = nodeDhtSensor.read();
    const temp = readout.temperature.toFixed(2);
    const humd = readout.humidity.toFixed(2);

    return {
      temp,
      humd,
      time: new Date().toISOString().slice(0, 19).replace('T', ' '), // https://stackoverflow.com/a/11150727/1015046
    };
  }
}

module.exports = DhtSensor;
