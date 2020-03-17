const nodeDhtSensor = require('node-dht-sensor');

class DhtSensor {
  constructor() {
    nodeDhtSensor.initialize(22, 2); // `2` => GPIO2
  }

  fetchData() {
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
