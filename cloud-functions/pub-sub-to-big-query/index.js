const BigQuery = require('@google-cloud/bigquery');

const projectId = 'pi-iot-252121';
const datasetName = 'pi3_dht22_dataset';
const tableName = 'dht22_data';

const bigQuery = new BigQuery({
  projectId,
});

exports.pubsubToBQ = (event, context, callback) => {
  const data = JSON.parse(Buffer.from(event.data, 'base64').toString());
  console.log(data);

  bigQuery
    .dataset(datasetName)
    .table(tableName)
    .insert(data)
    .then(() => {
      console.log('Inserted rows');
      callback(); // task done
    })
    .catch((error) => {
      if (error && error.name === 'PartialFailureError') {
        if (error.errors && error.errors.length > 0) {
          console.log('Insert errors:');

          error.errors.forEach((errorText) => {
            console.error(errorText);
          });
        }
      } else {
        console.error('ERROR:', error);
      }

      callback(); // task done
    });
};
