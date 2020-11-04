const BlacklistManager = require('../../blacklistManager')

const getAllContentBlacklist = async () => {
  // todo: fetch the cids too
  const { trackIdsToBlacklist, userIdsToBlacklist } = await BlacklistManager.getTrackAndUserIdsToBlacklist()
  return { trackIds: trackIdsToBlacklist, userIds: userIdsToBlacklist }
}

const addIdsToContentBlacklist = async ({ type, ids }) => {
  const resp = await BlacklistManager.addIdsToDb({ ids, type })

  switch (type) {
    case 'USER': {
      await BlacklistManager.fetchCIDsAndAddToRedis([], ids)
      break
    }
    case 'TRACK': {
      await BlacklistManager.fetchCIDsAndAddToRedis(ids)
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
        await BlacklistManager.fetchCIDsAndRemoveFromRedis([], ids)
        break
      }
      case 'TRACK': {
        await BlacklistManager.fetchCIDsAndRemoveFromRedis(ids)
        break
      }
    }
  }

  return resp
}

const addCIDsToContentBlacklist = async ({ cids }) => {
  const resp = await BlacklistManager.addCIDsToDb(cids)

  if (resp) {
    await BlacklistManager.fetchCIDsAndAddToRedis([], [], cids)
  }

  return resp
}

const removeCIDsFromContentBlacklist = async ({ cids }) => {
  const resp = await BlacklistManager.removeCIDsFromDb(cids)

  if (resp) {
    await BlacklistManager.fetchCIDsAndRemoveFromRedis([], [], cids)
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
