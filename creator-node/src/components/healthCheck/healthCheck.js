const versionInfo = require('../../../.version.json')
const { getLogger } = require('../../logging.js')

const healthCheck = ({ libs } = {}) => {
  const logger = getLogger()

  let response = {
    ...versionInfo,
    'healthy': true,
    'git': process.env.GIT_SHA,
    'selectedDiscoveryProvider': 'none'
  }

  if (libs) {
    response.selectedDiscoveryProvider = libs.discoveryProvider.discoveryProviderEndpoint
  } else {
    logger.warn("Health check with no libs")
  }

  return response
}

module.exports = {
  healthCheck
}
