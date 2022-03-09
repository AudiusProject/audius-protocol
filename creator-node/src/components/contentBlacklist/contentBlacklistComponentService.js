const BlacklistManager = require('../../blacklistManager')
const models = require('../../models')

const types = models.ContentBlacklist.Types

const getAllContentBlacklist = async ({
  getUserIds,
  getTrackIds,
  getSegments
}) => {
  const blacklistedContent = {}
  if (getUserIds) {
    blacklistedContent.userIds = await BlacklistManager.getAllUserIds()
    blacklistedContent.numberOfUserIds = blacklistedContent.userIds.length
  }

  if (getTrackIds) {
    blacklistedContent.trackIds = await BlacklistManager.getAllTrackIds()
    blacklistedContent.numberOfTrackIds = blacklistedContent.trackIds.length
  }

  if (getSegments) {
    // Segments stored in the ContentBlacklist may not be associated with a track
    const segmentsFromCBL = await models.ContentBlacklist.findAll({
      attributes: ['value'],
      where: {
        type: types.cid
      },
      raw: true
    })
    const individuallyBlacklistedSegments = segmentsFromCBL.map(
      (entry) => entry.value
    )
    const allSegments = await BlacklistManager.getAllCIDs()
    blacklistedContent.individualSegments = individuallyBlacklistedSegments
    blacklistedContent.numberOfSegments = allSegments.length
    blacklistedContent.allSegments = allSegments
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
