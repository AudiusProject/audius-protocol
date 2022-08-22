import { MonitorPayload } from 'models/index'

export type ServiceMonitoring = {
  healthCheck: (payload: MonitorPayload) => void
  request: (payload: MonitorPayload) => void
}

export type MonitoringCallbacks = {
  contentNode: ServiceMonitoring
  discoveryNode: ServiceMonitoring
}
