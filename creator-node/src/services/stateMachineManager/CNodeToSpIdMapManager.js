const { logger: genericLogger } = require('../../logging')

/**
 * Queries to periodically keep the mapping of (Content Node endpoint -> SP ID)
 * up to date.
 * TODO: Make updateCnodeEndpointToSpIdMap into a cron or its own queue after deciding on a reasonable interval.
 */
class CNodeToSpIdMapManager {
  constructor() {
    this.cNodeEndpointToSpIdMap = {}
  }

  printMapping(msg) {
    genericLogger.info(
      `vicki was here || ${JSON.stringify(this.cNodeEndpointToSpIdMap)} || ${
        Object.keys(this.cNodeEndpointToSpIdMap).length
      } || ${Object.keys(this.cNodeEndpointToSpIdMap)} || ${Object.values(
        this.cNodeEndpointToSpIdMap
      )} || ${msg}`
    )
    genericLogger.info(this.cNodeEndpointToSpIdMap)
  }

  getCNodeEndpointToSpIdMap() {
    return this.cNodeEndpointToSpIdMap
  }

  /**
   * Updates `this.cNodeEndpointToSpIdMap` to the mapping of <endpoint : spId>. If the fetch fails, rely on the previous
   * `this.cNodeEndpointToSpIdMap` value. If the existing map is empty, throw error as we need this map to issue reconfigs.
   * @param {Object} ethContracts audiusLibs.ethContracts instance; has helper fn to get service provider info
   */
  async updateCnodeEndpointToSpIdMap(ethContracts) {
    const cNodeEndpointToSpIdMap = {}
    try {
      const contentNodes = await ethContracts.getServiceProviderList(
        'content-node'
      )
      this.printMapping(`vickyy iter ${contentNodes.toString()}`)

      contentNodes.forEach((cn) => {
        cNodeEndpointToSpIdMap[cn.endpoint] = cn.spID
      })
      this.printMapping(
        `vickyy the map ${JSON.stringify(cNodeEndpointToSpIdMap)}`
      )
    } catch (e) {
      genericLogger.error(`updateCnodeEndpointToSpIdMap Error: ${e.message}`)
    }

    if (Object.keys(cNodeEndpointToSpIdMap).length > 0) {
      this.printMapping('vickyy before setting')
      this.cNodeEndpointToSpIdMap = cNodeEndpointToSpIdMap
      this.printMapping('vickyy after setting')
    }

    const mapLength = Object.keys(this.cNodeEndpointToSpIdMap).length
    if (mapLength === 0) {
      const errorMessage =
        'updateCnodeEndpointToSpIdMap() Unable to initialize cNodeEndpointToSpIdMap'
      genericLogger.error(errorMessage)
      throw new Error(errorMessage)
    }

    genericLogger.info(`updateEndpointToSpIdMap Success. Size: ${mapLength}`)
    this.printMapping('vickyy done')
  }
}

module.exports = new CNodeToSpIdMapManager()
