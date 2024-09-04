export default async function (event: any) {
  return {
    service: 'sample-iot-core-api',
    version: '1.0',
    stage: process.env.STAGE!,
  }
}
