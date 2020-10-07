const config = require('./config')
const Bull = require('bull')
const axios = require('axios')
const utils = require('./utils')
const models = require('./models')
const { logger } = require('./logging')

const DevDelayInMS = 10000

/*
  Snap back state machine
  Ensures file availability through sync and user replica operations
*/
class SnapbackSM {
  constructor (audiusLibs) {
    this.audiusLibs = audiusLibs
    this.initialized = false
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
    this.log(`Constructed snapback!`)
  }

  // Class level log output
  log (msg) {
    if (!this.debug) return
    logger.info(`SnapbackSM: ${msg}`)
  }

  /*
    Initialize queue object with provided name
  */
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

  // Helper function to retrieve all config based
  async getSPInfo () {
    const spID = config.get('spID')
    const endpoint = config.get('creatorNodeEndpoint')
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
      config.get('creatorNodeEndpoint')
    )
    this.log(`Recovered ${recoveredSpID} for ${config.get('creatorNodeEndpoint')}`)
    config.set('spID', recoveredSpID)
  }

  /*
    http://audius-disc-prov_web-server_1:5000/users/creator_node?creator_node_endpoint=http://cn2_creator-node_1:4001
    Send request to discovery provider for all users with this node as primary
  */
  async getNodePrimaryUsers () {
    const currentlySelectedDiscProv = this.audiusLibs.discoveryProvider.discoveryProviderEndpoint
    let requestParams = {
      method: 'get',
      baseURL: currentlySelectedDiscProv,
      url: `users/creator_node`,
      params: {
        creator_node_endpoint: config.get('creatorNodeEndpoint') 
      }
    }
    let resp = await axios(requestParams)
    this.log(`Discovery provider: ${currentlySelectedDiscProv}`)
    // this.log(JSON.stringify(resp))
    return resp.data.data
  }

  /*
    Retrieve the current clock value on this node for the provided user wallet
  */
  async getUserPrimaryClockValue (wallet) {
    let walletPublicKey = wallet.toLowerCase()
    const cnodeUser = await models.CNodeUser.findOne({
      where: { walletPublicKey }
    })
    const clockValue = (cnodeUser) ? cnodeUser.dataValues.clock : -1
    return clockValue
  }

  /* 
    Retrieve the current clock value on a secondary node
  */
  async getSecondaryClockValue (wallet, secondaryEndpoint) {
    let resp = await axios({
      method: 'get',
      baseURL: secondaryEndpoint,
      url: `/users/clock_status/${wallet}`,
      responseType: 'json'
    })
    return resp.data.clockValue
  }

  /*
    Main state machine processing function
  */
  async processStateMachineOperation (job) {
    this.log('------------------Process state machine operation------------------')
    // TODO: Translate working branch replica set processing
    // First step here is to implement discovery provider query
    if (this.audiusLibs == null) {
      logger.error(`Invalid libs instance`)
      return
    }

    // 1.) Retrieve base information for state machine operations
    let spInfo = await this.getSPInfo()
    if (spInfo.spID === 0) {
      console.error(`Invalid spID, recovering ${spInfo}`)
      await this.recoverSpID()
      return
    }

    let usersList = await this.getNodePrimaryUsers()
    console.log(usersList)
    this.log(usersList)
    this.log(`usersList: ${usersList}`)
    // Issue queries to secondaries for each user
    await Promise.all(usersList.map(async (user)=>{
      let userWallet = user.wallet
      let secondary1 = user.secondary1
      let secondary2 = user.secondary2
      let primaryClockValue = await this.getUserPrimaryClockValue(userWallet)
      this.log(``)
      this.log(`processStateMachineOperation |${userWallet} secondary1=${secondary1}, secondary2=${secondary2}`)
      this.log(`processStateMachineOperation |${userWallet} primaryClock=${primaryClockValue}`)
      let secondary1ClockValue = await this.getSecondaryClockValue(userWallet, secondary1)
      let secondary2ClockValue = await this.getSecondaryClockValue(userWallet, secondary1)
      let secondary1SyncRequired = primaryClockValue > secondary1ClockValue
      let secondary2SyncRequired = primaryClockValue > secondary2ClockValue
      this.log(`processStateMachineOperation |${userWallet} secondary1ClockValue=${secondary1ClockValue}, secondary1SyncRequired=${secondary1SyncRequired}`)
      this.log(`processStateMachineOperation |${userWallet} secondary2ClockValue=${secondary2ClockValue}, secondary2SyncRequired=${secondary2SyncRequired}`)
    }))
  }

  /*
    Initialize the configs necessary to run
  */
  async init () {
    const endpoint = config.get('creatorNodeEndpoint')
    const isUserMetadata = config.get('isUserMetadataNode')
    if (isUserMetadata) {
      this.log(`SnapbackSM disabled for userMetadataNode. ${endpoint}, isUserMetadata=${isUserMetadata}`)
      return
    }

    if (!this.initialized) {
      this.log(`Initializing SnapbackSM`)
      this.log(`Retrieving spID for ${endpoint}`)
      const recoveredSpID = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
        endpoint
      )
      // A returned spID of 0 means this endpoint is currently not registered on chain
      // In this case, the stateMachine is considered to be 'uninitialized'
      if (recoveredSpID === 0) return
      config.set('spID', recoveredSpID)
      this.initialized = true
    }
    this.log(`Recovered ${config.get('spID')} for ${endpoint}`)

    // TODO: Enable after dev
    // Run the task every x time interval
    // this.stateMachineQueue.add({}, { repeat: { cron: '0 */x * * *' } })

    // Enqueue first state machine operation
    // TODO: Remove this line permanently prior to final check-in
    this.stateMachineQueue.add({ startTime: Date.now() })

    // Process state machine operations
    this.stateMachineQueue.process(
      async (job, done) => {
        try {
          await this.processStateMachineOperation(job)
        } catch (e) {
          this.log(`Error processing ${e}`)
        } finally {
          // TODO: Remove dev mode
          this.log(`DEV MODE next job in ${DevDelayInMS}ms at ${new Date(Date.now() + DevDelayInMS)}`)
          await utils.timeout(DevDelayInMS)
          this.stateMachineQueue.add({ startTime: Date.now() })
          done()
        }
      }
    )
  }
}

module.exports = SnapbackSM
