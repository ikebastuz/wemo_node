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
  if (typeof req.body.mac !== 'undefined' && !WemoApi.wemoIp) {
    try {
      result = await WemoApi.findWemoIp(req.body.mac);
    } catch (error) {
      result = error;
    }
  } else if (typeof req.body.state !== 'undefined') {
    try {
      result = await WemoApi.turnSwitch(req.body.state);
    } catch (error) {
      result = error;
    }
  } else {
    result = `WEMO IP already known: ${WemoApi.wemoIp}`;
  }
  console.log(result);
  res.send({ msg: result });
});

app.listen(port, function() {
  console.log(`Server running at http://127.0.0.1:${port}/`);
});

app.get('/mmm', () => {
  var nodemailer = require('nodemailer');

  var transporter = nodemailer.createTransport({
    service: 'Yandex',
    auth: {
      user: 'sub.zero.charisma@yandex.ru',
      pass: 'ilovedg00g13'
    }
  });

  var mailOptions = {
    from: 'sub.zero.charisma@yandex.ru',
    to: 'ikebastuz@gmail.com',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
});
