/**
 * MQTT message listener for sending Zappy API requests from MQTT.
 * This is called by an AWS Rule that listens to topic filter zappy/api/request/#.
 * Responses are sent to the same topic suffixed with /response.
 *
 */
import { Handler } from 'aws-lambda'
import * as iot from '../lib/aws/iot'
import { mqttApiStatus } from "../lib/constants"
import helloFromDevice from './topic-handlers/hello-from-device'
import pingFromDevice from './topic-handlers/ping-from-device'


interface ApiResponsePayload {
  status: string
  response?: any
}

type TopicHandler = (deviceSerial: string, thingName: string, responseTopic: string, event: any) => Promise<ApiResponsePayload>

interface TopicHandlerMap {
  [topicSuffix: string]: TopicHandler
}


// Map MQTT topic suffixes to handler functions (this is without the zappy/api/thingName/request )
const TOPIC_HANDLERS: TopicHandlerMap = {
  'hello': helloFromDevice,
  'ping': pingFromDevice
}

export const handler: Handler = async (event, context) => {
  console.log('Processing MQTT API Request:', JSON.stringify(event))
  if (!event.topic || typeof event.topic !== 'string') {
    console.error('Event has no topic, cannot process API request')
    throw new Error('No Topic in Event')
  }
  const topicMatch = event.topic.match(/zappy\/api\/([^\/]+)\/request\/(.*)/)
  const thingName = topicMatch && topicMatch[1]
  const topicSuffix = topicMatch && topicMatch[2]
  if (!thingName) {
    console.error('Event topic has no thing name, cannot process API request:', event.topic)
    throw new Error('Invalid Topic in Event')
  }

  const isZappyThing = thingName.slice(0, process.env.IOT_DEVICE_THING_NAME_PREFIX!.length) === process.env.IOT_DEVICE_THING_NAME_PREFIX!
  // Get deviceSerial from thing name
  let deviceSerial
  if (isZappyThing) {
    deviceSerial = thingName.slice(process.env.IOT_DEVICE_THING_NAME_PREFIX!.length + 1, process.env.IOT_DEVICE_THING_NAME_PREFIX!.length + 1 + 8)
  } else {
    console.error(`Event topic contains invalid thing name: ${thingName} (doesnt match ${process.env.IOT_DEVICE_THING_NAME_PREFIX})`)
    throw new Error('Invalid Topic in Event')
  }

  // Format response topic by changing "request" to "response"
  const responseTopic = `zappy/api/${thingName}/response/${topicSuffix}`
  console.log('Processing API request from deviceSerial', deviceSerial, 'thingName', thingName, 'topicSuffix', topicSuffix, 'responseTopic', responseTopic)

  // Now we can process the API request and respond to the Thing Name
  const mappedHandler = TOPIC_HANDLERS[topicSuffix]
  let responsePayload: ApiResponsePayload
  if (mappedHandler) {
    // Process API request
    try {
      responsePayload = await mappedHandler(deviceSerial, thingName, responseTopic, event)
    } catch (err: any) {
      // Error processing API request
      const errorMessage = `Error processing API request: ${err.message}`
      console.error(errorMessage)
      responsePayload = {
        status: mqttApiStatus.FAILED,
        response: {
          message: errorMessage,
        }
      }
    }
  } else {
    // Topic match not found
    responsePayload = {
      status: mqttApiStatus.FAILED,
      response: {
        message: 'Topic Not Found'
      }
    }
  }

  // Always send back a response when we can
  console.log(JSON.stringify(responsePayload))
  await iot.publish({
    topic: responseTopic,
    payload: Buffer.from(JSON.stringify(responsePayload)),
  })

  return {}

}
 
 
 
