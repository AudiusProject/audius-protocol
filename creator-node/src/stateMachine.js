const Bull = require('bull')
const { logger } = require('./logging')
const utils = require('./utils')
const config = require('./config.js')

// TODO: Come up with a distinct name for this
class StateMachine {
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
    cnodeUsers.map((user) => {
      const primary = user.primary
      const secondaries = user.secondaries

      // Append replica_set value
      user.replica_set = [primary].concat(secondaries)

      // Check if primary spID exists in nodeList, if not add to object
      // Exclude own spID
      if (!nodeList[primary] && primary !== spInfo.spID) {
        nodeList[primary] = true
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
          nodeList[secondary] = true
        }
        if (!sharedRsets[secondary]) {
          // TODO: Evaluate thread safety?
          sharedRsets[secondary] = []
        }
        sharedRsets[secondary].push(user)
      }
    })

    // At this point, nodeList and sharedRsets are ready for further processing
    nodeList = Object.keys(nodeList)
    logger.info('--nodeList--')
    logger.info(nodeList)
    logger.info('--sharedRsets--')
    logger.info(sharedRsets)
    logger.info('------------------END Process state machine operation------------------')
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
        await utils.timeout(3000)
        await this.processStateMachineOperation(job)
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

module.exports = StateMachine
