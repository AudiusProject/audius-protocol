module.exports = {
  CREATOR_NODE_SERVICE_NAME: 'content-node',
  DECISION_TREE_STATE: Object.freeze({
    GET_ALL_SERVICES: 'Get All Services',
    FILTER_TO_WHITELIST: 'Filter To Whitelist',
    FILTER_FROM_BLACKLIST: 'Filter From Blacklist',
    FILTER_OUT_UNHEALTHY_OUTDATED_AND_NO_STORAGE_SPACE: 'Filter Out Unhealthy, Outdated, And No Storage Space',
    FILTER_OUT_SYNC_IN_PROGRESS: 'Filter Out Sync In Progress',
    SELECT_PRIMARY_AND_SECONDARIES: 'Select Primary And Secondaries'
  })
}
