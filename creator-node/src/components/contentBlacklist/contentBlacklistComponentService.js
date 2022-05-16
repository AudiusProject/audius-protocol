const BlacklistManager = require('../../blacklistManager')
const models = require('../../models')

const types = models.ContentBlacklist.Types

const getAllContentBlacklist = async ({ type, limit, offset }) => {
  let values
  switch (type) {
    case types.user: {
      values = await BlacklistManager.getAllUserIds()
      break
    }
    case types.track: {
      values = await BlacklistManager.getAllTrackIds({ offset, limit })
      break
    }
    case types.cid: {
      values = await BlacklistManager.getAllCIDs()
      break
    }
  }

  return { count: values.length, values }
}

const addToContentBlacklist = async ({ type, values }) => {
  await BlacklistManager.add({ type, values })
}

const removeFromContentBlacklist = async ({ type, values }) => {
  await BlacklistManager.remove({ type, values })
}

module.exports = {
  getAllContentBlacklist,
  addToContentBlacklist,
  removeFromContentBlacklist
}
