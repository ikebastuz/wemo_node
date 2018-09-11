const express = require("express");
const bodyParser = require("body-parser");
const WemoApi = require("./api/wemo");

const app = express();

const port = 8082;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/switch", function(req, res) {
  if (typeof req.body.mac !== "undefined" && !WemoApi.wemoIp) {
    WemoApi.findWemoIp(req.body.mac)
      .then(msg => {
        console.log(msg);
        res.send({ msg: msg });
      })
      .catch(err => {
        console.log(err);
        res.send({ msg: err });
      });
  } else if (typeof req.body.state !== "undefined") {
    WemoApi.turnSwitch(req.body.state)
      .then(msg => {
        console.log(msg);
        res.send({ msg: msg });
      })
      .catch(err => {
        console.log(err);
        res.send({ msg: err });
      });
  } else {
    console.log(`WEMO IP already known: ${WemoApi.wemoIp}`);
    res.send({ msg: `WEMO IP already known: ${WemoApi.wemoIp}` });
  }
});

app.listen(port, function() {
  console.log(`Server running at http://127.0.0.1:${port}/`);
});
