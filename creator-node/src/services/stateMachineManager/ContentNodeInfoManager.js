const { logger: genericLogger } = require('../../logging')
const _ = require('lodash')

/**
 * Queries to periodically keep the mapping of (Content Node endpoint -> SP ID)
 * up to date.
 *
 * @dev Since this class holds all state in memory, it is not concurrency-compatible
 */
class ContentNodeInfoManager {
  constructor() {
    this.cNodeEndpointToSpIdMap = {}
    this.contentNodeSpIdToChainInfo = {}
  }

  /**
   *
   * @returns {Record<string, number} - mapping of <endpoint : spid info on chain>
   */
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
   * Updates `this.cNodeEndpointToSpIdMap` to the mapping of <endpoint : spId>, and `this.contentNodeSpIdToChainInfo`
   * to the mapping of <spId : sp info on chain>. If the fetch fails, rely on the previous `this.cNodeEndpointToSpIdMap`
   * and `this.contentNodeSpIdToChainInfo` values. If the existing map is empty, throw error as we need this map to issue reconfigs.
   * @param {Object} ethContracts audiusLibs.ethContracts instance; has helper fn to get service provider info
   */
  async updateContentNodeChainInfo(ethContracts) {
    const cNodeEndpointToSpIdMap = {}
    const contentNodeSpIdToChainInfo = {}

    try {
      const contentNodes = await ethContracts.getServiceProviderList(
        'content-node'
      )
      contentNodes.forEach((cn) => {
        cNodeEndpointToSpIdMap[cn.endpoint] = cn.spID
        contentNodeSpIdToChainInfo[cn.spID] = cn
      })
    } catch (e) {
      genericLogger.error(
        `ContentNodeInfoManager - Could not fetch content nodes: ${e.message}`
      )
    }

    if (Object.keys(cNodeEndpointToSpIdMap).length > 0) {
      this.cNodeEndpointToSpIdMap = cNodeEndpointToSpIdMap
      this.contentNodeSpIdToChainInfo = contentNodeSpIdToChainInfo
    }

    const numOfcNodeEndpointToSpIdMapKeys = Object.keys(
      this.cNodeEndpointToSpIdMap
    ).length
    if (numOfcNodeEndpointToSpIdMapKeys === 0) {
      const errorMessage =
        'ContentNodeInfoManager - Unable to initialize cNodeEndpointToSpIdMap'
      genericLogger.error(errorMessage)
      throw new Error(errorMessage)
    }

    const numOfContentNodeSpIdToChainInfoKeys = Object.keys(
      this.contentNodeSpIdToChainInfo
    ).length
    if (numOfContentNodeSpIdToChainInfoKeys === 0) {
      const errorMessage =
        'ContentNodeInfoManager - Unable to initialize contentNodeSpIdToChainInfo'
      genericLogger.error(errorMessage)
      throw new Error(errorMessage)
    }

    genericLogger.info(
      `ContentNodeInfoManager - updateContentNodeChainInfo Success. cNodeEndpointToSpIdMap size: ${numOfcNodeEndpointToSpIdMapKeys} contentNodeSpIdToChainInfo size: ${numOfContentNodeSpIdToChainInfoKeys}`
    )
  }
}

module.exports = new ContentNodeInfoManager()
