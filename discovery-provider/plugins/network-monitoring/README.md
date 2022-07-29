# Audius Network Monitoring

**Network Monitoring** refers to network-wide metrics we collect from a discovery node and aggregate to assess the health of the entire network.

Some examples of network-wide metrics are
* The number of CID on each Content Node that have been replicated at least once
* The number of CID on each Content Node that have NOT been replicated at least once
* The number of users with a specific Content Node as their primary
* The number of users with a specific Content Node in their replica set
* CID replication across the Content Nodes
* CID replication factor
* The number of users with their data syncs across 0, 1, 2, or 3 Content Nodes

These metrics are exposed on the route `{HOSTNAME}:9091/metrics` and are updated on a nightly basis. When first starting up network monitoring, metrics are made available after the first job completes. Network monitoring jobs last around 2 hours on the production Audius network.

This is different from node-level metrics which are scraped by prometheus from the 
content and discovery nodes through a special `/prometheus_metrics` route.

---

## Installation

Network Monitoring is intended to be run alongside a discovery node. Although it is possible to run network monitoring as a stand-alone service, this guide assumes direct access to a discovery node.

### Setting Env Variables

Network Monitoring is configured with a set of environment variables. Before running the service, these need to be configured appropriately.

```sh
# audius-protocol/discovery-provider/plugins/network-monitoring/env.prod

# Credentials for the network monitoring DB
DB_HOST=network-monitoring-db
DB_NAME=audius_network_monitoring
DB_USERNAME=""
DB_PASSWORD=""
DB_PORT=5444

# Credentials for the discovery-provider DB
FDB_HOST=""
FDB_NAME=audius_discovery
FDB_USERNAME=""
FDB_PASSWORD=""
FDB_PORT=5432

# comma separated list of content nodes to ignore
# e.g. https://cn1.com,https://cn2.com,https://cn3.com
DEREGISTERED_CONTENT_NODES=""

# Whether to see Sequelize logs
SQL_LOGGING=false

# The SPIDs for the Audius Foundation Nodes
FOUNDATION_NODES_SPIDS=1,2,3,4

# URL for the prometheus push-gateway 
# Unless using a custom gateway, don't change this
PUSH_GATEWAY_URL="http://network-monitoring-push-gateway:9091"

# The spid for the discovery provider
SIGNATURE_SPID=

# The delegate private key for the discovery provider
SIGNATURE_SP_DELEGATE_PRIV_KEY="0x123456789"

# (Optional) Slack webhook to post updates to a slack channel
SLACK_URL=""
```


### Running Services

By default, this will run every service which includes

- network monitoring CRON
- postgres
- prometheus push-gateway

```bash
# Clone the audius protocol repo
git clone https://github.com/AudiusProject/audius-protocol.git

# Navigate to network monitoring
cd audius-protocol/discovery-provder/plugins/network-monitoring

# Run services
docker-compose up --build -d
```

---

## Metrics

Currently, we compute three metrics

- All User Count
    - The number of users with a specific content node in their replica set
- Primary User Count
    - The number of users with a specific content node as their primary
- Fully Synced User Count
    - The number of users with a replica set that’s fully synced (all clock values are the same)
- Partially Synced User Count
    - The number of users with a replica set that's partially synced (only one secondary as the same clock value as the primary)
- Unsynced User Count
    - The number of users with neither secondary having the same clock value as their primary
- Users with a Null Primary Clock 
    - The number of users whose clock value on their primary is `null` (usually indicates a bug)

What we are planning to add

- The number of CID on each Content Node that have been replicated at least once
- The number of CID on each Content Node that have ***NOT*** been replicated at least once
- CID replication across the Content Nodes
- CID replication factor

---

## How it works

Network Monitoring internally connects directly to the postgres instance running on a discovery node. With the information pulled from the discovery node, information is pulled from every content node to:

1. Verify that the info coming from the discovery node is correct
2. Make sure user data is getting replicated properly within a user's replica set

Data collected from both the discovery node and content nodes is aggregated and exposed using a [Prometheus Push Gateway](https://prometheus.io/docs/practices/pushing/).

![NetworkMonitoring.png](assets/NetworkMonitoring.png)

### Database

At its core, Network Monitoring is a postgres database designed for [OLAP](https://en.wikipedia.org/wiki/Online_analytical_processing) style queries. The database contains snapshots of discovery node indexes and content node indexes, delimited by specific runs.

Since Network Monitoring runs jobs nightly, one run corresponds to one day

![network_monitoring_er_diagram.png](assets/network_monitoring_er_diagram.png)

### Prometheus Monitoring

Metrics are pushed to a [push gateway](https://prometheus.io/docs/practices/pushing/) for consumption by Prometheus ([https://prometheus.io/docs](https://prometheus.io/docs)).

Metrics are exposed via the `GET /metrics` route on the `push-gateway`.

We use [JS client library `prom-client`](https://github.com/siimon/prom-client) to produce these metrics.

---

## Adding New Metrics

Metrics are simply SQL queries to the network monitoring database that are expose to prometheus using the push-gateway. To add new metrics, one must

- Create the SQL query
- Connect the SQL query to the typescript project using `sequelize`
- Create the prometheus metric
- Push the output of the SQL query to the newly created prometheus metric

To use the metric `fullySyncedUserCount` metric as an example, in `queries.ts` , the SQL query for getting that metric look like this

```tsx "title=queries.ts"
export const getFullySyncedUsersCount = async (run_id: number): Promise<number> => {
    const usersResp: unknown[] = await sequelizeConn.query(`
        SELECT COUNT(*) as user_count
        FROM network_monitoring_users
        WHERE
            run_id = :run_id
        AND 
            primary_clock_value IS NOT NULL
        AND
            primary_clock_value = secondary1_clock_value
        AND
            secondary1_clock_value = secondary2_clock_value;
    `, {
        type: QueryTypes.SELECT,
        replacements: { run_id },
    })

    const usersCount = parseInt(((usersResp as { user_count: string }[])[0] || { user_count: '0' }).user_count)

    return usersCount
}
```

In `prometheus.ts` , the prometheus metric is a gauge that looks like this

```tsx title="prometheus.ts"
export const fullySyncedUsersCountGauge = new client.Gauge({
    name: 'full_synced_user_count',
    help: 'the number of users whose content nodes replicas are all in sync',
    labelNames: ['run_id']
})
```

Finally, in `metrics.ts` , the output of the metric is pushed to the prometheus gauge like so:

```tsx title="metrics.ts"
const fullySyncedUsersCount = await getFullySyncedUsersCount(run_id)

fullySyncedUsersCountGauge.set({ run_id }, fullySyncedUsersCount)
```