import axios from 'axios'
const knex = require('knex')({
    client: 'pg',
});

type Sp = {
  endpoint: string
}

type RouteMetric = {
  timestamp: string
  unique_count: number
  total_count: number
}

type Timestamp = string

type RouteMetricAggregates = Map<Timestamp, RouteMetric>

const timeframe = 'week'
const dates = [
  '2024-01-25',
  '2024-01-26',
  '2024-01-27',
  '2024-01-28',
  '2024-01-29',
]

const getNodes = async (): Promise<string[]> =>
  axios
    .get('https://api.audius.co/discovery/verbose?all=true')
    .then((data) => data.data.data.map((sp: Sp) => sp.endpoint))

const getRouteMetrics = async (
  nodeUrl: string
): Promise<RouteMetric[] | undefined> =>
  axios
    .get(`${nodeUrl}/v1/metrics/routes/${timeframe}`)
    .then((data) => data.data.data)
    .catch((e) => undefined)

const updateRouteMetricTotal = (
  aggregates: RouteMetricAggregates,
  metric: RouteMetric
): void => {
  const existingMetric = aggregates.get(metric.timestamp)

  if (existingMetric) {
    aggregates.set(metric.timestamp, {
      timestamp: metric.timestamp,
      unique_count: existingMetric.unique_count + metric.unique_count,
      total_count: existingMetric.total_count + metric.total_count,
    })
  } else {
    aggregates.set(metric.timestamp, metric)
  }
}


const main = async () => {
  let aggregateMetrics: RouteMetricAggregates = new Map()
  const nodes = await getNodes()

  const metricsPromises = nodes.map(async (node) => {
    const metrics = await getRouteMetrics(node)
    return { node, metrics }
  })

  const results = await Promise.allSettled(metricsPromises)

  const unreachableNodes: string[] = []

  results.forEach((result) => {
    if (result.status !== 'fulfilled') return
    const { node, metrics } = result.value
    if (metrics) {
      metrics.forEach((metric: RouteMetric) => {
        
        console.log({ node, metric })
        updateRouteMetricTotal(aggregateMetrics, metric)
      
      })
    } else {
      unreachableNodes.push(node)
    }
  })

  console.log({ unreachableNodes, aggregateMetrics })
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
