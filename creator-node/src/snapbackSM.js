const config = require('./config')
const Bull = require('bull')
const utils = require('./utils')
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
    if (!this.audiusLibs) throw new Error('Invalid libs provided to SnapbackSM')
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

  /*
    Main state machine processing function
    TODO: Update job arguments
  */
  async processStateMachineOperation (job) {
    this.log('------------------Process state machine operation------------------')
    // TODO: Translate working branch replica set processing
    // First step here is to implement discovery provider query
  }

  /*
    Initialize the configs necessary to run
  */
  async init () {
    const endpoint = config.get('creatorNodeEndpoint')
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
    // this.stateMachineQueue.add({ startTime: Date.now() })

    // Process state machine operations
    this.stateMachineQueue.process(async (job, done) => {
      try {
        await this.processStateMachineOperation(job)
      } catch (e) {
        logger.info(`Error processing ${e}`)
      } finally {
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
