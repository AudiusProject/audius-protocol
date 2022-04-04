const _ = require('lodash')

const ServiceCommands = require('@audius/service-commands')
const { logger } = require('../../logger')
const DEFAULT_INDEX = 1

const {
  distribute,
  creatorNodeUp
} = ServiceCommands

/**
 * Parses a content node endpoint for the ID
 * @param {string} endpoint The url of the content node 
 * @returns number The content node id
 */
const getIDfromEndpoint = (endpoint) => {
  const val = endpoint.match(/http:\/\/cn(\d+)_creator-node_1:\d+$/i)
  return val[1]
}

/**
 * Fetches the content nodes on chain
 * @param {*} executeOne 
 * @returns Promise<Object> contentNodeIDToInfoMapping object w. keys as cn id and value as service info
 */
const getContentNodeMaping = async (executeOne) => {
  let contentNodeIDToInfoMapping = {}
  let contentNodeList = await executeOne(0, async (libsWrapper) => {
    let endpointsList = await libsWrapper.getServices('content-node') 
    return endpointsList
  })

  contentNodeList.forEach((info)=>{
    const cnId = getIDfromEndpoint(info.endpoint)
    // Get the creator node number
    contentNodeIDToInfoMapping[cnId] = info
  })
  return contentNodeIDToInfoMapping
}

/**
 * Fetches the content nodes from chain, spins up requested number of content nodes
 * if less than requested are running
 * @param {number} numCN The number of content nodes to spin up 
 * @param {*} executeOne The wrapper function with libs 
 * @returns Promise<Object> The mapping of content node ID to service info
 */
const setNumCreatorNodes = async (numCN, executeOne) => {
  let contentNodeIDToInfoMapping = await getContentNodeMaping(executeOne)
  if (Object.keys(contentNodeIDToInfoMapping).length < numCN) {
    // Distribute tokens to ensure wallets are able to register a node
    await distribute()
    for (let cnId = 1; cnId < numCN + 1; cnId++) {
      if (!(cnId in contentNodeIDToInfoMapping)) {
        await creatorNodeUp(cnId)
      }
    }

    // Update the mapping again w/ all creator nodes
    contentNodeIDToInfoMapping = await getContentNodeMaping(executeOne)
  }
  return contentNodeIDToInfoMapping
}


module.exports = setNumCreatorNodes
module.exports.getIDfromEndpoint = getIDfromEndpoint
module.exports.getContentNodeMaping = getContentNodeMaping
