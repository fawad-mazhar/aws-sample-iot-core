#!/usr/bin/python
from AWSIoTPythonSDK.MQTTLib import AWSIoTMQTTClient
import time
import json
import io
import os
import libconf

MQTT_CLIENT = None

# Helper function to load desired environment variable
def get_required_environment_variable(env_var_name: str):
    try:
        env_var_value = os.environ[env_var_name]
    except Exception as e:
        raise ValueError('Missing required environment variable: ({}) '.format(env_var_name))

    return env_var_value


# Read 'iot.cfg' and populate the environment variables
def read_iot_cfg():
    with io.open('iot.cfg') as f:
        config = libconf.load(f)
    
    print(f'iot.cfg:: {json.dumps(config, sort_keys=True, indent=2)}')
    
    print('Setting environment....')
    os.environ['IOT_ENDPOINT'] = config['iot_endpoint']
    os.environ['THING_NAME'] = config['iot_thing_name']
    os.environ['CLIENT_ID'] = config['iot_client_id']
    os.environ['MQTT_TOPIC_PREFIX'] = config['mqtt_topic_prefix']
    os.environ['CERTIFICATE_PATH'] = config['certificate_filename']
    os.environ['PRIV_KEY_PATH'] = config['private_key_filename']
    os.environ['ROOT_CA_PATH'] = config['certificate_authority_filename']


# Publish messages to the AWS IoT Core
def publish(topic: str, data: dict, qos=0):
  payload = json.dumps(data, sort_keys=True, indent=2)
  print('')
  print('Publishing message to AWS IoT Core.')
  print(f'Topic:: {topic}')
  print(f'Payload:: {payload}')
  return MQTT_CLIENT.publish(topic=topic, payload=payload, QoS=qos)


# Device MQTT Api
def onMessageFromIoTCore(client, userdata, message):
    MQTT_TOPIC_PREFIX   = get_required_environment_variable('MQTT_TOPIC_PREFIX')
    REQUEST             = 'request'
    RESPONSE            = 'response'
    FAILED              = 'FAILED'
    SUCCEEDED           = 'SUCCEEDED'

    print('')
    print('🌥️  🌥️  🌥️  🌥️  🌥️  🌥️  🌥️  🌥️  🌥️  🌥️  🌥️  🌥️')
    print(f'Message recieved from AWS IoT Core.')
    print(f'Topic:: {message.topic}')
    print(f'Payload:: {message.payload.decode("utf-8")}')
    print('')

    topic = message.topic.replace(f'{MQTT_TOPIC_PREFIX}/{RESPONSE}/', '')
    payload = json.loads(message.payload.decode("utf-8"))
    response = payload.get('response')

    if topic == 'hello':
        pass
    elif topic == 'ping':
        pass
    else:
        print(f'Unknown topic:: "{topic}", Device api does not support.')
    


# Subscibe to the topic and when a message comes 'onMessage' handler is invoked
def subscribe(topic):
    MQTT_CLIENT.subscribe(f'{topic}', 1, onMessageFromIoTCore)
    print(f'Topic "{topic}" subscribed.')
    

# Disconnect MQTT connection with AWS IoT Core
def disconnect():
    print('Disconnecting...')
    MQTT_CLIENT.disconnect()
    print('Disconnected.')


# Main
def main():
        
    read_iot_cfg()

    IOT_ENDPOINT        = get_required_environment_variable('IOT_ENDPOINT')
    THING_NAME          = get_required_environment_variable('THING_NAME')
    CLIENT_ID           = get_required_environment_variable('CLIENT_ID')
    MQTT_TOPIC_PREFIX   = get_required_environment_variable('MQTT_TOPIC_PREFIX')
    CERTIFICATE_PATH    = get_required_environment_variable('CERTIFICATE_PATH')
    PRIV_KEY_PATH       = get_required_environment_variable('PRIV_KEY_PATH')
    ROOT_CA_PATH        = get_required_environment_variable('ROOT_CA_PATH')
    SHADOW_PREFIX       = f'$aws/things/{THING_NAME}/shadow'
    PORT                = 8883
    REQUEST             = 'request'
    RESPONSE            = 'response'


    print('Configuring mqtt connection...')
    global MQTT_CLIENT
    MQTT_CLIENT = AWSIoTMQTTClient(CLIENT_ID)
    MQTT_CLIENT.configureEndpoint(IOT_ENDPOINT, PORT)
    MQTT_CLIENT.configureCredentials(ROOT_CA_PATH, PRIV_KEY_PATH, CERTIFICATE_PATH)

    MQTT_CLIENT.configureAutoReconnectBackoffTime(1, 32, 20)
    MQTT_CLIENT.configureOfflinePublishQueueing(-1)  # Infinite offline Publish queueing
    MQTT_CLIENT.configureDrainingFrequency(2)  # Draining: 2 Hz
    MQTT_CLIENT.configureConnectDisconnectTimeout(10)  # 10 sec
    MQTT_CLIENT.configureMQTTOperationTimeout(5)  # 5 sec
    MQTT_CLIENT.disableMetricsCollection


    print(f'Connecting to AWS IoT Core at {IOT_ENDPOINT}:8883 ...')
    MQTT_CLIENT.connect()
    print('Connected.')


    # Subscribe to the Api response topic
    subscribe(f"{MQTT_TOPIC_PREFIX}/{RESPONSE}/#")
    time.sleep(2)

    
    # 
    # Sync 'app' State through IoT Shadows - we use named shadows for that
    # 
    publish(
        topic=f"{SHADOW_PREFIX}/name/app/update",
        data={
            "state": {
                "reported": {
                    "language": "en",
                    "color": "blue"
                }
            }
        }
    )
    time.sleep(2)
    

    publish(
        topic=f"{MQTT_TOPIC_PREFIX}/{REQUEST}/hello",
        data={}
    )
    time.sleep(2)



    # Keep the MQTT connection alive forever
    while True:
        time.sleep(5)


   
if __name__ == '__main__':
    try:
        main()
    except:
        print('Caught exception...')
        raise
