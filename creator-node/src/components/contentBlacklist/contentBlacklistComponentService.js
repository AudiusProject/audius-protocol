const BlacklistManager = require('../../blacklistManager')
const models = require('../../models')

const types = models.ContentBlacklist.Types

const getAllContentBlacklist = async () => {
  // Segments stored in the ContentBlacklist may not be associated with a track
  const segmentsFromCBL = await models.ContentBlacklist.findAll({
    attributes: ['value'],
    where: {
      type: types.cid
    },
    raw: true
  })
  const individuallyBlacklistedSegments = segmentsFromCBL.map(entry => entry.value)

  const blacklistedContent = {
    trackIds: await BlacklistManager.getAllTrackIds(),
    userIds: await BlacklistManager.getAllUserIds(),
    individualSegments: individuallyBlacklistedSegments,
    allSegments: await BlacklistManager.getAllCIDs()
  }

  return blacklistedContent
}

const addIdsToContentBlacklist = async ({ type, ids }) => {
  const resp = await BlacklistManager.addIdsToDb({ ids, type })

  switch (type) {
    case 'USER': {
      await BlacklistManager.fetchCIDsAndAddToRedis({ userIdsToBlacklist: ids })
      break
    }
    case 'TRACK': {
      await BlacklistManager.fetchCIDsAndAddToRedis({ trackIdsToBlacklist: ids })
      break
    }
  }

  return resp
}

const removeIdsFromContentBlacklist = async ({ type, ids }) => {
  const resp = await BlacklistManager.removeIdsFromDb({ ids, type })

  if (resp) {
    switch (type) {
      case 'USER': {
        await BlacklistManager.fetchCIDsAndRemoveFromRedis({ userIdsToBlacklist: ids })
        break
      }
      case 'TRACK': {
        await BlacklistManager.fetchCIDsAndRemoveFromRedis({ trackIdsToBlacklist: ids })
        break
      }
    }
  }

  return resp
}

const addCIDsToContentBlacklist = async ({ cids }) => {
  const resp = await BlacklistManager.addCIDsToDb({ cids, type: types.cid })

  if (resp) {
    await BlacklistManager.fetchCIDsAndAddToRedis({ segmentsToBlacklist: cids })
  }

  return resp
}

const removeCIDsFromContentBlacklist = async ({ cids }) => {
  const resp = await BlacklistManager.removeCIDsFromDb({ cids, type: types.cid })

  if (resp) {
    await BlacklistManager.fetchCIDsAndRemoveFromRedis({ segmentsToBlacklist: cids })
  }

  return resp
}

module.exports = {
  getAllContentBlacklist,
  addIdsToContentBlacklist,
  removeIdsFromContentBlacklist,
  addCIDsToContentBlacklist,
  removeCIDsFromContentBlacklist
}
