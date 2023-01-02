export type MetricToRecord = {
  metricName: string
  metricType: string
  metricValue: number
  metricLabels: Record<string, string>
}
