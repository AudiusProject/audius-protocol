const ServiceCommands = require('@audius/service-commands')
const {
    addAndUpgradeUsers,
    getRandomTrackMetadata,
    getRandomTrackFilePath,
    waitForIndexing,
    genRandomString
  } = require('../helpers.js')

let walletIndexToUserIdMap
const snapbackSMParallelSyncTest = async ({
    numUsers,
    executeAll,
    executeOne,
    numCreatorNodes
  }) => {
    // Initialize users
    if (!walletIndexToUserIdMap) {
        walletIndexToUserIdMap = await addAndUpgradeUsers(
          numUsers,
          numCreatorNodes,
          executeAll,
          executeOne
        )
    }
  }

  module.exports = {
      snapbackSMParallelSyncTest
  }