// Max number of completed/failed jobs to keep in redis for the state monitoring queue
export const MONITORING_QUEUE_HISTORY = 20

// Millis to delay starting the first job in the StateMonitoringQueue (30 seconds)
export const STATE_MONITORING_QUEUE_INIT_DELAY_MS = 1000 * 30

// Millis to timeout request for getting users who have a node as their primary/secondary (60 seconds)
export const GET_NODE_USERS_TIMEOUT_MS = 1000 * 60

// Millis to forcibly cancel getNodeUsers request if axios timeout doesn't work (70 seconds)
export const GET_NODE_USERS_CANCEL_TOKEN_MS = 1000 * 70

// Max number of users to fetch if no maximum is given
export const GET_NODE_USERS_DEFAULT_PAGE_SIZE = 100_000

// Timeout for fetching a clock value for a single user (2 seconds)
export const CLOCK_STATUS_REQUEST_TIMEOUT_MS = 2000

// Timeout for fetching batch clock values (10 seconds)
export const BATCH_CLOCK_STATUS_REQUEST_TIMEOUT = 1000 * 10

// Max number of attempts to fetch clock statuses from /users/batch_clock_status
export const MAX_USER_BATCH_CLOCK_FETCH_RETRIES = 5

// Number of users to process in each batch when calculating reconfigs
export const FIND_REPLICA_SET_UPDATES_BATCH_SIZE = 500

// Number of users to process in each batch when calculating reconfigs and syncs
export const AGGREGATE_RECONFIG_AND_POTENTIAL_SYNC_OPS_BATCH_SIZE = 500

// Retry delay (in millis) between requests while monitoring a sync
export const SYNC_MONITORING_RETRY_DELAY_MS = 15_000

// Max number of attempts to select new replica set in reconfig
export const MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS = 20

// Max number of attempts to run a job that attempts to issue a manual sync
export const MAX_ISSUE_MANUAL_SYNC_JOB_ATTEMPTS = 2

// Max number of attempts to run a job that attempts to issue a recurring sync
export const MAX_ISSUE_RECURRING_SYNC_JOB_ATTEMPTS = 2

export const QUEUE_HISTORY = Object.freeze({
  // Max number of completed/failed jobs to keep in redis for the monitor-state queue
  MONITOR_STATE: 100,
  // Max number of completed/failed jobs to keep in redis for the find-sync-requests queue
  FIND_SYNC_REQUESTS: 100,
  // Max number of completed/failed jobs to keep in redis for the find-replica-set-updates queue
  FIND_REPLICA_SET_UPDATES: 100,
  // Max number of completed/failed jobs to keep in redis for the cNodeEndpoint->spId map queue
  FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP: 100,
  // Max number of completed/failed jobs to keep in redis for the manual sync queue
  MANUAL_SYNC: 100_000,
  // Max number of completed/failed jobs to keep in redis for the recurring sync queue
  RECURRING_SYNC: 100_000,
  // Max number of completed/failed jobs to keep in redis for the update-replica-set queue
  UPDATE_REPLICA_SET: 100_000,
  // Max number of completed/failed jobs to keep in redis for the recover-orphaned-data queue
  RECOVER_ORPHANED_DATA: 100_000
})

export const QUEUE_NAMES = {
  // Queue to slice users and gather data about them
  MONITOR_STATE: 'monitor-state-queue',
  // Queue to find sync requests
  FIND_SYNC_REQUESTS: 'find-sync-requests-queue',
  // Queue to find replica set updates
  FIND_REPLICA_SET_UPDATES: 'find-replica-set-updates-queue',
  // Queue that only processes jobs to fetch the cNodeEndpoint->spId mapping,
  FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP: 'c-node-endpoint-to-sp-id-map-queue',
  // Queue to issue a manual sync
  MANUAL_SYNC: 'manual-sync-queue',
  // Queue to issue a recurring sync
  RECURRING_SYNC: 'recurring-sync-queue',
  // Queue to update a replica set
  UPDATE_REPLICA_SET: 'update-replica-set-queue',
  // Queue to search for nodes with orphaned data and merge it into a Replica Set
  RECOVER_ORPHANED_DATA: 'recover-orphaned-data-queue'
} as const
export type TQUEUE_NAMES = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES]

export const MAX_QUEUE_RUNTIMES = Object.freeze({
  // Max millis to run a monitor-state job for before marking it as stalled
  MONITOR_STATE:
    30 /* min */ *
    60 *
    1000 /* Should actually be 5 minutes after optimizations */,
  // Max millis to run a find-sync-requests job for before marking it as stalled
  FIND_SYNC_REQUESTS: 5 /* min */ * 60 * 1000,
  // Max millis to run a find-replica-set-updates job for before marking it as stalled
  FIND_REPLICA_SET_UPDATES: 5 /* min */ * 60 * 1000,
  // Max millis to run a fetch cNodeEndpoint->spId mapping job for before marking it as stalled
  FETCH_C_NODE_ENDPOINT_TO_SP_ID_MAP: 5 /* min */ * 60 * 1000,
  // Max millis to run a manual sync job for before marking it as stalled
  MANUAL_SYNC: 1 /* min */ * 60 * 1000,
  // Max millis to run a recurring sync job for before marking it as stalled
  RECURRING_SYNC: 6 /* min */ * 60 * 1000,
  // Max millis to run an update-replica-set job for before marking it as stalled
  UPDATE_REPLICA_SET: 5 /* min */ * 60 * 1000,
  // Max millis to run a recover-orphaned-data job for before marking it as stalled
  RECOVER_ORPHANED_DATA: 3 /* hours */ * 60 /* min */ * 60 * 1000
})

/**
 * Modes used in issuing a reconfig. Each successive mode is a superset of the mode prior.
 * The `key` of the reconfig states is used to identify the current reconfig mode.
 * The `value` of the reconfig states is used in the superset logic of determining which type of reconfig is enabled.
 */
export const RECONFIG_MODES = Object.freeze({
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

// Describes the type of sync operation
export const SyncType = Object.freeze({
  Recurring: 'RECURRING', // Scheduled background sync to keep secondaries up to date
  Manual: 'MANUAL' // Triggered by a user data write to primary
})

// Sync mode for a (primary, secondary) pair for a user
export const SYNC_MODES = Object.freeze({
  // Replicas already in sync - no further sync needed
  None: 'NONE',

  // Base case - secondary should sync its local state to primary's state
  SyncSecondaryFromPrimary: 'SYNC_SECONDARY_FROM_PRIMARY',

  // Edge case - secondary has state that primary needs: primary should merge its local state with secondary's state, and have secondary re-sync its entire local state
  MergePrimaryAndSecondary: 'MERGE_PRIMARY_AND_SECONDARY',

  // Edge case - same as MergePrimaryAndSecondary but wipes secondary's state instead of re-syncing from primary
  MergePrimaryThenWipeSecondary: 'MERGE_PRIMARY_THEN_WIPE_SECONDARY'
})

export const FETCH_FILES_HASH_NUM_RETRIES = 3

// Seconds to hold the cache of healthy content nodes for update-replica-set jobs
export const HEALTHY_SERVICES_TTL_SEC = 60 /* 1 min */

export enum UpdateReplicaSetJobResult {
  Success = 'success',
  SuccessIssueReconfigDisabled = 'success_issue_reconfig_disabled',
  FailureFindHealthyNodes = 'failure_find_healthy_nodes',
  SkipUpdateReplicaSet = 'skip_update_replica_set',
  FailureNoHealthyNodes = 'failure_no_healthy_nodes',
  FailureNoValidSP = 'failure_no_valid_sp',
  FailureToUpdateReplicaSet = 'failure_to_update_replica_set',
  FailureIssueUpdateReplicaSet = 'failure_issue_update_replica_set',
  FailureDetermineNewReplicaSet = 'failure_determine_new_replica_set',
  FailureGetCurrentReplicaSet = 'failure_get_current_replica_set',
  FailureInitAudiusLibs = 'failure_init_audius_libs'
}

// Number of users to query in each orphaned data recovery query to Discovery and to its own db
export const ORPHANED_DATA_NUM_USERS_PER_QUERY = 2000

// Number of users to fetch from redis and issue requests for (sequentially) in each batch
export const ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH = 2

// Milliseconds to wait between processing every ORPHANED_DATA_NUM_USERS_TO_RECOVER_PER_BATCH users
export const ORPHAN_DATA_DELAY_BETWEEN_BATCHES_MS = 1000

// Milliseconds after which to gracefully end a recover-orphaned-data job early
export const MAX_MS_TO_ISSUE_RECOVER_ORPHANED_DATA_REQUESTS =
  2 /* hours */ * 60 /* minutes */ * 60 /* seconds */ * 1000

const FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_PREFIX =
  'FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES'
export const FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_CONSTS = {
  FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_PREFIX,
  LOCAL_DB_ENTRIES_SET_KEY_PREFIX: `${FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_PREFIX}_LOCAL_ENTRIES_SET`,
  FETCHED_ENTRIES_SET_KEY_PREFIX: `${FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_PREFIX}_FETCHED_ENTRIES_SET`,
  UNIQUE_FETCHED_ENTRIES_SET_KEY_PREFIX: `${FILTER_OUT_ALREADY_PRESENT_DB_ENTRIES_PREFIX}_UNIQUE_FETCHED_ENTRIES_SET`
}
