# Start guide

N.B.: Docker must be installed.

- Clone this repo
  ```sh
  git clone https://github.com/ikebastuz/wemo_node
  ```
- Open project folder
  ```sh
  cd wemo node
  ```
- Build docker image from repo
  ```sh
  docker build -t wemo_node .
  ```
- Run the image in detach mode with restart-always option
  ```sh
  docker run  -d --restart always --network=host wemo_node
  ```

# Checking if app found the switch

- Get list of running images
  ```sh
  docker ps
  ```
- Open image shell
  ```sh
  docker exec -it <CONTAINER_ID> bash
  ```
- Open cache folder
  ```sh
  cd cache
  ```
- Check if app cached the switch IP
  `sh cat wemoIp.json`
  If last command did output the ip - app has it and should be working fine

# Some commands to work with switch directly from console

Dont forget to put your IP address and PORT (one of these: 49152 or 49153)

- Get wemo state
  ```sh
  curl -0 -A '' -X POST -H 'Accept: ' -H 'Content-type: text/xml; charset="utf-8"' -H "SOAPACTION: \"urn:Belkin:service:basicevent:1#GetBinaryState\"" --data '<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:GetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"><BinaryState>1</BinaryState></u:GetBinaryState></s:Body></s:Envelope>' -s http://<IP_ADDRESS>:<PORT>/upnp/control/basicevent1 | grep "<BinaryState"  | cut -d">" -f2 | cut -d "<" -f1 | sed 's/0/OFF/g' | sed 's/1/ON/g'
  ```
- Turn wemo ON or OFF (set 0 or 1 inside BinaryState tag)
  ```sh
  curl -0 -A '' -X POST -H 'Accept: ' -H 'Content-type: text/xml; charset="utf-8"' -H "SOAPACTION: \"urn:Belkin:service:basicevent:1#SetBinaryState\"" --data '<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:SetBinaryState xmlns:u="urn:Belkin:service:basicevent:1"><BinaryState>1</BinaryState></u:SetBinaryState></s:Body></s:Envelope>' -s http://<IP_ADDRESS>:<PORT>/upnp/control/basicevent1
  ```
- Get wemo signal strength
  ```sh
  curl -0 -A '' -X POST -H 'Accept: ' -H 'Content-type: text/xml; charset="utf-8"' -H "SOAPACTION: \"urn:Belkin:service:basicevent:1#GetSignalStrength\"" --data '<?xml version="1.0" encoding="utf-8"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:GetSignalStrength xmlns:u="urn:Belkin:service:basicevent:1"><GetSignalStrength>0</GetSignalStrength></u:GetSignalStrength></s:Body></s:Envelope>' -s http://<IP_ADDRESS>:<PORT>/upnp/control/basicevent1 | grep "<SignalStrength"  | cut -d">" -f2 | cut -d "<" -f1
  ```
