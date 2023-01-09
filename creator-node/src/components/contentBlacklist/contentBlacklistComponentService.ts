const BlacklistManager = require('../../blacklistManager')
const models = require('../../models')

const types = models.ContentBlacklist.Types

type BlacklistedContent = {
  trackIds: Promise<string[]>
  userIds: Promise<number[]>
  individualSegments: string[]
  numberOfSegments: number
  allSegments: string[]
}

type Segment = {
  id: number
  type: 'USER' | 'TRACK' | 'CID'
  value: string
  createdAt: Date
  updatedAt: Date
}

const getAllTrackIds = async (): Promise<number[]> => {
  const resp = await BlacklistManager.getAllTrackIds()
  return resp.map((trackId: string) => parseInt(trackId))
}

const getAllContentBlacklist = async (): Promise<BlacklistedContent> => {
  // Segments stored in the ContentBlacklist may not be associated with a track
  const segmentsFromCBL = await models.ContentBlacklist.findAll({
    attributes: ['value'],
    where: {
      type: types.cid
    },
    raw: true
  })
  const individuallyBlacklistedSegments = segmentsFromCBL.map(
    (entry: Segment): string => entry.value
  )
  const allSegments = await BlacklistManager.getAllCIDs()
  const blacklistedContent = {
    trackIds: await BlacklistManager.getAllTrackIds(),
    userIds: await BlacklistManager.getAllUserIds(),
    individualSegments: individuallyBlacklistedSegments,
    numberOfSegments: allSegments.length,
    allSegments
  }

  return blacklistedContent
}

const addToContentBlacklist = async ({
  type,
  values
}: {
  type: Segment['type']
  values: Segment['value']
}): Promise<void> => {
  await BlacklistManager.add({ type, values })
}

const removeFromContentBlacklist = async ({
  type,
  values
}: {
  type: Segment['type']
  values: Segment['value']
}): Promise<void> => {
  await BlacklistManager.remove({ type, values })
}

module.exports = {
  getAllContentBlacklist,
  addToContentBlacklist,
  removeFromContentBlacklist,
  getAllTrackIds
}
