var BigQuery = require('@google-cloud/bigquery'); 
var projectId = 'pi-iot-252121'; 
 
var bigquery = new BigQuery({ 
  projectId: projectId, 
}); 
 
var datasetName = 'pi3_dht22_dataset'; 
var tableName = 'dht22_data'; 
 
exports.pubsubToBQ = function(event, context, callback) { 
  var msg = event;
  console.log(msg);
  var data = JSON.parse(Buffer.from(msg.data, 'base64').toString()); 
  console.log(data); 
  bigquery 
    .dataset(datasetName) 
    .table(tableName) 
    .insert(data) 
    .then(function() { 
      console.log('Inserted rows'); 
      callback(); // task done 
    }) 
    .catch(function(err) { 
      if (err && err.name === 'PartialFailureError') { 
        if (err.errors && err.errors.length > 0) { 
          console.log('Insert errors:'); 
          err.errors.forEach(function(err) { 
            console.error(err); 
          }); 
        } 
      } else { 
        console.error('ERROR:', err); 
      } 
 
      callback(); // task done 
    }); 
};