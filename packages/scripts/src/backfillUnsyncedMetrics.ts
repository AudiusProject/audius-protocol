import axios from 'axios'

type Sp = {
  endpoint: string
}

type Timestamp = string
type AppName = string
type RequestCount = number

type AppStatsResponse = Map<AppName, RequestCount>

type RouteStatsResponse = {
  unique_count: number
  summed_unique_count: number
  total_count: number
}

type RoutesResponse = {
  daily: Map<Timestamp, RouteStatsResponse>
  monthly: Map<Timestamp, RouteStatsResponse>
}

type AppsResponse = {
  daily: Map<Timestamp, AppStatsResponse>
  monthly: Map<Timestamp, AppStatsResponse>
}

type HistoricalResponse = {
  routes: RoutesResponse
  apps: AppsResponse
}

type RouteAggregate = {
  total_unique_count: number
  total_summed_unique_count: number
  total_total_count: number
}

type AppAggregate = number

type Aggregates = {
  routes: Map<Timestamp, RouteAggregate>
  apps: Map<Timestamp, AppAggregate>
}

const dates = [
  '2024-01-25',
  '2024-01-26',
  '2024-01-27',
  '2024-01-28',
  '2024-01-29',
]

const updateAggregates = (
  currentAggregates: Aggregates,
  routes: Map<Timestamp, RouteStatsResponse>,
  apps: Map<Timestamp, AppStatsResponse>
) => {
  // update routes
  for (const route of Object.entries(routes)) {
    const [date, stats]: [string, RouteStatsResponse] = route
    if (!dates.includes(date)) continue
    const aggDate = currentAggregates.routes.get(date)
    if (aggDate === undefined) {
      currentAggregates.routes.set(date, {
        total_unique_count: stats.unique_count,
        total_summed_unique_count: stats.summed_unique_count,
        total_total_count: stats.total_count,
      })
    } else {
      const newAgg = 
        {
          total_unique_count: stats.unique_count + aggDate.total_unique_count,
          total_summed_unique_count: stats.summed_unique_count + aggDate.total_summed_unique_count,
          total_total_count: stats.total_count + aggDate.total_total_count,
        }
      currentAggregates.routes.set(date, newAgg)
    }
  }

  // update apps
  for (const app of Object.entries(apps)) {
    const [date, appmap]: [string, AppStatsResponse] = app
    if (!dates.includes(date)) continue
    const aggApp = currentAggregates.apps.get(date)
    let thisAppTotal = 0
    for (const [_, count] of Object.entries(appmap)) {
      thisAppTotal += count
    }
    if (aggApp === undefined) {
      currentAggregates.apps.set(date, thisAppTotal)
    } else {
      currentAggregates.apps.set(date, aggApp + thisAppTotal)
    }
  }
}

const getNodes = async (): Promise<string[]> =>
  axios
    .get('https://api.audius.co/discovery/verbose?all=true')
    .then((data) => data.data.data.map((sp: Sp) => sp.endpoint))

const getHistoricalAggregates = async (
  endpoint: string
): Promise<HistoricalResponse | undefined> =>
  axios
    .get(`${endpoint}/v1/metrics/aggregates/historical`)
    .then((data) => data.data.data as HistoricalResponse)
    .catch((e) => {return undefined})

const main = async () => {
  const nodes = await getNodes()

  const metricsPromises = nodes.map(async (node) => {
    const metrics = await getHistoricalAggregates(node)
    return { node, metrics }
  })

  const results = await Promise.allSettled(metricsPromises)

  const unreachableNodes: string[] = []
  const aggregates: Aggregates = {
    routes: new Map(),
    apps: new Map()
  }

  results.forEach((result) => {
    if (result.status !== 'fulfilled') return
    const { node, metrics } = result.value
    if (metrics) {
      // console.log({ node, metrics })
      const dailyRouteMetrics = metrics.routes.daily
      const dailyAppMetrics = metrics.apps.daily
      updateAggregates(aggregates, dailyRouteMetrics, dailyAppMetrics)
    } else {
      unreachableNodes.push(node)
    }
  })

  const finalAggregates: Aggregates = {
    routes: new Map([...aggregates.routes.entries()].sort()),
    apps: new Map([...aggregates.apps.entries()].sort())
  }

  // summed unique count = unique users (in dashboard)
  // total count = total API calls (in dashboard)

  console.log({ unreachableNodes, routes: finalAggregates.routes, apps: finalAggregates.apps })
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
