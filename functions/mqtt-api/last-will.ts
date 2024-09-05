/**
 * MQTT message listener for sending Zappy API requests from MQTT.
 * This is called by an AWS Rule that listens to topic filter zappy/api/+/lastwill.
 * This almost always happens when the device loses internet connectivity abruptly.
 *
 */
import { Handler } from 'aws-lambda'

export const handler: Handler = async (event, context) => {
  console.log('Received Last Will::', JSON.stringify(event))
  console.log('This almost always happens if the device disconnects ungracefully.')

  return {}
}
 
 
 
