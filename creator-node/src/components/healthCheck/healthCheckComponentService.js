const versionInfo = require('../../../.version.json')
const config = require('../../config')

/**
 * Perform a basic health check, returning the
 * currently selected discovery provider (if any),
 * the current git SHA, and service version info.
 * @param {*} ServiceRegistry
 * @param {*} logger
 */
const healthCheck = async ({ libs } = {}, logger, sequelize) => {
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

  // we have a /db_check route for more granular detail, but the service health check should
  // also check that the db connection is good. having this in the health_check
  // allows us to get auto restarts from liveness probes etc if the db connection is down
  await sequelize.query('SELECT 1')

  return response
}

module.exports = {
  healthCheck
}
