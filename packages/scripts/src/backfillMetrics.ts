import axios from 'axios'

type Sp = {
  endpoint: string
}

type Stats = {
  timestamp: string
  unique_count: number
  summed_unique_count: number
  total_count: number
}

const dates = [
  '2024-01-25',
  '2024-01-26',
  '2024-01-27',
  '2024-01-28',
  '2024-01-29',
]

// TODO: query this for "Total API Calls"
// https://blockdaemon-audius-discovery-06.bdnodes.net/v1/metrics/aggregates/routes/month?bucket_size=day
// total_count

// TODO: query this for "Unique Users"
// https://blockdaemon-audius-discovery-06.bdnodes.net/v1/metrics/aggregates/routes/month?bucket_size=day
// summed_unique_count

// TODO: tally up all these values from across nodes

// TODO: insert tally into db

const getNodes = async (): Promise<string[]> =>
  axios
    .get('https://api.audius.co/discovery/verbose?all=true')
    .then((data) => data.data.data.map((sp: Sp) => sp.endpoint))

const getStats = async (node: string): Promise<Stats[] | undefined> =>
  axios
    .get(`${node}/v1/metrics/routes/week?bucket_size=day`)
    .then((data) => data.data.data)
    .catch((_) => undefined)

const main = async () => {
  const nodes = await getNodes()
  const unreachableNodes: string[] = []

  const apiCallCounts = new Map<string, number>()
  const uniqueUserCounts = new Map<string, number>()

  // set so we can just upsert later
  for (const date of dates) {
    apiCallCounts.set(date, 0)
    uniqueUserCounts.set(date, 0)
  }

  for (const node of nodes) {
    const nodestats = await getStats(node)
    if (nodestats === undefined) {
      unreachableNodes.push(node)
      continue
    }
    nodestats
      .filter((stats) => dates.includes(stats.timestamp))
      .forEach(({ timestamp, unique_count, total_count }) => {
        apiCallCounts.set(timestamp, apiCallCounts.get(timestamp) + total_count)
        uniqueUserCounts.set(timestamp, uniqueUserCounts.get(timestamp) + unique_count)
        console.log({ node, timestamp, total_count, unique_count })
      })
  }
  console.log({ availableNodes: nodes.length - unreachableNodes.length, unreachableNodes, apiCallCounts, uniqueUserCounts })
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
