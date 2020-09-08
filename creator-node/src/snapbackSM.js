const config = require('./config')

// Snap back state machine
// Ensures file availability through sync and user replica operations
class SnapbackSM {
    constructor (audiusLibs) {
        this.audiusLibs = audiusLibs
        console.log('Constructed snapback!')
    }

    async init() {
        const spID = config.get('spID')
        const endpoint = config.get('creatorNodeEndpoint')
        if (spID === 0 && this.audiusLibs) {
          console.log(`Retrieving spID for ${endpoint}`)
          const recoveredSpID = await this.audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(
            config.get('creatorNodeEndpoint')
          )
          console.log(`Recovered ${recoveredSpID} for ${config.get('creatorNodeEndpoint')}`)
          config.set('spID', recoveredSpID)
        }
    }
}

module.exports = SnapbackSM