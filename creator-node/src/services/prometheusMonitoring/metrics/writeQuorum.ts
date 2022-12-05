import { Histogram } from 'prom-client'

import * as config from '../../../config'
import { exponentialBucketsRange } from '../prometheusSetupUtils'

export default {
  metricType: Histogram,
  metricLabels: {
    // Whether or not write quorum is enabled/enforced
    enforceWriteQuorum: ['false', 'true'],
    // Whether or not write quorum is ignored for this specific route (even if it's enabled in general).
    // If it's ignored, it will still attempt replication but not fail the request if replication fails
    ignoreWriteQuorum: ['false', 'true'],
    // The route that triggered write quorum
    route: [
      // Routes that use write quorum but don't enforce it (ignoreWriteQuorum should be true):
      '/image_upload',
      '/audius_users',
      '/playlists',
      '/tracks',
      // Routes that strictly enforce write quorum (ignoreWriteQuorum should be false)
      '/audius_users/metadata',
      '/playlists/metadata',
      '/tracks/metadata'
    ],
    result: [
      'succeeded', // Data was replicated to one or more secondaries
      'failed_short_circuit', // Failed before attempting to sync because some basic condition wasn't met (node not primary, missing wallet, or manual syncs disabled)
      'failed_uncaught_error', // Failed due to some uncaught exception. This should never happen
      'failed_sync' // Failed to reach 2/3 quorum because no syncs were successful
    ]
  },
  metricConfig: {
    help: 'Seconds spent attempting to replicate data to a secondary node for write quorum',
    // 5 buckets in the range of 1 second to max seconds before timing out write quorum
    buckets: exponentialBucketsRange(
      1,
      config.get('issueAndWaitForSecondarySyncRequestsPollingDurationMs') /
        1000,
      5
    ),
    aggregator: 'average'
  }
} as const
