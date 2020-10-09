const BlacklistManager = require('../../blacklistManager')

const getAllContentBlacklist = async () => {
  const { trackIdsToBlacklist, userIdsToBlacklist } = await BlacklistManager.getTrackAndUserIdsToBlacklist()
  return { trackIds: trackIdsToBlacklist, userIds: userIdsToBlacklist }
}

const addToContentBlacklist = async ({ type, id }) => {
  // add to ContentBlacklist
  const resp = await BlacklistManager.addToDb({ id, type })

  // add to redis
  switch (resp.type) {
    case 'USER': {
      await BlacklistManager.add([], [resp.id])
      break
    }
    case 'TRACK': {
      await BlacklistManager.add([resp.id])
      break
    }
  }

  return resp
}

const removeFromContentBlacklist = async ({ type, id }) => {
  // remove from ContentBlacklist
  const resp = await BlacklistManager.removeFromDb({ id, type })

  if (resp) {
    // remove from redis
    switch (resp.type) {
      case 'USER': {
        await BlacklistManager.remove([], [resp.id])
        break
      }
      case 'TRACK': {
        await BlacklistManager.remove([resp.id])
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
