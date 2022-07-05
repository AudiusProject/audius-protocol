
import client from 'prom-client';
import { getEnv } from './utils';

const { pushGatewayUrl } = getEnv()

export const gateway = new client.Pushgateway(pushGatewayUrl)

export const allUserCountGauge = new client.Gauge({
    name: 'audius_nm_all_user_count',
    help: 'the count of users with this content node in their replica set',
    labelNames: ['endpoint', 'run_id'],
})

export const primaryUserCountGauge = new client.Gauge({
    name: 'audius_nm_primary_user_count',
    help: 'the count of users with this content node as their primary',
    labelNames: ['endpoint', 'run_id'],
})

export const fullySyncedUsersCountGauge = new client.Gauge({
    name: 'audius_nm_fully_synced_user_count',
    help: 'the number of users whose content nodes replicas are all in sync',
    labelNames: ['run_id']
})

export const partiallySyncedUsersCountGauge = new client.Gauge({
    name: 'audius_nm_partially_synced_user_count',
    help: 'the number of users whose primary is in sync with only one secondary',
    labelNames: ['run_id']
})

export const unsyncedUsersCountGauge = new client.Gauge({
    name: 'audius_nm_unsynced_user_count',
    help: 'the number of users whose primary is out of sync with both secondaries',
    labelNames: ['run_id']
})

export const missedUsersCountGauge = new client.Gauge({
    name: 'audius_nm_missed_users_count',
    help: 'the number of users that got skipped while indexing content nodes',
    labelNames: ['endpoint', 'run_id']
})

export const indexingDiscoveryDurationGauge = new client.Gauge({
    name: 'audius_nm_indexing_discovery_duration',
    help: 'the amount of time it takes to index the discovery database',
    labelNames: ['run_id'],
})

export const indexingContentDurationGauge = new client.Gauge({
    name: 'audius_nm_indexing_content_duration',
    help: 'the amount of time it takes to index the content node network',
    labelNames: ['run_id'],
})

export const generatingMetricsDurationGauge = new client.Gauge({
    name: 'audius_nm_generating_metrics_duration',
    help: 'the amount of time it takes to generate metrics from the DB',
    labelNames: ['run_id'],
})

export const totalJobDurationGauge = new client.Gauge({
    name: 'audius_nm_total_job_duration',
    help: 'the amount of time it takes for an entire network monitoring job to complete',
    labelNames: ['run_id'],
})

export const userBatchDurationGauge = new client.Gauge({
    name: 'audius_nm_user_batch_duration',
    help: 'the amount of time it takes to fetch and save a user batch',
    labelNames: ['run_id', 'endpoint'],
})

export const primaryUserCountEndpointGauge = new client.Gauge({
    name: 'audius_nm_primary_user_count_endpoint',
    help: 'blah',
    labelNames: ['run_id', 'endpoint']
})

export const secondary1UserCountEndpointGauge = new client.Gauge({
    name: 'audius_nm_secondary1_user_count_endpoint',
    help: 'blah',
    labelNames: ['run_id', 'endpoint']
})

export const secondary2UserCountEndpointGauge = new client.Gauge({
    name: 'audius_nm_secondary2_user_count_endpoint',
    help: 'blah',
    labelNames: ['run_id', 'endpoint']
})