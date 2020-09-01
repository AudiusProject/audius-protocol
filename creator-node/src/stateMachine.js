const Bull = require('bull')
const { logger } = require('./logging')
const utils = require('./utils')
const config = require('./config.js')
const axios = require('axios')
const models = require('./models')

// Snap back state machine
// Ensures file availability through sync and user replica operations
class SnapbackSM {
  constructor (audiusLibs) {
    // State machine queue processes all users
    this.stateMachineQueue = this.createBullQueue('creator-node-state-machine')

    // Sync queue handles issuing of sync operations
    this.syncQueue = this.createBullQueue('creator-node-sync-queue')

    this.audiusLibs = audiusLibs
    logger.info(`${this.audiusLibs == null}`)
  }

  createBullQueue(queueName) {
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
    let nodesInfoMap = { } // Will be converted into array
    let sharedRsets = { } // nodeId -> [rSets]

    // TODO: Evaluate thread safety?
    // What happens in the case of parallel updates to nodesInfoMap?
    await Promise.all(
      cnodeUsers.map(async (user) => {
        const primary = user.primary
        const secondaries = user.secondaries

        // Append replica_set value
        user.replica_set = [primary].concat(secondaries)

        // Check if primary spID exists in nodesInfoMap, if not add to object
        // Exclude own spID
        if (!nodesInfoMap[primary] && primary !== spInfo.spID) {
          // TODO: How will we pay for this / account for eth network latency IRL?
          let serviceEndpointInfo = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo('creator-node', primary)
          // In this case, current node is a secondary
          // Why? The primary stored on chain is not equal to the configured spID for this creator-node
          nodesInfoMap[primary] = serviceEndpointInfo
        }
        if (!sharedRsets[primary]) {
          sharedRsets[primary] = []
        }
        sharedRsets[primary].push(user)

        // Check if secondary spIDs exist in nodesInfoMap, if not add to object
        for (const secondary of secondaries) {
          if (secondary === spInfo.spID) {
            continue
          }
          if (!nodesInfoMap[secondary]) {
            let serviceEndpointInfo = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo('creator-node', secondary)
            nodesInfoMap[secondary] = serviceEndpointInfo
          }
          if (!sharedRsets[secondary]) {
            // TODO: Evaluate thread safety?
            sharedRsets[secondary] = []
          }
          sharedRsets[secondary].push(user)
        }
      })
    )

    // At this point, nodesInfoMap and sharedRsets are ready for further processing
    logger.info('--nodesInfoMap--')
    logger.info(nodesInfoMap)
    logger.info('--sharedRsets--')
    // logger.info(sharedRsets)
    await this.processSharedRsets(spInfo, nodesInfoMap, sharedRsets)
    logger.info('------------------END Process state machine operation------------------')
  }

  // StateMachine Queue Function
  // Process shared data structures after calculation
  async processSharedRsets(spInfo, nodeInfoMap, sharedRsets) {
    let nodeList = Object.keys(nodeInfoMap)
    await Promise.all(nodeList.map(async (nodeId)=> {
      logger.info('------------------Process shared rSet------------------')
      // logger.info(nodeId)
      let targetNodeInfo = nodeInfoMap[nodeId]
      // logger.info(`targeting ${JSON.stringify(targetNodeInfo)}`)
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
      await Promise.all(
        cnodePrimaryUsers.map(async (user)=> {
          let walletPublicKey = user.wallet
          logger.info(`Sending clock request to ${nodeId} - ${targetNodeInfo.endpoint} for user ${walletPublicKey}`)
          let requestParams = {
            method: 'get',
            baseURL: targetNodeInfo.endpoint,
            url: `/users/clock_status/${walletPublicKey}`,
            responseType: 'json'
          }
          // TODO: Hit axios route
          let resp = await axios(requestParams)
          let secondaryClockValue = resp.data.clockValue
          const cnodeUser = await models.CNodeUser.findOne({ where: { walletPublicKey } })
          let primaryClockValue = cnodeUser.clock
          logger.info(`USER ${walletPublicKey} | primary=${spInfo.spID} secondaryInfo=${targetNodeInfo.spID} primaryClock=${primaryClockValue}, secondaryClock=${secondaryClockValue}`)
          if (primaryClockValue == secondaryClockValue) {
            logger.info(`USER ${walletPublicKey} | No SYNC REQUIRED BETWEEN primary=${spInfo.spID} secondaryInfo=${targetNodeInfo.spID} primaryClock=${primaryClockValue}, secondaryClock=${secondaryClockValue}`)

          } else if (primaryClockValue > secondaryClockValue) {
            logger.info(`USER ${walletPublicKey} | SYNC REQUIRED BETWEEN primary=${spInfo.spID} secondaryInfo=${targetNodeInfo.spID} primaryClock=${primaryClockValue}, secondaryClock=${secondaryClockValue}`)
            // Issue sync
            let syncRequestParameters = {
              baseURL: targetNodeInfo.endpoint,
              url: '/sync',
              method: 'post',
              data: {
                wallet: [walletPublicKey],
                creator_node_endpoint: spInfo.endpoint,
                immediate: true
              }
            }
            logger.info(syncRequestParameters)
            // NOTE - THIS NOW WORKS, MUST BE ABSTRACTED
            // let syncResp = await axios(syncParams)
            // logger.info(syncResp)
            logger.info(`Adding ${walletPublicKey} to sync queue, count=${await this.syncQueue.count()}`)
            await this.syncQueue.add({ syncRequestParameters, startTime: Date.now() }, { lifo: true })
            logger.info(`Finished adding ${walletPublicKey} to sync queue, count=${await this.syncQueue.count()}`)
          }
          // If primary is BEHIND secondary, update rset state for wallet and determine reconfig
        }
        )
      )

      // TODO: Non-primary operations will include reconfiguration/etc

      // Filter users that match this sp primary
      logger.info('------------------END Process shared rSet------------------')
    }))
  }

  // Main sync queue job
  async processSyncOperation(job) {
    logger.info('------------------Process SYNC------------------')
    logger.info(job.data)
    let syncRequestParameters = job.data.syncRequestParameters
    logger.info(syncRequestParameters)
    // TODO: Expand this and actually check validity of data params
    let isValidSyncJobData = (
      ('baseURL' in syncRequestParameters) &&
      ('url' in syncRequestParameters) &&
      ('method' in syncRequestParameters) &&
      ('data' in syncRequestParameters)
    )
    logger.info(`isValidSync ${isValidSyncJobData}`)
    if (!isValidSyncJobData) {
      logger.error(`Invalid sync data found`)
      logger.error(job.data)
      return
    }
    // Issue sync request to secondary
    await axios(syncRequestParameters)
    logger.info('------------------END Process SYNC------------------')
  }

  // Initialize the creator node state machine
  async init () {
    await this.stateMachineQueue.empty()
    await this.syncQueue.empty()

    // TODO: Enable after dev
    // Run the task every x hours
    // this.stateMachineQueue.add({}, { repeat: { cron: '0 */x * * *' } })

    this.stateMachineQueue.add({ startTime: Date.now() })

    this.stateMachineQueue.process(async (job, done) => {
        try {
          await this.processStateMachineOperation(job)
        } catch (e) {
          logger.info(`Error processing ${e}`)
        } finally {
          await utils.timeout(10000)
          // Restart job
          // Can be replaced with cron after development is complete
          this.stateMachineQueue.add({ startTime: Date.now() })
          done()
        }
      }
    )
    this.syncQueue.process(async (job, done) => {
        try {
          await this.processSyncOperation(job)
        } catch (e) {
          logger.info(`Error processing ${e}`)
        } finally {
          // Restart job
          // Can be replaced with cron after development is complete
          done()
        }
      }
    )
  }
}

module.exports = SnapbackSM
