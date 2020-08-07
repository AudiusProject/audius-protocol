const Bull = require('bull')
const { logger } = require('./logging')
const utils = require('./utils')
const config = require('./config.js')

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
  }

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

  async processStateMachineOperation (job) {
    await utils.timeout(1000) 
    logger.info('------------------Process state machine operation------------------')
    logger.info(`job: ${job}`)
    if (this.audiusLibs == null) {
      logger.error(`Invalid libs instance`)
      return
    }

    // Retrieve base information for state machine operations
    let info = await this.getSPInfo()
    if (info.spID == 0) {
      console.error(`Invalid spID, recovering ${info}`)
      const recoveredSpID = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
        config.get('creatorNodeEndpoint')
      )
      console.log(`Recovered ${recoveredSpID} for ${config.get('creatorNodeEndpoint')}`)
      config.set('spID', recoveredSpID)
      return
    }

    console.log(info)
    let cnodeUsers = await this.audiusLibs.discoveryProvider.getUsersForCreatorNode(info.spID)
    console.log(`Users:`)
    console.log(cnodeUsers)
    logger.info('------------------END Process state machine operation------------------')
  }

  async init () {
    await this.stateMachineQueue.empty()

    // TODO: Enable after dev
    // Run the task every x hours
    // this.stateMachineQueue.add({}, { repeat: { cron: '0 */x * * *' } })

    this.stateMachineQueue.add({ startTime : Date.now() })

    this.stateMachineQueue.process(async (job, done) => {
      try {
        await this.processStateMachineOperation(job)
      } catch (e) {
        logger.info(`Error processing ${e}`)
      } finally {
        // Restart job
        // Can be replaced with cron after development is complete
        this.stateMachineQueue.add({ startTime : Date.now() })
        done()
      }
    })
  }
}

module.exports = StateMachine
