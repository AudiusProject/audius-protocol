const _ = require('lodash')

const MadDog = require('../../madDog.js')

/**
 * Stops a random creator node with maddog
 * @param {Object} creatorNodeIDToInfoMapping Mapping of creator ndoe ids to info
 * @returns 
 */
const stopRandomCreatorNode = async (creatorNodeIDToInfoMapping) => {
  const cnIds = Object.keys(creatorNodeIDToInfoMapping).map(id => parseInt(id))
  const maxId = Math.max(cnIds)
  const  madDog = new MadDog({ 
    numCreatorNodes: maxId - 1,
    downProbability: 0,
    downDurationSec: 90,
    packetLossPercent: 100
  })
  const removedCreatorNodeId = _.sample(cnIds)
  const removeCNName = MadDog.makeCreatorNodeName(removedCreatorNodeId)
  madDog.start(removeCNName)
  return { madDog, removedCreatorNodeId }
}

module.exports = stopRandomCreatorNode