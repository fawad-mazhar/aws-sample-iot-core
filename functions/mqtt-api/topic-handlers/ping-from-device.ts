import { mqttApiStatus } from "../../lib/constants"

export default async function(deviceSerial: string, thingName: string, responseTopic: string, event: any) {
  // Return response via the response topic
  return {
    status: mqttApiStatus.SUCCEEDED,
    response: {
      message: 'Pong.'
    }
  }
}
