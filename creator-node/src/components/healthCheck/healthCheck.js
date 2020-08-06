const versionInfo = require('../../../.version.json')

const healthCheck = ({ libs }) => {
    let response = {
      ...versionInfo,
      'healthy': true,
      'git': process.env.GIT_SHA,
      'selectedDiscoveryProvider': 'none'
    }

    if (libs) {
      response.selectedDiscoveryProvider = libs.discoveryProvider.discoveryProviderEndpoint
    }

    return response
}

module.exports = {
  healthCheck
}
