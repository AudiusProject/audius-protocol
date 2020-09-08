const config = require('./config')
const Bull = require('bull')
const { logger } = require('./logging')

// Snap back state machine
// Ensures file availability through sync and user replica operations
class SnapbackSM {
    constructor (audiusLibs) {
        this.audiusLibs = audiusLibs
        this.initialized = false
        // Toggle to switch logs
        this.debug = true
        this.log(`Constructed snapback!`)
    }

    log(msg) {
        if (!this.debug) return
        logger.info(`SnapbackSM: ${msg}`)
    }

    // Initialize the configs necessary
    async init() {
        this.log(`Initializing SnapbackSM`)
        const spID = config.get('spID')
        const endpoint = config.get('creatorNodeEndpoint')
        if (spID === 0 && this.audiusLibs) {
          this.log(`Retrieving spID for ${endpoint}`)
          const recoveredSpID = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
            config.get('creatorNodeEndpoint')
          )
          config.set('spID', recoveredSpID)
          this.initialized = true
        }
        this.log(`Recovered ${config.get('spID')} for ${config.get('creatorNodeEndpoint')}`)
    }
}

module.exports = SnapbackSM