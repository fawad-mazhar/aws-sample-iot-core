/**
 * Utilities for managing things. These are called from the API endpoint handlers.
 */

import * as iot from './aws/iot'

export async function getAllDeviceThings() {
  let allThings: any[] = []
  let nextToken

  do {
    const response = await iot.listThings({
      thingTypeName: process.env.IOT_DEVICE_THING_TYPE,
      nextToken: nextToken,
    })
    allThings = allThings.concat(response.things)
    nextToken = response.nextToken
  } while (nextToken)

  return allThings
}

export async function getDeviceThing(DeviceSerial: string) {
  console.log(`Describing device: ${DeviceSerial}`)
  const response = await iot.describeThing({
    thingName: process.env.IOT_DEVICE_THING_NAME_PREFIX + '-' + DeviceSerial + '-' + (process.env.IOT_DEVICE_THING_NAME_SUFFIX || ''),
  })
  console.log(JSON.stringify(response))
  return response
}

export async function createDeviceThing(DeviceSerial: string) {
  console.log(`Creating device: ${DeviceSerial}`)
  const response = await iot.createThing({
    thingName: process.env.IOT_DEVICE_THING_NAME_PREFIX + '-' + DeviceSerial + '-' + (process.env.IOT_DEVICE_THING_NAME_SUFFIX || ''),
    thingTypeName: process.env.IOT_DEVICE_THING_TYPE,
    attributePayload: {
      attributes: {
        DeviceSerial,
        CreatedAt: new Date().toJSON(),
        UpdatedAt: new Date().toJSON(),
      },
      merge: true,
    },
  })
  console.log(JSON.stringify(response))
  return response
}

export async function updateDeviceThing(DeviceSerial: string, DeviceAttributes: any) {
  const response = await iot.updateThing({
    thingName: process.env.IOT_DEVICE_THING_NAME_PREFIX + '-' + DeviceSerial + '-' + (process.env.IOT_DEVICE_THING_NAME_SUFFIX || ''),
    thingTypeName: process.env.IOT_DEVICE_THING_TYPE,
    attributePayload: {
      attributes: {
        ...DeviceAttributes,
        UpdatedAt: new Date().toJSON(),
      },
      merge: true,
    },
  })
  return response
}

export async function deleteDeviceThing(DeviceSerial: string) {
  console.log(`Deleting device: ${DeviceSerial}`)
  // Ensure device thing's certificate is deleted
  await deleteDeviceThingCertificate(DeviceSerial)
  // Actually delete the thing
  const response = await iot.deleteThing({
    thingName: process.env.IOT_DEVICE_THING_NAME_PREFIX + '-' + DeviceSerial + '-' + (process.env.IOT_DEVICE_THING_NAME_SUFFIX || ''),
  })
  return response
}

export async function updateDeviceThingGroup(DeviceSerial: string) {
  console.log(`Adding device: ${DeviceSerial} to thing group: ${process.env.IOT_DEVICE_THING_GROUP}`)
  const response = await iot.addThingToThingGroup({
    thingName: process.env.IOT_DEVICE_THING_NAME_PREFIX + '-' + DeviceSerial + '-' + (process.env.IOT_DEVICE_THING_NAME_SUFFIX || ''),
    thingGroupName: process.env.IOT_DEVICE_THING_GROUP,
  })
  console.log(JSON.stringify(response))
  return response
}

export async function ensureDeviceThingHasCertificate(DeviceSerial: string) {
  const thingName = process.env.IOT_DEVICE_THING_NAME_PREFIX + '-' + DeviceSerial + '-' + (process.env.IOT_DEVICE_THING_NAME_SUFFIX || '')
  let certificateArn
  let certResponse

  const principalsResponse = await iot.listThingPrincipals({
    thingName: thingName,
  })

  if (principalsResponse.principals && principalsResponse.principals[0]) {
    // Get existing certificate info
    console.log(`Existing certificate: ${JSON.stringify(principalsResponse.principals[0])}`)
    certificateArn = principalsResponse.principals[0]
  } else {
    // Create and attach certificate
    console.log(`Creating certificate for device: ${DeviceSerial}`)
    certResponse = await iot.createKeysAndCertificate({
      setAsActive: true,
    })
    certificateArn = certResponse.certificateArn!
    await iot.attachThingPrincipal({
      principal: certificateArn,
      thingName: thingName,
    })
  }

  return {
    certificateArn: certificateArn,
    certificatePem: certResponse ? certResponse.certificatePem : undefined,
    publicKey: certResponse ? certResponse.keyPair!.PublicKey : undefined,
    privateKey: certResponse ? certResponse.keyPair!.PrivateKey : undefined,
  }
}

async function detachAndDeleteCertificate(CertificateId: string, CertificateArn: string) {
  // Start by deactivating the certificate
  console.log(`Deactivating certificate: ${CertificateId}`)
  await iot.updateCertificate({
    certificateId: CertificateId,
    newStatus: 'INACTIVE',
  })

  // Find out what things this certificate is attached to
  let nextToken
  do {
    const thingsResponse = await iot.listPrincipalThings({
      principal: CertificateArn,
    })
    nextToken = thingsResponse.nextToken
    const attachedThings = thingsResponse.things || []
    for (let attachedThingIndex in attachedThings) {
      const attachedThing = attachedThings[attachedThingIndex]
      // Detach this thing from the certificate
      console.log(`Detaching certificate from thing: ${JSON.stringify(attachedThing)}`)
      await iot.detachThingPrincipal({
        thingName: attachedThing,
        principal: CertificateArn,
      })
    }
  } while (nextToken)

  const thingsCheckResponse = await iot.listPrincipalThings({
    principal: CertificateArn,
  })
  console.log(`After detaching, certificate is attached to: ${JSON.stringify(thingsCheckResponse)}`)


  console.log(`Deleting certificate: ${CertificateId}`)
  let retry = false
  let retries = 0
  do {
    retry = false
    try {
      await iot.deleteCertificate({
        certificateId: CertificateId,
        forceDelete: true
      })
      console.log('Deleted certificate', CertificateId)
    } catch (err: any) {
      if (err.name === 'CertificateStateException' || err.name === 'DeleteConflictException') {
        // Still waiting for INACTIVE or things to detach
        console.log(`Retrying delete of certificate: ${CertificateId} (${retries})`)
        retry = true
        retries += 1
      } else {
        throw err
      }
    }
  } while (retry && retries < 10)
}

export async function deleteDeviceThingCertificate(DeviceSerial: string) {
  const thingName = process.env.IOT_DEVICE_THING_NAME_PREFIX + '-' + DeviceSerial + '-' + (process.env.IOT_DEVICE_THING_NAME_SUFFIX || '')

  const principalsResponse = await iot.listThingPrincipals({
    thingName: thingName,
  })
  if (principalsResponse.principals && principalsResponse.principals.length > 0) {
    for (let principalIndex in principalsResponse.principals) {
      const principal = principalsResponse.principals[principalIndex]
      console.log(`Detaching and deleting existing certificate: ${JSON.stringify(principal)}`)
      const certificateArn = principal
      const certificateId = certificateArn.replace(/^arn:.*:cert\//, '')
      await detachAndDeleteCertificate(certificateId, certificateArn)
    }
  }

  return {}
}

export async function getDeviceShadows(DeviceSerial: string) {
  const response = {} as any
  const thingName = process.env.IOT_DEVICE_THING_NAME_PREFIX + '-' + DeviceSerial + '-' + (process.env.IOT_DEVICE_THING_NAME_SUFFIX || '')
  console.log(`getDeviceShadows:: ${thingName}`)
  const shadowsResponse = await iot.listNamedShadowsForThing({
    thingName: thingName,
  })
  for (const shadowName of shadowsResponse.results || []) {
    const shadow = await iot.getThingShadow({
      thingName: thingName,
      shadowName: shadowName,
    })
    if (shadow.payload) {
      const payload = JSON.parse((Buffer.from(shadow.payload)).toString())  
      response[shadowName] = payload || {}
    }
  }
  return response
}
