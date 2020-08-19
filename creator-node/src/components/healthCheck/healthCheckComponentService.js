const versionInfo = require('../../../.version.json')
const { getLogger } = require('../../logging.js')

/**
 * Perform a basic health check, returning the
 * currently selected discovery provider (if any),
 * the current git SHA, and service version info.
 * @param {*} ServiceRegistry
 */
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
    logger.warn('Health check with no libs')
  }

  return response
}

module.exports = {
  healthCheck
}
