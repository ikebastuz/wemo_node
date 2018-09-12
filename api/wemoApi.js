const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

class WemoApi {
  constructor() {
    this.wemoIp = false;
    this.wemoIpLookupTimeout = false;
    this.port = "49152";
    this.altPort = "49153";
    this.arpExists = 0;
  }

  turnSwitch(state, ip = this.wemoIp, useAltPort = false) {
    return new Promise((res, rej) => {
      if (ip) {
        const cmd = `curl -0 -A '' -X POST -H 'Accept: ' -H 'Content-type: text/xml; charset="utf-8"' -H 'SOAPACTION: \"urn:Belkin:service:basicevent:1#SetBinaryState\"' --data '<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"><BinaryState>${state}</BinaryState></u:SetBinaryState></s:Body></s:Envelope>' -s http://${ip}:${
          useAltPort ? this.altPort : this.port
        }/upnp/control/basicevent1`;

        exec(cmd, error => {
          if (error !== null && !useAltPort) {
            this.turnSwitch(state, ip, true)
              .then(msg => res(msg))
              .catch(err => rej(err));
          } else {
            this.getState(ip, useAltPort ? this.altPort : this.port)
              .then(newState => {
                if (newState != state) {
                  res("State haven't changed!");
                } else {
                  res(`State successfully set to ${newState}!`);
                }
              })
              .catch(err => {
                rej(err);
              });
          }
        });
      } else {
        rej("Wemo IP still not found");
      }
    });
  }

  getState(ip, port) {
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
  }

  async findWemoIp(mac) {
    try{
      this.arpExists = await this.checkArpExists();
    } catch(e){
      this.arpExists = 0;
    }
    console.log("looking for WEMO...");
    return new Promise((res, rej) => {
      // iproute2 search
      let cmd = `ip neigh | grep ${mac} | cut -d" " -f1`;

      if (this.arpExists == 1) {
        // net-tools search
        cmd = `arp -a | grep ${mac} | cut -d"(" -f2- | cut -d")" -f1`;
      }
      exec(cmd, (error, stdout) => {
        if (error !== null) {
          rej(error);
        } else if (stdout !== "" && stdout.split(".").length === 4) {
          this.wemoIp = stdout.trim();
          this.cacheIp(this.wemoIp);
          clearTimeout(this.wemoIpLookupTimeout);
          res("WEMO found! IP: " + this.wemoIp);
        } else {
          console.log("WEMO IP not found. Looking up for cache...");
          this.wemoIpLookupTimeout = setTimeout(() => {
            this.findWemoIp(mac)
              .then(msg => {
                console.log(msg);
              })
              .catch(err => {
                console.log(err);
              });
          }, 15000);

          fs.readFile(
            path.join(__dirname, "../cache/wemoIp.json"),
            "utf8",
            (err, contents) => {
              if (contents !== undefined && contents.length > 0) {
                this.wemoIp = JSON.parse(contents.trim());
                res(
                  "WEMO IP loaded from cache: " +
                    this.wemoIp +
                    ". Will rescan network in 15 secs"
                );
              } else {
                rej(
                  "Cant find WEMO IP and have no cache! Will rescan network in 15 secs"
                );
              }
            }
          );
        }
      });
    });
  }

  cacheIp(ip) {
    fs.writeFile(path.join(__dirname, "../cache/wemoIp.json"), JSON.stringify(ip), function(
      err
    ) {
      if (err) {
        return console.log(err);
      }
      console.log("WEMO IP was cached!");
    });
  }

  checkArpExists(){
    return new Promise((res, rej) => {
      let cmd = 
        `if which arp >/dev/null; then
            echo 1
        else
            echo 0
        fi`;
      exec(cmd, (error, stdout) => {
        let result = 0;
        if(stdout.trim() == "1"){
          result = 1;
        }
        res(result);
      });
    })
    
  }
}

module.exports = new WemoApi();
