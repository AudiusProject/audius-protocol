export type MonitoringCallbacks = {
  request?: (config: Record<string, unknown>) => void
  healthCheck?: (config: Record<string, unknown>) => void
}
