const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");

const app = express();

let wemoIp = false;

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
  if (typeof req.body.mac !== "undefined" && !wemoIp) {
    findWemoIp(req.body.mac)
      .then(msg => {
        console.log(msg);
      })
      .catch(err => {
        console.log(err);
      });
  } else if (typeof req.body.state !== "undefined") {
    turnSwitch(req.body.state);
  }
});

app.listen(8081, function() {
  console.log("Server running at http://127.0.0.1:8081/");
});

const turnSwitch = (state, ip = wemoIp, port = "49152", useAltPort = false) => {
  if (ip) {
    const altPort = "49153";
    const cmd = `curl -0 -A '' -X POST -H 'Accept: ' -H 'Content-type: text/xml; charset="utf-8"' -H 'SOAPACTION: \"urn:Belkin:service:basicevent:1#SetBinaryState\"' --data '<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"><BinaryState>${state}</BinaryState></u:SetBinaryState></s:Body></s:Envelope>' -s http://${ip}:${
      useAltPort ? altPort : port
    }/upnp/control/basicevent1`;

    exec(cmd, function(error, stdout) {
      if (error !== null && !useAltPort) {
        turnSwitch(state, ip, port, true);
      } else {
        getState(ip, useAltPort ? altPort : port)
          .then(newState => {
            if (newState != state) {
              console.log("State haven't changed!");
            } else {
              console.log(`State successfully set to ${newState}!`);
            }
          })
          .catch(err => console.log(err));
      }
    });
  } else {
    console.log("Wemo IP still not found");
  }
};

const findWemoIp = mac => {
  console.log("looking for WEMO...");
  return new Promise((res, rej) => {
    // net-tools search
    //const cmd = `arp -a | grep ${mac} | cut -d"(" -f2- | cut -d")" -f1`;

    // iproute2 search
    const cmd = `ip neigh | grep ${mac} | cut -d" " -f1`;

    exec(cmd, function(error, stdout) {
      if (error !== null) {
        rej(error);
      } else if (stdout !== "" && stdout.split(".").length === 4) {
        wemoIp = stdout.trim();
        res("WEMO found! IP: " + stdout);
      }
    });
  });
};

const getState = (ip, port) => {
  return new Promise((res, rej) => {
    const cmd = `curl -0 -A '' -X POST -H 'Accept: ' -H 'Content-type: text/xml; charset="utf-8"' -H 'SOAPACTION: \"urn:Belkin:service:basicevent:1#GetBinaryState\"' --data '<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"><BinaryState>1</BinaryState></u:GetBinaryState></s:Body></s:Envelope>' -s http://${ip}:${port}/upnp/control/basicevent1 | 
    grep "<BinaryState"  | cut -d">" -f2 | cut -d "<" -f1 | sed 's/0/0/g' | sed 's/1/1/g'`;

    exec(cmd, function(error, stdout) {
      if (error !== null) {
        rej(error);
      } else {
        res(stdout.trim());
      }
    });
  });
};
