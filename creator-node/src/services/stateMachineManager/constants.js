module.exports = {
  // Max number of completed/failed jobs to keep in redis
  QUEUE_HISTORY: 500,
  // Name of StateMonitoringQueue
  STATE_MONITORING_QUEUE_NAME: 'state-monitoring-queue',
  // Max millis to run a StateMonitoringQueue job for before marking it as stalled (1 hour)
  STATE_MONITORING_QUEUE_MAX_JOB_RUNTIME_MS: 1000 * 60 * 60,
  // Millis to delay starting the first job in the StateMonitoringQueue (30 seconds)
  STATE_MONITORING_QUEUE_INIT_DELAY_MS: 1000 * 30,
  // Millis to timeout request for getting users who have a node as their primary/secondary (60 seconds)
  GET_NODE_USERS_TIMEOUT_MS: 1000 * 60,
  // Millis to forcibly cancel getNodeUsers request if axios timeout doesn't work (70 seconds)
  GET_NODE_USERS_CANCEL_TOKEN_MS: 1000 * 70,
  // Max number of users to fetch if no maximum is given
  GET_NODE_USERS_DEFAULT_PAGE_SIZE: 100_000,
  // Timeout for fetching a clock value for a singular user (2 seconds)
  CLOCK_STATUS_REQUEST_TIMEOUT_MS: 2000,
  // Timeout for fetching batch clock values (10 seconds)
  BATCH_CLOCK_STATUS_REQUEST_TIMEOUT: 1000 * 10,
  // Max number of attempts to fetch clock statuses from /users/batch_clock_status
  MAX_USER_BATCH_CLOCK_FETCH_RETRIES: 5,
  // Number of users to process in each batch when calculating reconfigs and syncs
  AGGREGATE_RECONFIG_AND_POTENTIAL_SYNC_OPS_BATCH_SIZE: 500,
  // Modes used in issuing a reconfig. Each successive mode is a superset of the mode prior.
  // The `key` of the reconfig states is used to identify the current reconfig mode.
  // The `value` of the reconfig states is used in the superset logic of determining which type of
  // reconfig is enabled.
  RECONFIG_MODES: Object.freeze({
    // Reconfiguration is entirely disabled
    RECONFIG_DISABLED: {
      key: 'RECONFIG_DISABLED',
      value: 0
    },
    // Reconfiguration is enabled only if one secondary is unhealthy
    ONE_SECONDARY: {
      key: 'ONE_SECONDARY',
      value: 1
    },
    // Reconfiguration is enabled for one secondary and multiple secondaries (currently two secondaries)
    MULTIPLE_SECONDARIES: {
      key: 'MULTIPLE_SECONDARIES',
      value: 2
    },
    // Reconfiguration is enabled for one secondary, multiple secondaries, a primary, and a primary and one secondary
    PRIMARY_AND_OR_SECONDARIES: {
      key: 'PRIMARY_AND_OR_SECONDARIES',
      value: 3
    },
    // Reconfiguration is enabled for one secondary, multiple secondaries, a primary, and a primary and one secondary,
    // and entire replica set
    // Note: this mode will probably be disabled.
    ENTIRE_REPLICA_SET: {
      key: 'ENTIRE_REPLICA_SET',
      value: 4
    }
  })
}
