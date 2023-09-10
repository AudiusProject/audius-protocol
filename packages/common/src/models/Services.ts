export type ServiceMonitorType = 'discovery-node' | 'content-node'

export type MonitorPayload = {
  // String key naming the metric being tracked and a number of string value
  // A number value should be used for numeric metrics as they allow
  // analytics tools (e.g. amplitude) to query against more effectively (percentiles, etc.)
  [key in string]: number | string
}
