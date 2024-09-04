import { getDeviceThing, createDeviceThing, updateDeviceThing, updateDeviceThingGroup, ensureDeviceThingHasCertificate } from '../lib/things'
import { buildAuthPackage } from '../lib/auth-package'

export default async function(event: any) {
  const body = JSON.parse(event.body)
  const deviceSerial = event.pathParameters.deviceSerial
  let thing
  let authPackage

 
  try {
    thing = await getDeviceThing(deviceSerial)
  } catch (err: any) {
    if (err.name === 'ResourceNotFoundException') {
      // Thing doesn't exist yet
      thing = null
    } else {
      throw err
    }
  }
  
  
  if (thing) {
    // Okay to update
    const { HardwareVersionId, SoftwareVersionId } = body
    await updateDeviceThing(deviceSerial, { HardwareVersionId, SoftwareVersionId })
  } else {
    // Okay to create
    await createDeviceThing(deviceSerial)
  }

  // Ensure device has a certificate
  const certificateResponse: any = await ensureDeviceThingHasCertificate(deviceSerial)

  // Ensure device belongs to the proper group
  await updateDeviceThingGroup(deviceSerial)

  // Re-read the new thing
  thing = await getDeviceThing(deviceSerial)

  /*if (certificateResponse && certificateResponse.privateKey) {
  }*/
  authPackage = await buildAuthPackage(deviceSerial, thing.thingName!, certificateResponse)


  // Return thing information, and certificate information and auth package (if created)
  return Object.assign({deviceSerial}, certificateResponse, authPackage || {})
}
