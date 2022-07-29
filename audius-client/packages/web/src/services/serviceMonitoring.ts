import {
  Name,
  MonitorPayload,
  ServiceMonitorType,
  IntKeys
} from '@audius/common'

import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import { track } from 'store/analytics/providers'

/**
 * Given an integer-percent value (e.g. 45), whether or not based on random chance,
 * we should record
 * @param percent
 */
const shouldRecord = (percent: number) => {
  return Math.random() <= percent / 100.0
}

const healthCheck = (payload: MonitorPayload, type: ServiceMonitorType) => {
  const sampleRate =
    remoteConfigInstance.getRemoteVar(
      IntKeys.SERVICE_MONITOR_HEALTH_CHECK_SAMPLE_RATE
    ) || 0
  if (shouldRecord(sampleRate)) {
    payload.type = type
    track(Name.SERVICE_MONITOR_HEALTH_CHECK, payload)
  }
}

const request = (payload: MonitorPayload, type: ServiceMonitorType) => {
  const sampleRate =
    remoteConfigInstance.getRemoteVar(
      IntKeys.SERVICE_MONITOR_REQUEST_SAMPLE_RATE
    ) || 0
  if (shouldRecord(sampleRate)) {
    payload.type = type
    track(Name.SERVICE_MONITOR_REQUEST, payload)
  }
}

const discoveryNode = {
  healthCheck: (payload: MonitorPayload) =>
    healthCheck(payload, 'discovery-node'),
  request: (payload: MonitorPayload) => request(payload, 'discovery-node')
}

const contentNode = {
  healthCheck: (payload: MonitorPayload) =>
    healthCheck(payload, 'content-node'),
  request: (payload: MonitorPayload) => request(payload, 'content-node')
}

export const monitoringCallbacks = {
  discoveryNode,
  contentNode
}
