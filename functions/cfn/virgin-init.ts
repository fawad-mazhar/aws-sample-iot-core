/**
 * Enable registry events
 * Turn indexing on
 * Create static thing group
 * Create thing type
 */

import { Handler } from 'aws-lambda'
import * as iot from '../lib/aws/iot'

const axios = require('axios');
const SUCCESS = 'SUCCESS'
const FAILED = 'FAILED'
const ENABLE = "ENABLE"
const DISABLE = "DISABLE"

let responseData = {}
 
 
export const handler: Handler = async (event, context) => {
  console.log(`REQUEST:: ${JSON.stringify(event, null, 2)}`)
  
  try {
    if (event['RequestType'] === 'Delete'){
      console.log('Deleting resources...')
      await iotEventConfigurations(DISABLE)
      await iotUpdateIndexingConfiguration(DISABLE)
      await cfnSend(event, context, SUCCESS, responseData)
    } else if (event['RequestType'] === 'Create') {
      await iotEventConfigurations(ENABLE)
      await iotUpdateIndexingConfiguration(ENABLE)
      await iotThingGroup(ENABLE)
      await iotThingType(ENABLE)
      await cfnSend(event, context, SUCCESS, responseData)
    } 
    else {
      await cfnSend(event, context, SUCCESS, responseData)
    }
  } catch (error) {
    console.log(error)
    await cfnSend(event, context, FAILED, responseData)
  }
  
}

// IoT Event Configurations
// This enables/disables management events to internal $aws topic
async function iotEventConfigurations(status: string) {
  console.log(`${status}: IoT event configurations...`)
  let response
  try {
    
    if (status === ENABLE) {
      
      response = await iot.updateEventConfigurations({
        eventConfigurations : {
          "CA_CERTIFICATE": {
            "Enabled": true
          },
          "CERTIFICATE": {
              "Enabled": true
          },
          "JOB": {
              "Enabled": true
          },
          "JOB_EXECUTION": {
              "Enabled": true
          },
          "POLICY": {
              "Enabled": true
          },
          "THING": {
              "Enabled": true
          },
          "THING_GROUP": {
              "Enabled": true
          },
          "THING_GROUP_HIERARCHY": {
              "Enabled": true
          },
          "THING_GROUP_MEMBERSHIP": {
              "Enabled": true
          },
          "THING_TYPE": {
              "Enabled": true
          },
          "THING_TYPE_ASSOCIATION": {
              "Enabled": true
          }
        }
      })
      console.log(JSON.stringify(response))
      
    } else {
      response = await iot.updateEventConfigurations({
        eventConfigurations : {
          "CA_CERTIFICATE": {
            "Enabled": false
          },
          "CERTIFICATE": {
              "Enabled": false
          },
          "JOB": {
              "Enabled": false
          },
          "JOB_EXECUTION": {
              "Enabled": false
          },
          "POLICY": {
              "Enabled": false
          },
          "THING": {
              "Enabled": false
          },
          "THING_GROUP": {
              "Enabled": false
          },
          "THING_GROUP_HIERARCHY": {
              "Enabled": false
          },
          "THING_GROUP_MEMBERSHIP": {
              "Enabled": false
          },
          "THING_TYPE": {
              "Enabled": false
          },
          "THING_TYPE_ASSOCIATION": {
              "Enabled": false
          }
        }
      })
      console.log(JSON.stringify(response))
    }

  } catch (error) {
    console.log(error)
  }
  return response
}

// Update indexing configuration
async function iotUpdateIndexingConfiguration(status: string) {
  console.log(`${status}: IoT update indexing configuration...`)
  let response
  try {
    if (status === ENABLE) {
      response = await iot.updateIndexingConfiguration({
        thingIndexingConfiguration: {
          thingIndexingMode: 'REGISTRY_AND_SHADOW',
          namedShadowIndexingMode: 'OFF',
          thingConnectivityIndexingMode: 'STATUS'
        },
        thingGroupIndexingConfiguration: {
          thingGroupIndexingMode: 'ON'
        }
      })
      console.log(JSON.stringify(response))
    } else {
      response = await iot.updateIndexingConfiguration({
        thingIndexingConfiguration: {
          thingIndexingMode: 'OFF',
          namedShadowIndexingMode: 'OFF',
          thingConnectivityIndexingMode: 'OFF'
        },
        thingGroupIndexingConfiguration: {
          thingGroupIndexingMode: 'OFF'
        }
      })
      console.log(JSON.stringify(response))
    }
  } catch (error) {
    console.log(error)
  }
  return response
}

// Thing group
async function iotThingGroup(status: string) {
  console.log(`${status}: IoT thing group...`)
  try {
    if (status === ENABLE) {
      const thingGroupResponse = await iot.createThingGroup({
        thingGroupName: process.env.IOT_DEVICE_THING_GROUP!
      }
      )
      console.log(JSON.stringify(thingGroupResponse))
      if (thingGroupResponse.thingGroupArn) {
        console.log('Attaching policy to the THING_GROUP...')
        const attachPolicyResponse = await iot.attachPolicy({
          policyName: process.env.IOT_DEVICE_POLICY_NAME!,
          target: thingGroupResponse.thingGroupArn
        })
        console.log(JSON.stringify(attachPolicyResponse))
      }
    } else {
      console.log('Delete "THING_GROUP" manually.')
      /**
       * This should be done manually for now as you would need to remove all the Things too.
       */
    }
  } catch (error) {
    console.log(error)
  }
}

// Thing type
async function iotThingType(status: string) {
  console.log(`${status}: IoT thing type...`)
  try {
    if (status === ENABLE) {
      const thingTypeResponse = await iot.createThingType({
        thingTypeName: process.env.IOT_DEVICE_THING_TYPE!,
        thingTypeProperties: {
          searchableAttributes : [
            'DeviceSerial',
            'SoftwareVersionId',
            'HardwareVersionId'
          ],
          thingTypeDescription: 'Acoustic Camera'
        } 
      })
      console.log(JSON.stringify(thingTypeResponse))
    } else {
      console.log('Delete "THING_TYPE" manually.')
      /**
       * This should be done manually for now as you would need to remove all the Things too.
       */
    }
  } catch (error) {
    console.log(error)    
  }
}

// CFN Response function to return status and responseData to CloudFormation
async function cfnSend(event: any, context: any, responseStatus: any, responseData: any) {
  let data
  try {
    const responseBody = JSON.stringify({
      Status: responseStatus,
      Reason: `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
      PhysicalResourceId: event.LogicalResourceId,
      StackId: event.StackId,
      RequestId: event.RequestId,
      LogicalResourceId: event.LogicalResourceId,
      Data: responseData
    })
    console.log(`cfnSend:: ${responseBody}`)
    const params = {
      url: event.ResponseURL,
      method: 'put',
      port: 443,
      headers: {
        'content-type': '',
        'content-length': responseBody.length,
      },
      data: responseBody,
    }

    data = await axios(params)
  } catch (err) {
    throw err
  }
  return data.status
}
