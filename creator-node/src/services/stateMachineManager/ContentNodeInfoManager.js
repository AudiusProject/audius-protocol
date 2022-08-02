const { logger: genericLogger } = require('../../logging')
const _ = require('lodash')

/**
 * Queries to periodically keep the mapping of (Content Node endpoint -> SP ID)
 * up to date.
 * TODO: Make updateContentNodeChainInfo into a cron or its own queue after deciding on a reasonable interval.
 */
class ContentNodeInfoManager {
  constructor() {
    this.cNodeEndpointToSpIdMap = {}
    this.contentNodeSpIdToChainInfo = {}
  }

  getCNodeEndpointToSpIdMap() {
    return this.cNodeEndpointToSpIdMap
  }

  getSpIdFromCNodeEndpoint(endpoint) {
    return this.cNodeEndpointToSpIdMap[endpoint]
  }

  getContentNodeInfoFromSpId(spID) {
    return this.contentNodeSpIdToChainInfo[spID]
  }

  /**
   * Updates `this.cNodeEndpointToSpIdMap` to the mapping of <endpoint : spId>. If the fetch fails, rely on the previous
   * `this.cNodeEndpointToSpIdMap` value. If the existing map is empty, throw error as we need this map to issue reconfigs.
   * @param {Object} ethContracts audiusLibs.ethContracts instance; has helper fn to get service provider info
   */
  async updateContentNodeChainInfo(ethContracts) {
    const cNodeEndpointToSpIdMap = {}
    const contentNodeSpIdToChainInfo = {}

    let contentNodes
    try {
      contentNodes = await ethContracts.getServiceProviderList('content-node')
    } catch (e) {
      throw new Error(
        `ContentNodeInfoManager - Could not fetch content nodes: ${e.message}`
      )
    }

    if (_.isEmpty(contentNodes)) {
      throw new Error(
        'ContentNodeInfoManager - Empty Content Node info from chain'
      )
    }

    contentNodes.forEach((cn) => {
      cNodeEndpointToSpIdMap[cn.endpoint] = cn.spID
      contentNodeSpIdToChainInfo[cn.spID] = cn
    })

    this.cNodeEndpointToSpIdMap = cNodeEndpointToSpIdMap
    this.contentNodeSpIdToChainInfo = contentNodeSpIdToChainInfo

    genericLogger.info(
      `ContentNodeInfoManager - updateContentNodeChainInfo Success. Size: ${
        Object.keys(cNodeEndpointToSpIdMap).length
      }`
    )
  }
}

module.exports = new ContentNodeInfoManager()
