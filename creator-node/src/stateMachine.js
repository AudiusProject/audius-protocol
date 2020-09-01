const Bull = require('bull')
const { logger } = require('./logging')
const utils = require('./utils')
const config = require('./config.js')
const axios = require('axios')

// Snap back state machine
// Ensures file availability through sync and user replica operations
class SnapbackSM {
  constructor (audiusLibs) {
    this.stateMachineQueue = new Bull(
      'creator-node-state-machine',
      {
        redis: {
          port: config.get('redisPort'),
          host: config.get('redisHost')
        }
      }
    )

    this.audiusLibs = audiusLibs
    logger.info(`${this.audiusLibs == null}`)
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
      logger.info(`Known spID=${config.get('spID')}`)
      return
    }

    const recoveredSpID = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
      config.get('creatorNodeEndpoint')
    )
    logger.info(`Recovered ${recoveredSpID} for ${config.get('creatorNodeEndpoint')}`)
    config.set('spID', recoveredSpID)
  }

  // Main state machine processing function
  // TODO: Update job arguments appropriately
  async processStateMachineOperation (job) {
    logger.info('------------------Process state machine operation------------------')
    logger.info(`job: ${job}`)
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

    logger.info(`--spInfo--`)
    logger.info(spInfo)
    // 2.) Retrieve all users for this creator node
    // TODO: Consider pagination here - already enabled in query
    let cnodeUsers = await this.audiusLibs.discoveryProvider.getUsersForCreatorNode(spInfo.spID)

    // 3.) Determine list of nodes that share replica sets with this node
    //     This includes all distinct nodes that are part of the list of cnodeUsers returned above
    let nodeList = { } // Will be converted into array
    let sharedRsets = { } // nodeId -> [rSets]

    // TODO: Evaluate thread safety?
    // What happens in the case of parallel updates to nodeList?
    await Promise.all(
      cnodeUsers.map(async (user) => {
        const primary = user.primary
        const secondaries = user.secondaries

        // Append replica_set value
        user.replica_set = [primary].concat(secondaries)
        logger.info()

        // Check if primary spID exists in nodeList, if not add to object
        // Exclude own spID
        if (!nodeList[primary] && primary !== spInfo.spID) {
          // TODO: How will we pay for this / account for eth network latency IRL?
          let serviceEndpointInfo = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo('creator-node', primary)
          // In this case, current node is a secondary
          // Why? The primary stored on chain is not equal to the configured spID for this creator-node
          nodeList[primary] = serviceEndpointInfo
        }
        if (!sharedRsets[primary]) {
          sharedRsets[primary] = []
        }
        sharedRsets[primary].push(user)

        // Check if secondary spIDs exist in nodeList, if not add to object
        for (const secondary of secondaries) {
          if (secondary === spInfo.spID) {
            continue
          }
          if (!nodeList[secondary]) {
            let serviceEndpointInfo = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo('creator-node', secondary)
            nodeList[secondary] = serviceEndpointInfo
          }
          if (!sharedRsets[secondary]) {
            // TODO: Evaluate thread safety?
            sharedRsets[secondary] = []
          }
          sharedRsets[secondary].push(user)
        }
      })
    )

    // At this point, nodeList and sharedRsets are ready for further processing
    logger.info('--nodeList--')
    logger.info(nodeList)
    logger.info('--sharedRsets--')
    // logger.info(sharedRsets)
    await this.processSharedRsets(spInfo, nodeList, sharedRsets)
    logger.info('------------------END Process state machine operation------------------')
  }

  async processSharedRsets(spInfo, nodesInfo, sharedRsets) {
    let nodeList = Object.keys(nodesInfo)
    await Promise.all(nodeList.map(async (nodeId)=> {
      logger.info('------------------Process cshared rSet------------------')
      logger.info(nodeId)
      let targetNodeInfo = nodesInfo[nodeId]
      logger.info(`targeting ${JSON.stringify(targetNodeInfo)}`)
      // Users shared with remote creator node
      let sharedUsers = sharedRsets[nodeId]
      // Calculate users for which this node is primary
      let cnodePrimaryUsers = sharedUsers.filter((user) => {
        if (user.primary == spInfo.spID) {
          return true
        }
        return false
      })
      // handle users for which this node is primary
      // logger.info(`Current primary users shared with node ${nodeId}`)
      // logger.info(cnodePrimaryUsers)
      await cnodePrimaryUsers.map(async (user)=> {
        let walletPublicKey = user.wallet
        logger.info(`Sending clock request to ${nodeId} - ${targetNodeInfo.endpoint} for user ${walletPublicKey}`)
        let requestParams = {
          method: 'get',
          baseURL: targetNodeInfo.endpoint,
          url: `/users/clock_status/${walletPublicKey}`,
          responseType: 'json'
        }
        logger.info(requestParams)
        // TODO: Hit axios route
        let resp = await axios(requestParams)
        logger.info(`----`)
        logger.info(resp.data)
        let secondaryClockValue = resp.data.clockValue
        logger.info(`From ${targetNodeInfo.endpoint} - clock request resp= clockVal: ${secondaryClockValue} for user ${walletPublicKey}`)
      })


      // TODO: Non-primary operations will include reconfiguration/etc

      // Filter users that match this sp primary
      logger.info('------------------END Process cshared rSet------------------')
    }))
  }

  // Initialize the creator node state machine
  async init () {
    await this.stateMachineQueue.empty()

    // TODO: Enable after dev
    // Run the task every x hours
    // this.stateMachineQueue.add({}, { repeat: { cron: '0 */x * * *' } })

    this.stateMachineQueue.add({ startTime: Date.now() })

    this.stateMachineQueue.process(async (job, done) => {
      try {
        await this.processStateMachineOperation(job)
        await utils.timeout(3000)
      } catch (e) {
        logger.info(`Error processing ${e}`)
      } finally {
        // Restart job
        // Can be replaced with cron after development is complete
        this.stateMachineQueue.add({ startTime: Date.now() })
        done()
      }
    })
  }
}

module.exports = SnapbackSM
