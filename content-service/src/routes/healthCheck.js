const { handleResponse, successResponse } = require('../apiHelpers')
const models = require('../models')
const versionInfo = require('../../.version.json')
const config = require('../config')

const IpfsRepoMaxUsagePercent = 90

module.exports = function (app) {
  /**
   * By default will only show highest replicated blocknumbers to minimize latency.
   * Optionally will also diff against discprov and show ipfs repo stats.
   */
  app.get('/health_check', handleResponse(async (req, res) => {
    const verbose = (req.query.verbose === 'true')

    const highestUserBlockNumber = await models.Block.max('blocknumber', { where: { 'type': 'user' } }) || 0
    const highestTrackBlockNumber = await models.Block.max('blocknumber', { where: { 'type': 'track' } }) || 0

    if (!verbose) {
      return successResponse({
        'healthy': true,
        'git': process.env.GIT_SHA,
        'highest_replicated_user_blocknumber': highestUserBlockNumber,
        'highest_replicated_track_blocknumber': highestTrackBlockNumber
      })
    }

    const libs = req.app.get('audiusLibs')
    // TODO - get discprov highest indexed user blocknumber after API change
    const discprovLatestTracks = await libs.Track.getTracks(1, 0, null, null, 'blocknumber:desc')
    const discprovTrackBlockNumber = ((discprovLatestTracks && discprovLatestTracks[0] && discprovLatestTracks[0].blocknumber)
      ? discprovLatestTracks[0].blocknumber
      : 0
    )

    const ipfs = req.app.get('ipfsAPI')
    const ipfsRepoStats = await ipfs.repo.stat()
    const usagePercent = (ipfsRepoStats.repoSize / ipfsRepoStats.storageMax) * 100
    const ipfsPeerAddresses = config.get('ipfsPeerAddresses').split(',').filter(Boolean)

    return successResponse({
      'healthy': true,
      'git': process.env.GIT_SHA,
      'user_state': {
        'replicated_blocknumber': highestUserBlockNumber
        // TODO - discprov_latest_blocknumber & behind_by
      },
      'track_state': {
        'replicated_blocknumber': highestTrackBlockNumber,
        'discprov_latest_blocknumber': discprovTrackBlockNumber,
        'behind_by': discprovTrackBlockNumber - highestTrackBlockNumber
      },
      'ipfs': {
        'repo_usage_percent': `${usagePercent}% used of max ${IpfsRepoMaxUsagePercent}%`,
        'peer_addresses': ipfsPeerAddresses
      }
    })
  }))

  app.get('/version', handleResponse(async (req, res) => {
    return successResponse(versionInfo)
  }))
}
