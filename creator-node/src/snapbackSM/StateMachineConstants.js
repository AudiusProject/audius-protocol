module.exports = {
  // Max number of attempts to select new replica set in reconfig
  MAX_SELECT_NEW_REPLICA_SET_ATTEMPTS: 5,
  // Max number of attempts to fetch clock statuses from /users/batch_clock_status
  MAX_USER_BATCH_CLOCK_FETCH_RETRIES: 5,
  // Retry delay (in millis) between requests during monitoring
  SYNC_MONITORING_RETRY_DELAY_MS: 15_000,
  // Millis to timeout request for getting users who have a node as their primary/secondary
  GET_NODE_USERS_TIMEOUT_MS: 60_000,
  // Millis to forcibly cancel getNodeUsers request (if axios timeout doesn't work)
  GET_NODE_USERS_CANCEL_TOKEN_MS: 70_000,
  // Max number of users to fetch if no maximum is given
  GET_NODE_USERS_DEFAULT_PAGE_SIZE: 100_000
}
