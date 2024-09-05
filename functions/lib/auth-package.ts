import * as Tar from 'tar-fs'
import * as zlib from 'zlib'
import * as tmp from 'tmp'
import * as fs from 'fs'
import * as path from 'path'
import * as s3 from './aws/s3'
import { getDeviceThing } from './things'



/**
 * SAMPLE iot.cfg
 *  
 * iot_device_name=""
 * iot_endpoint=""
 * iot_thing_arn=""
 * mqtt_topic_prefix="zappy/api/" 
 */

// Create a tar.gz package from the sourcePath directory, save in destinationPath
async function createTar(sourcePath: string, destinationPath: string) {
  const entries = fs.readdirSync(sourcePath)
  const tarOptions = {
    entries: entries,
    map: function(header: any) {
      header.name = 'iot/' + header.name
      header.uid = 0
      header.gid = 0
      header.uname = 'root'
      header.gname = 'root'
      return header
    },
  }
  const gzipOptions = {
    level: 6,
    memLevel: 6,
  }
  await new Promise((resolve: any, reject: any) => {
    Tar.pack(sourcePath, tarOptions)
    .on('error', err => reject(err))
    .pipe(zlib.createGzip(gzipOptions))
    .on('error', err => reject(err))
    .pipe(fs.createWriteStream(destinationPath))
    .on('error', err => reject(err))
    .on('finish', () => resolve())
  })
}

// Generate all the necessary files in the tar directory
async function generateAuthEnvironment(deviceSerial: string, deviceName: string, CertificateResponse: any, SourcePath: string) {

  const endpoint = process.env.IOT_ENDPOINT
  const device = await getDeviceThing(deviceSerial)
  fs.writeFileSync(path.join(SourcePath, 'cert.pem'), CertificateResponse.certificatePem)
  fs.writeFileSync(path.join(SourcePath, 'private_key.pem'), CertificateResponse.privateKey)
  
  const iotCfgContent = `iot_thing_name="${deviceName}"
iot_client_id="${deviceName}"
iot_thing_arn="${device.thingArn!}"
iot_endpoint="${endpoint}"
mqtt_topic_prefix="zappy/api/${deviceName}"
shadow_prefix="$aws/things/${deviceName}/shadow"
mqtt_connection_port=8883
certificate_filename="cert.pem"
private_key_filename="private_key.pem"
certificate_authority_filename="root-ca-ats.pem"
`

  console.log(`Content of iot.cfg: ${iotCfgContent}`)

  fs.writeFileSync(path.join(SourcePath, 'iot.cfg'), iotCfgContent)

  // Write CA ATS certificate
  const ca = '-----BEGIN CERTIFICATE-----\nMIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF\nADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6\nb24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL\nMAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv\nb3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj\nca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM\n9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw\nIFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6\nVOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L\n93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm\njgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC\nAYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA\nA4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI\nU5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs\nN+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv\no/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU\n5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy\nrqXRfboQnoZsG4q5WTP468SQvvG5\n-----END CERTIFICATE-----\n'
  fs.writeFileSync(path.join(SourcePath, 'root-ca-ats.pem'), ca)
  
}

export async function buildAuthPackage(deviceSerial: string, deviceName: string, certificateResponse: any) {
  
  const filename = `${deviceSerial}.tar.gz`
  let pkgExistsInS3 = false
  try {
    await s3.headObject({
      Bucket: process.env.AUTH_PACKAGES_BUCKET!,
      Key: `packages/${filename}`,
    })
    pkgExistsInS3 = true
    console.log('Using previously generated auth package...')
  } catch (error) {
    console.log(error)
  }
  
  if (!pkgExistsInS3) {

    if (certificateResponse && certificateResponse.privateKey) {
      // Create temporary directory and file for tar package
      const tarFile = tmp.fileSync()
      const tmpDir = tmp.dirSync({ unsafeCleanup: true })
      const sourcePath = tmpDir.name
      
      console.log('Generating auth environment...')
      await generateAuthEnvironment(deviceSerial, deviceName, certificateResponse, sourcePath)
      
      // Build the tar and save it in S3
      console.log('Generating tar file...')
      const tar = await createTar(sourcePath, tarFile.name)
      await s3.putObject({
        Bucket: process.env.AUTH_PACKAGES_BUCKET!,
        Key: `packages/${filename}`,
        ContentType: 'application/octet-stream',
        Body: fs.createReadStream(tarFile.name)
      })
      
      // Clean up
      console.log('Cleaning up...')
      tmpDir.removeCallback()
      tarFile.removeCallback()
    } else {
      throw new Error("Empty 'certificateResponse'.")
    }
  
  }

  const signedUrl = await s3.getPreSignedUrl({
    Bucket: process.env.AUTH_PACKAGES_BUCKET!,
    Key: `packages/${filename}`,
    ResponseContentDisposition: `attachment; filename=${filename}`,
  })

  return {
    downloadUrl: signedUrl,
  }
}
