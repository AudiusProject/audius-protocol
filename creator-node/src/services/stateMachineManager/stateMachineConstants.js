module.exports = {
  // Max number of completed/failed jobs to keep in redis for the state monitoring queue
  MONITORING_QUEUE_HISTORY: 20,

  // Millis to delay starting the first job in the StateMonitoringQueue (30 seconds)
  STATE_MONITORING_QUEUE_INIT_DELAY_MS: 1000 * 30,

  // Millis to timeout request for getting users who have a node as their primary/secondary (60 seconds)
  GET_NODE_USERS_TIMEOUT_MS: 1000 * 60,

  // Millis to forcibly cancel getNodeUsers request if axios timeout doesn't work (70 seconds)
  GET_NODE_USERS_CANCEL_TOKEN_MS: 1000 * 70,

  // Max number of users to fetch if no maximum is given
  GET_NODE_USERS_DEFAULT_PAGE_SIZE: 100_000,

  // Timeout for fetching a clock value for a single user (2 seconds)
  CLOCK_STATUS_REQUEST_TIMEOUT_MS: 2000,

  // Timeout for fetching batch clock values (10 seconds)
  BATCH_CLOCK_STATUS_REQUEST_TIMEOUT: 1000 * 10,

  // Max number of attempts to fetch clock statuses from /users/batch_clock_status
  MAX_USER_BATCH_CLOCK_FETCH_RETRIES: 5,

  // Number of users to process in each batch when calculating reconfigs
  FIND_REPLICA_SET_UPDATES_BATCH_SIZE: 500,

  // Number of users to process in each batch when calculating reconfigs and syncs
  AGGREGATE_RECONFIG_AND_POTENTIAL_SYNC_OPS_BATCH_SIZE: 500,

  // Retry delay (in millis) between requests while monitoring a sync
  SYNC_MONITORING_RETRY_DELAY_MS: 15_000,

  // Max number of attempts to select new replica set in reconfig
  MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS: 5,

  // Max number of attempts to run a job that attempts to issue a sync (manual or recurring)
  MAX_ISSUE_SYNC_JOB_ATTEMPTS: 3,

  QUEUE_HISTORY: Object.freeze({
    // Max number of completed/failed jobs to keep in redis for the monitor-state queue
    MONITOR_STATE: 20,
    // Max number of completed/failed jobs to keep in redis for the find-sync-requests queue
    FIND_SYNC_REQUESTS: 20,
    // Max number of completed/failed jobs to keep in redis for the find-replica-set-updates queue
    FIND_REPLICA_SET_UPDATES: 20,
    // Max number of completed/failed jobs to keep in redis for the find-inconsistent-clock queue
    FIND_INCONSISTENT_CLOCK: 20,
    // Max number of completed/failed jobs to keep in redis for the cNodeEndpoint->spId map queue
    FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP: 100,
    // Max number of completed/failed jobs to keep in redis for the manual sync queue
    MANUAL_SYNC: 300,
    // Max number of completed/failed jobs to keep in redis for the recurring sync queue
    RECURRING_SYNC: 300,
    // Max number of completed/failed jobs to keep in redis for the update-replica-set queue
    UPDATE_REPLICA_SET: 300
  }),

  QUEUE_NAMES: Object.freeze({
    // Name of the queue that only processes jobs to slice users and gather data about them
    MONITOR_STATE: 'monitor-state-queue',
    // Name of the queue that only processes jobs to find sync requests
    FIND_SYNC_REQUESTS: 'find-sync-requests-queue',
    // Name of the queue that only processes jobs to find replica set updates
    FIND_REPLICA_SET_UPDATES: 'find-replica-set-updates-queue',
    // Name of the queue that only processes jobs to find inconsistent clock values
    FIND_INCONSISTENT_CLOCK: 'find-inconsistent-clock',
    // Name of queue that only processes jobs to fetch the cNodeEndpoint->spId mapping,
    FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP: 'c-node-to-endpoint-sp-id-map-queue',
    // Name of queue that only processes jobs to issue a manual sync
    MANUAL_SYNC: 'manual-sync-queue',
    // Name of queue that only processes jobs to issue a recurring sync
    RECURRING_SYNC: 'recurring-sync-queue',
    // Name of queue that only processes jobs to update a replica set
    UPDATE_REPLICA_SET: 'update-replica-set-queue'
  }),

  MAX_QUEUE_RUNTIMES: Object.freeze({
    // Max millis to run a monitor-state job for before marking it as stalled (1 hour)
    MONITOR_STATE: 1000 * 60 * 60,
    // Max millis to run a find-sync-requests job for before marking it as stalled (1 hour)
    FIND_SYNC_REQUESTS: 1000 * 60 * 60,
    // Max millis to run a find-replica-set-updates job for before marking it as stalled (1 hour)
    FIND_REPLICA_SET_UPDATES: 1000 * 60 * 60,
    // Max millis to run a find-inconsistent-clock job for before marking it as stalled (1 hour)
    FIND_INCONSISTENT_CLOCK: 1000 * 60 * 60,
    // Max millis to run a fetch cNodeEndpoint->spId mapping job for before marking it as stalled (1 minute)
    FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP: 1000 * 60,
    // Max millis to run a manual sync job for before marking it as stalled (60 seconds)
    MANUAL_SYNC: 1000 * 60,
    // Max millis to run a recurring sync job for before marking it as stalled (1 hour)
    RECURRING_SYNC: 1000 * 60 * 60,
    // Max millis to run an update-replica-set job for before marking it as stalled (1 hour)
    UPDATE_REPLICA_SET: 1000 * 60 * 60
  }),

  /**
   * Modes used in issuing a reconfig. Each successive mode is a superset of the mode prior.
   * The `key` of the reconfig states is used to identify the current reconfig mode.
   * The `value` of the reconfig states is used in the superset logic of determining which type of reconfig is enabled.
   */
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
  }),

  // Describes the type of sync operation
  SyncType: Object.freeze({
    Recurring: 'RECURRING', // Scheduled background sync to keep secondaries up to date
    Manual: 'MANUAL' // Triggered by a user data write to primary
  }),

  // Sync mode for a (primary, secondary) pair for a user
  SYNC_MODES: Object.freeze({
    // Replicas already in sync - no further sync needed
    None: 'NONE',

    // Base case - secondary should sync its local state to primary's state
    SyncSecondaryFromPrimary: 'SYNC_SECONDARY_FROM_PRIMARY',

    // Edge case - secondary has state that primary needs: primary should merge its local state with secondary's state, and have secondary re-sync its entire local state
    MergePrimaryAndSecondary: 'MERGE_PRIMARY_AND_SECONDARY'
  }),

  FETCH_FILES_HASH_NUM_RETRIES: 3
}
