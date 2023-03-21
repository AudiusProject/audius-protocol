const _ = require('lodash')

const { deregisterCreatorNode } = require('@audius/service-commands')

/**
 * Deregisters a random creator node and returns the corresponding id
 * modifies the creaorNodeIdToInfoMapping to remove the entry
 * @param {Object} creatorNodeIDToInfoMapping 
 * @returns number The id of the creator node that was deregistered 
 */
const deregsiterRandomCreatorNode = async (creatorNodeIDToInfoMapping) => {
  const removeCNId = _.sample(Object.keys(creatorNodeIDToInfoMapping))
  // Remove content node 1
  await deregisterCreatorNode(removeCNId)
  delete creatorNodeIDToInfoMapping[removeCNId]
  return removeCNId
}

module.exports = deregsiterRandomCreatorNode
