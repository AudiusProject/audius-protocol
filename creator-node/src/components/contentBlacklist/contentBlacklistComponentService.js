const BlacklistManager = require('../../blacklistManager')

const getAllContentBlacklist = async () => {
  const { trackIdsToBlacklist, userIdsToBlacklist } = await BlacklistManager.getTrackAndUserIdsToBlacklist()
  return { trackIds: trackIdsToBlacklist, userIds: userIdsToBlacklist }
}

const addToContentBlacklist = async ({ type, ids }) => {
  const resp = await BlacklistManager.addToDb({ ids, type })

  // add to redis
  switch (type) {
    case 'USER': {
      await BlacklistManager.add([], ids)
      break
    }
    case 'TRACK': {
      await BlacklistManager.add(ids)
      break
    }
  }

  return resp
}

const removeFromContentBlacklist = async ({ type, ids }) => {
  const resp = await BlacklistManager.removeFromDb({ ids, type })

  if (resp) {
    // remove from redis
    switch (type) {
      case 'USER': {
        await BlacklistManager.remove([], ids)
        break
      }
      case 'TRACK': {
        await BlacklistManager.remove(ids)
        break
      }
    }
  }

  return resp
}

module.exports = {
  getAllContentBlacklist,
  addToContentBlacklist,
  removeFromContentBlacklist
}
