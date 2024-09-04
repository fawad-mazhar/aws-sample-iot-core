# Mqtt Basic Publication/Subscription
---

Fawad Mazhar 2024

---

### Overview
The functionality is built on top of AWS IoT Core. To get started, make a call to the `dev` backend
```
>>> curl --location --request PUT 'https://<API_URL>/devices/<SERIAL>'
```
You should receive an IoT authentication package. Untar and place the following files:
* `cert.pem`
* `private_key.pem`
* `root-ca-ats.pem`
* `iot.cfg`
under `mqtt-client/` directory.

Once you have authentication file, run `python3.9 basic.py`
____________________



### Installation

-  Python 2.7+ or Python 3.3+ for X.509 certificate-based mutual authentication via port 8883
   and MQTT over WebSocket protocol with AWS Signature Version 4 authentication

```
>>> pip3.9 install AWSIoTPythonSDK libconf
```
____________________


### Basic MQTT Operations
```
MQTT_CLIENT.connect()
MQTT_CLIENT.publish("myTopic", "myPayload", 0)
MQTT_CLIENT.subscribe("myTopic", 1, customCallback)
MQTT_CLIENT.unsubscribe("myTopic")
MQTT_CLIENT.disconnect()
```
____________________


### Useful Links
- AWS IoT Device Client [link](https://github.com/awslabs/aws-iot-device-client)
- AWS IoT Device SDK C++ [link](https://github.com/aws/aws-iot-device-sdk-cpp)
- AWS IoT Device SDK C++ v2[Link](https://github.com/aws/aws-iot-device-sdk-cpp-v2)
- AWS IoT Device SDK Python [link](https://github.com/aws/aws-iot-device-sdk-python)
- AWS IoT Device SDK Python v2 [Link](https://github.com/aws/aws-iot-device-sdk-python-v2)