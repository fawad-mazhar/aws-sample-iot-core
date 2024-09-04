import * as s3 from '../lib/aws/s3'
import { getDeviceThing, deleteDeviceThing } from '../lib/things'


export default async function(event: any) {
  const deviceSerial = event.pathParameters && event.pathParameters.deviceSerial

  try {
    const thing = await getDeviceThing(deviceSerial)
    if (thing && thing.thingName) {
      await deleteDeviceThing(deviceSerial)
      console.log('Thing deleted.')
    }
    await s3.deleteObject({
      Bucket: process.env.AUTH_PACKAGES_BUCKET!,
      Key: `packages/${deviceSerial}.tar.gz`,
    })
    console.log('Auth package deleted.')
  } catch (err: any) {
    if (err.name === 'ResourceNotFoundException') {
      throw new Error('[404] Device Not Found')
    } else {
      throw err
    }
  }
  
  return {}
}
