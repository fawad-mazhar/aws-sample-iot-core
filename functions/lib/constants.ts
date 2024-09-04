/**
 * MQTT Api Status
 */
export const mqttApiStatus = {
  FAILED: 'FAILED',
  RUNNING: 'RUNNING',
  SUCCEEDED: 'SUCCEEDED',
  TIMED_OUT: 'TIMED_OUT',
  ABORTED: 'ABORTED'
}

/**
 * MQTT Api Unknown Response
 */

export const mqttUnknownResponse = {
  status: mqttApiStatus.FAILED,
  response: {
    message: 'Unknown.',
    type: 'unknown'
  }
}