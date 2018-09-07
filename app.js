const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
var fs = require("fs");

const app = express();

const port = 8082;

let wemoIp = false;
let wemoIpLookupTimeout = false;

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
        res.send({ msg: msg });
      })
      .catch(err => {
        console.log(err);
        res.send({ msg: err });
      });
  } else if (typeof req.body.state !== "undefined") {
    turnSwitch(req.body.state)
      .then(msg => {
        console.log(msg);
        res.send({ msg: msg });
      })
      .catch(err => {
        console.log(err);
        res.send({ msg: err });
      });
  } else {
    console.log(`WEMO IP already known: ${wemoIp}`);
    res.send({ msg: `WEMO IP already known: ${wemoIp}` });
  }
});

app.listen(port, function() {
  console.log(`Server running at http://127.0.0.1:${port}/`);
});

const turnSwitch = (state, ip = wemoIp, port = "49152", useAltPort = false) => {
  return new Promise((res, rej) => {
    if (ip) {
      const altPort = "49153";
      const cmd = `curl -0 -A '' -X POST -H 'Accept: ' -H 'Content-type: text/xml; charset="utf-8"' -H 'SOAPACTION: \"urn:Belkin:service:basicevent:1#SetBinaryState\"' --data '<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"><BinaryState>${state}</BinaryState></u:SetBinaryState></s:Body></s:Envelope>' -s http://${ip}:${
        useAltPort ? altPort : port
      }/upnp/control/basicevent1`;

      exec(cmd, function(error, stdout) {
        if (error !== null && !useAltPort) {
          turnSwitch(state, ip, port, true)
            .then(msg => res(msg))
            .catch(err => rej(err));
        } else {
          getState(ip, useAltPort ? altPort : port)
            .then(newState => {
              if (newState != state) {
                console.log("State haven't changed!");
                res("State haven't changed!");
              } else {
                console.log(`State successfully set to ${newState}!`);
                res(`State successfully set to ${newState}!`);
              }
            })
            .catch(err => {
              console.log(err);
              rej(err);
            });
        }
      });
    } else {
      console.log("Wemo IP still not found");
    }
  });
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
        cacheIp(wemoIp);
        clearTimeout(wemoIpLookupTimeout);
        res("WEMO found! IP: " + wemoIp);
      } else {
        console.log("WEMO IP not found. Looking up for cache...");
        wemoIpLookupTimeout = setTimeout(function() {
          findWemoIp(mac)
            .then(msg => {
              console.log(msg);
            })
            .catch(err => {
              console.log(err);
            });
        }, 15000);

        fs.readFile("./cache/wemoIp.txt", "utf8", function(err, contents) {
          if (contents !== undefined && contents.length > 0) {
            wemoIp = contents.trim();
            res(
              "WEMO IP loaded from cache: " +
                wemoIp +
                ". Will rescan network in 15 secs"
            );
          } else {
            rej(
              "Cant find WEMO IP and have no cache! Will rescan network in 15 secs"
            );
          }
        });
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

const cacheIp = ip => {
  fs.writeFile("./cache/wemoIp.txt", ip, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("WEMO IP was cached!");
  });
};
