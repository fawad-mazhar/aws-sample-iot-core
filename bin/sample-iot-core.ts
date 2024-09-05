#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { SampleIotCoreStack } from '../lib/sample-iot-core-stack'

const app = new cdk.App();
new SampleIotCoreStack(app, 'sample-iot-core-dev', {
  env: {
    account: 'XXXXXXXXXXXX',
    region: 'eu-west-1',
  },
  stage: 'dev',
  prefix: 'sample-iot',
  coreLogLevel: 'DEBUG',
  deviceThingType: 'dev-zappy-device',
  deviceThingGroup: 'dev-zappy-devices',
  deviceThingNamePrefix: 'dev-zappy',
  deviceThingNameSuffix: 'device',
  awsIotSqlVersion: '2016-03-23',
  iotEndpoint: 'xxxypwldqxxx-ats.iot.eu-west-1.amazonaws.com' // Grab this link from https://eu-west-1.console.aws.amazon.com/iot/home?region=eu-west-1#/settings
})