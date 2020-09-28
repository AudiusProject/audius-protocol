const versionInfo = require('../../../.version.json')
const config = require('../../config')

/**
 * Perform a basic health check, returning the
 * currently selected discovery provider (if any),
 * the current git SHA, and service version info.
 * @param {*} ServiceRegistry
 * @param {*} logger
 */
const healthCheck = ({ libs } = {}, logger) => {
  let response = {
    ...versionInfo,
    'healthy': true,
    'git': process.env.GIT_SHA,
    'selectedDiscoveryProvider': 'none',
    'creatorNodeEndpoint': config.get('creatorNodeEndpoint'),
    'spID': config.get('spID')
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
