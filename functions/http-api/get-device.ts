import { getDeviceThing } from '../lib/things'
import * as s3 from '../lib/aws/s3'

export default async function(event: any) {
  const deviceSerial = event.pathParameters && event.pathParameters.deviceSerial
  let thing

  try {
    thing = await getDeviceThing(deviceSerial)
  } catch (err: any) {
    if (err.name === 'ResourceNotFoundException') {
      throw new Error('[404] Device Not Found')
    } else {
      throw err
    }
  }
  
  // Okay to return; build response
  const response = thing.attributes || {}

  // Include auth package download URL
  const filename = `${deviceSerial}.tar.gz`
  // Return a signed download URL for the new tar
  const signedUrl = await s3.getPreSignedUrl({
    Bucket: process.env.AUTH_PACKAGES_BUCKET!,
    Key: `packages/${filename}`,
    ResponseContentDisposition: `attachment; filename=${filename}`,
  })
  response.downloadUrl = signedUrl

  return response
}
