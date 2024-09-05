/**
 * MQTT shadow listener...
 *
 */
import { Handler } from 'aws-lambda'

export const handler: Handler = async (event, context) => {
  console.log('Received Shadow Document::', JSON.stringify(event))
  return {}  
}