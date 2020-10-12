const config = require('./config')
const Bull = require('bull')
const axios = require('axios')
const utils = require('./utils')
const models = require('./models')
const { logger } = require('./logging')

// For local dev, configure this to be the interval when SnapbackSM is fired
const DevDelayInMS = 3000

// Represents the maximum number of syncs that can be issued at once
const MaxParallelSyncJobs = 10

// Maximum number of time to wait for a sync operation
const MaxSyncMonitoringDurationInMs = 36000

// Base value used to filter users over a 24 hour period
const ModuloBase = 24

/*
  SnapbackSM aka Snapback StateMachine
  Ensures file availability through recurring sync operations
  Pending: User replica set management
*/
class SnapbackSM {
  constructor (audiusLibs) {
    this.audiusLibs = audiusLibs
    this.initialized = false
    // Cache endpoint config
    this.endpoint = config.get('creatorNodeEndpoint')
    // Toggle to switch logs
    this.debug = true
    // Throw an error if running as creator node and no libs are provided
    if (!this.audiusLibs && !config.get('isUserMetadataNode')) {
      throw new Error('Invalid libs provided to SnapbackSM')
    }
    // State machine queue processes all user operations
    this.stateMachineQueue = this.createBullQueue('creator-node-state-machine')
    // Sync queue handles issuing sync request from primary -> secondary
    this.syncQueue = this.createBullQueue('creator-node-sync-queue')
    // Incremented as users are processed
    // TODO: Randomize this starting point
    this.currentModuloSlice = 0
  }

  // Class level log output
  log (msg) {
    logger.info(`SnapbackSM: ${msg}`)
  }

  // Initialize queue object with provided name
  createBullQueue (queueName) {
    return new Bull(
      queueName,
      {
        redis: {
          port: config.get('redisPort'),
          host: config.get('redisHost')
        }
      }
    )
  }

  // Helper function to retrieve all relevant configs
  async getSPInfo () {
    const spID = config.get('spID')
    const endpoint = this.endpoint
    const delegateOwnerWallet = config.get('delegateOwnerWallet')
    const delegatePrivateKey = config.get('delegatePrivateKey')
    return {
      spID,
      endpoint,
      delegateOwnerWallet,
      delegatePrivateKey
    }
  }

  // Query eth-contracts chain for endpoint to ID info
  async recoverSpID () {
    if (config.get('spID') !== 0) {
      this.log(`Known spID=${config.get('spID')}`)
      return
    }

    const recoveredSpID = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
      this.endpoint
    )
    this.log(`Recovered ${recoveredSpID} for ${this.endpoint}`)
    config.set('spID', recoveredSpID)
  }

  // Retrieve users with this node as primary
  async getNodePrimaryUsers () {
    const currentlySelectedDiscProv = this.audiusLibs.discoveryProvider.discoveryProviderEndpoint
    let requestParams = {
      method: 'get',
      baseURL: currentlySelectedDiscProv,
      url: `users/creator_node`,
      params: {
        creator_node_endpoint: this.endpoint
      }
    }
    let resp = await axios(requestParams)
    this.log(`Discovery provider: ${currentlySelectedDiscProv}`)
    return resp.data.data
  }

  // Retrieve the current clock value on this node for the provided user wallet
  async getUserPrimaryClockValues (wallets) {
    const cnodeUsers = await models.CNodeUser.findAll({
      where: {
        walletPublicKey: {
          [models.Sequelize.Op.in]: wallets
        }
      }
    })
    return cnodeUsers.reduce((o, k) => {
      o[k.walletPublicKey] = k.clock
      return o
    }, {})
  }

  // Enqueue a sync request to a particular secondary
  async issueSecondarySync (userWallet, secondaryEndpoint, primaryEndpoint) {
    let syncRequestParameters = {
      baseURL: secondaryEndpoint,
      url: '/sync',
      method: 'post',
      data: {
        wallet: [userWallet],
        creator_node_endpoint: primaryEndpoint,
        state_machine: true // state machine specific flag
      }
    }
    await this.syncQueue.add({ syncRequestParameters, startTime: Date.now() })
  }

  // Main state machine processing function
  async processStateMachineOperation (job) {
    this.log(`------------------Process SnapbackSM Operation, slice ${this.currentModuloSlice}------------------`)
    if (this.audiusLibs == null) {
      logger.error(`Invalid libs instance`)
      return
    }
    // Attempt to initialize, if this creator node has not yet been registered on chain
    // then no operations will be performed
    if (!this.initialized) {
      await this.initializeNodeIdentityConfig()
      return
    }
    // 1.) Retrieve base information for state machine operations
    let spInfo = await this.getSPInfo()
    if (spInfo.spID === 0) {
      this.log(`Invalid spID, recovering ${spInfo}`)
      await this.recoverSpID()
      return
    }
    // Retrieve users list for this node
    let usersList = await this.getNodePrimaryUsers()

    // Generate list of wallets to query clock number
    // Structured as { nodeEndpoint: [wallet1, wallet2, ...] }
    let nodeVectorClockQueryList = {}

    // Users actually selected to process
    let usersToProcess = []

    let wallets = []

    // Issue queries to secondaries for each user
    usersList.map(
      (user) => {
        let userId = user.user_id
        let modResult = userId % ModuloBase
        let shouldProcess = (modResult === this.currentModuloSlice)

        if (!shouldProcess) {
          return
        }
        console.log(`user:${userId}, modResult:${modResult}, shouldProcess=${shouldProcess}`)

        // Add to list of currently processing users
        usersToProcess.push(user)
        let userWallet = user.wallet
        wallets.push(userWallet)

        // Conditionally asign secondary if present
        let secondary1 = null
        let secondary2 = null
        if (user.secondary1) secondary1 = user.secondary1
        if (user.secondary2) secondary2 = user.secondary2

        // Create node
        if (!nodeVectorClockQueryList[secondary1] && secondary1 != null) { nodeVectorClockQueryList[secondary1] = [] }
        if (!nodeVectorClockQueryList[secondary2] && secondary2 != null) { nodeVectorClockQueryList[secondary2] = [] }

        // Push wallet if necessary onto secondary wallet list
        if (secondary1 != null) nodeVectorClockQueryList[secondary1].push(userWallet)
        if (secondary2 != null) nodeVectorClockQueryList[secondary2].push(userWallet)
      }
    )
    this.log(`Processing ${usersToProcess.length} users`)

    // Cached primary clock values for currently processing user set
    let primaryClockValues = await this.getUserPrimaryClockValues(wallets)

    // Process nodeVectorClockQueryList and cache user clock values on each node
    let secondaryNodesToProcess = Object.keys(nodeVectorClockQueryList)
    let secondaryNodeUserClockStatus = {}
    await Promise.all(
      secondaryNodesToProcess.map(
        async (node) => {
          secondaryNodeUserClockStatus[node] = {}
          // TODO: Batch this too?
          let walletsToQuery = nodeVectorClockQueryList[node]
          let requestParams = {
            baseURL: node,
            method: 'post',
            url: '/users/batch_clock_status',
            data: {
              'walletPublicKeys': walletsToQuery
            }
          }
          this.log(`Requesting ${walletsToQuery.length} users from ${node}`)
          let resp = await axios(requestParams)
          let userClockStatusList = resp.data.users
          // Process returned clock values from this secondary node
          userClockStatusList.map(
            (entry) => {
              try {
                secondaryNodeUserClockStatus[node][entry.walletPublicKey] = entry.clock
              } catch (e) {
                this.log(`ERROR updating secondaryNodeUserClockStatus for ${entry.walletPublicKey} with ${entry.clock}`)
                this.log(JSON.stringify(secondaryNodeUserClockStatus))
                throw e
              }
            }
          )
        }
      )
    )

    this.log(`Finished node user clock status quering, moving to sync calculation`)

    // Issue syncs if necessary
    // For each user in the initially returned usersList,
    //  compare local primary clock value to value from secondary retrieved in bulk above
    let numSyncsIssued = 0
    await Promise.all(
      usersToProcess.map(
        async (user) => {
          try {
            let userWallet = null
            let secondary1 = null
            let secondary2 = null
            if (user.wallet) userWallet = user.wallet
            if (user.secondary1) secondary1 = user.secondary1
            if (user.secondary2) secondary2 = user.secondary2
            let primaryClockValue = primaryClockValues[userWallet]
            let secondary1ClockValue = secondary1 != null ? secondaryNodeUserClockStatus[secondary1][userWallet] : undefined
            let secondary2ClockValue = secondary2 != null ? secondaryNodeUserClockStatus[secondary2][userWallet] : undefined
            let secondary1SyncRequired = secondary1ClockValue === undefined ? true : primaryClockValue > secondary1ClockValue
            let secondary2SyncRequired = secondary2ClockValue === undefined ? true : primaryClockValue > secondary2ClockValue
            this.log(`${userWallet} primaryClock=${primaryClockValue}, (secondary1=${secondary1}, clock=${secondary1ClockValue} syncRequired=${secondary1SyncRequired}), (secondary2=${secondary2}, clock=${secondary2ClockValue}, syncRequired=${secondary2SyncRequired})`)
            // Enqueue sync for secondary1 if required
            if (secondary1SyncRequired && secondary1 != null) {
              await this.issueSecondarySync(userWallet, secondary1, this.endpoint)
              numSyncsIssued += 1
            }
            // Enqueue sync for secondary2 if required
            if (secondary2SyncRequired && secondary2 != null) {
              await this.issueSecondarySync(userWallet, secondary2, this.endpoint)
              numSyncsIssued += 1
            }
          } catch (e) {
            this.log(`Caught error for user ${user.wallet}, ${JSON.stringify(user)}, ${e.message}`)
          }
        }
      )
    )

    let previousModuloSlice = this.currentModuloSlice

    // Increment and adjust current slice by ModuloBase
    this.currentModuloSlice += 1
    this.currentModuloSlice = this.currentModuloSlice % ModuloBase

    this.log(`Updated modulo slice from ${previousModuloSlice} to ${this.currentModuloSlice}`)
    this.log(`Issued ${numSyncsIssued} sync ops`)
    this.log(`------------------END Process SnapbackSM Operation, slice ${previousModuloSlice} ------------------`)
  }

  // Track an ongoing sync operation to a secondary
  async monitorSecondarySync (syncWallet, primaryClockValue, secondaryUrl) {
    let startTime = Date.now()
    // Monitor the sync status
    let syncMonitoringRequestParameters = {
      method: 'get',
      baseURL: secondaryUrl,
      url: `/sync_status/${syncWallet}`,
      responseType: 'json'
    }
    let syncAttemptCompleted = false
    while (!syncAttemptCompleted) {
      try {
        let syncMonitoringResp = await axios(syncMonitoringRequestParameters)
        let respData = syncMonitoringResp.data.data
        this.log(`processSync ${syncWallet} secondary response: ${JSON.stringify(respData)}`)
        // A success response does not necessarily guarantee completion, validate response data to confirm
        if (respData.clockValue === primaryClockValue) {
          syncAttemptCompleted = true
          this.log(`processSync ${syncWallet} clockValue from secondary:${respData.clockValue}, primary:${primaryClockValue}`)
        }
      } catch (e) {
        this.log(`processSync ${syncWallet} error querying sync_status: ${e}`)
      }
      if (Date.now() - startTime > MaxSyncMonitoringDurationInMs) {
        this.log(`ERROR: processSync ${syncWallet} timeout for ${syncWallet}`)
        syncAttemptCompleted = true
      }
      // 1s delay between retries
      await utils.timeout(1000)
    }
    let duration = Date.now() - startTime
    if (!syncAttemptCompleted) {
      this.log(`Sync for ${syncWallet} at ${secondaryUrl} completed in ${duration}ms`)
    }
  }

  // Main sync queue job
  async processSyncOperation (job) {
    const syncRequestParameters = job.data.syncRequestParameters
    let isValidSyncJobData = (
      ('baseURL' in syncRequestParameters) &&
      ('url' in syncRequestParameters) &&
      ('method' in syncRequestParameters) &&
      ('data' in syncRequestParameters)
    )
    if (!isValidSyncJobData) {
      logger.error(`Invalid sync data found`)
      logger.error(job.data)
      return
    }
    const syncWallet = syncRequestParameters.data.wallet[0]
    const primaryClockValue = await this.getUserPrimaryClockValue(syncWallet)
    const secondaryUrl = syncRequestParameters.baseURL
    this.log(`------------------Process SYNC | User ${syncWallet} | Target: ${secondaryUrl} ------------------`)

    // Issue sync request to secondary
    await axios(syncRequestParameters)

    // Monitor the sync status
    await this.monitorSecondarySync(syncWallet, primaryClockValue, secondaryUrl)

    // Exit when sync status is computed
    // Determine how many times to retry this operation
    this.log('------------------END Process SYNC------------------')
  }

  // Function which ensures that state machine has been initialized correctly
  // If not available on startup, subsequent state machine will attempt to initialize until success
  async initializeNodeIdentityConfig () {
    this.log(`Initializing SnapbackSM`)
    this.log(`Retrieving spID for ${this.endpoint}`)
    this.log(`Developer mode: ${config.get('snapbackDevModeEnabled')}`)
    const recoveredSpID = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
      this.endpoint
    )
    config.set('spID', recoveredSpID)
    // A returned spID of 0 means this this.endpoint is currently not registered on chain
    // In this case, the stateMachine is considered to be 'uninitialized'
    if (recoveredSpID === 0) {
      this.initialized = false
      this.log(`Failed to recover spID for ${this.endpoint}, received ${config.get('spID')}`)
      return
    }
    this.log(`Recovered ${config.get('spID')} for ${this.endpoint}`)
    this.initialized = true
    return this.initialized
  }

  // Initialize the state machine
  async init () {
    await this.stateMachineQueue.empty()
    await this.syncQueue.empty()

    const isUserMetadata = config.get('isUserMetadataNode')
    if (isUserMetadata) {
      this.log(`SnapbackSM disabled for userMetadataNode. ${this.endpoint}, isUserMetadata=${isUserMetadata}`)
      return
    }

    // Initialize state machine queue processor
    this.stateMachineQueue.process(
      async (job, done) => {
        try {
          await this.processStateMachineOperation(job)
        } catch (e) {
          this.log(`stateMachineQueue error processing ${e}`)
        } finally {
          // TODO: Remove dev mode
          if (config.get('snapbackDevModeEnabled')) {
            this.log(`DEV MODE next job in ${DevDelayInMS}ms at ${new Date(Date.now() + DevDelayInMS)}`)
            await utils.timeout(DevDelayInMS)
            this.stateMachineQueue.add({ startTime: Date.now() })
          }
          done()
        }
      }
    )

    // Run the task every x time interval
    // */5 * * * *, every 5 minutes
    // 0 * * * *, every hour at minute 0
    if (!config.get('snapbackDevModeEnabled')) {
      this.stateMachineQueue.add({}, { repeat: { cron: '0 * * * *' } })
    }

    // Initialize sync queue processor function, as drained will issue syncs
    // A maximum of 10 sync jobs are allowed to be issued at once
    this.syncQueue.process(
      MaxParallelSyncJobs,
      async (job, done) => {
        try {
          await this.processSyncOperation(job)
        } catch (e) {
          this.log(`syncQueue error processing ${e}`)
        } finally {
          // Restart job
          // Can be replaced with cron after development is complete
          done()
        }
      }
    )

    // Enqueue first state machine operation if dev mode enabled
    if (config.get('snapbackDevModeEnabled')) {
      this.stateMachineQueue.add({ startTime: Date.now() })
    }

    await this.initializeNodeIdentityConfig()
  }
}

module.exports = SnapbackSM
