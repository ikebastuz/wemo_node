const express = require('express');
const bodyParser = require('body-parser');
const WemoApi = require('./api/wemoApi');

const app = express();

const port = 8082;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

app.post('/switch', async function(req, res) {
  let result = 'Unknown Wemo switch request!';
  try {
    if (req.body.mac && !WemoApi.wemoIp) {
      result = await WemoApi.findWemoIp(req.body.mac);
    } else if (req.body.state !== undefined) {
      result = await WemoApi.turnSwitch(req.body.state);
    } else {
      result = `WEMO IP already known: ${WemoApi.wemoIp}`;
    }
  } catch (error) {
    result = error;
  }
  console.log(result);
  res.send({ msg: result });
});

app.listen(port, function() {
  console.log(`Server running at http://127.0.0.1:${port}/`);
});
