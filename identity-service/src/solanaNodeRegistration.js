const Bull = require('bull')
const config = require('./config.js')

const JOB_FREQUENCY_MS = 15 /* min */ * 60 /* sec */ * 1000 /* msec */

const registerNodes = async (audiusLibs, logger) => {
  logger.info('Beginning node registration job')
  const nodes = await audiusLibs.ServiceProvider.discoveryProvider.serviceSelector.getServices({ verbose: true })
  const unregistered = []
  for (const node of nodes) {
    const isRegistered = await audiusLibs.solanaWeb3Manager.getIsDiscoveryNodeRegistered(node.delegateOwnerWallet)

    if (!isRegistered) {
      logger.info(`Node ${node.endpoint} is unregistered!`)
      unregistered.push(node)
    }
  }

  if (unregistered.length) {
    logger.info(`Found unregistered nodes: ${JSON.stringify(unregistered.map(n => n.endpoint))}}`)
  } else {
    logger.info(`All nodes successfully registered on Solana!`)
    return
  }

  // Can comment this part out if unnecessary
  for (const node of unregistered) {
    logger.info(`Attempting to register node: ${node.endpoint}`)
    try {
      const res = await audiusLibs.Rewards.createSenderPublic({
        senderEthAddress: node.delegateOwnerWallet,
        operatorEthAddress: node.owner,
        senderEndpoint: node.endpoint
      })

      if (!res.error) {
        logger.info(`Registered ${node.endpoint}`)
      } else {
        logger.error(`Error registering: ${node.endpoint}`)
      }
    } catch (e) {
      logger.error(`Got error creating for node: ${e.endpoint}`)
    }
  }
}

const registrationQueue = new Bull('solana-discovery-node-registration',
  {
    redis: {
      port: config.get('redisPort'),
      host: config.get('redisHost')
    },
    removeOnComplete: true,
    removeOnFail: true
  }
)

const startRegistrationQueue = async (audiusLibs, logger) => {
  registrationQueue.process(async () => {
    await registerNodes(audiusLibs, logger)
  })

  await registrationQueue.add({}, {
    repeat: {
      every: JOB_FREQUENCY_MS
    }
  })
}

module.exports = {
  startRegistrationQueue
}
