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
