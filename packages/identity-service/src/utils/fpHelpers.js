const { QueryTypes } = require('sequelize')
const models = require('../models')
const FP_REDIS_PREFIX = 'fp'
const FP_CONFIDENCE_THRESHOLD = 0.7
const TEN_MINUTES_IN_MS = 10 * 60 * 1000

const getDeviceIDCountForUserId = async (userId) => {
  // Get the # of users sharing any visitorID
  // associated with `userId` on any platform
  const res = await models.sequelize.query(
    `select "Fingerprints"."userId"
     from "Fingerprints"
     where "visitorId" in (
      select distinct "visitorId"
      from "Fingerprints"
      where "userId" = :userId
    ) group by "Fingerprints"."userId"`,
    {
      replacements: {
        userId
      },
      type: QueryTypes.SELECT
    }
  )
  return res.length
}

const validateFingerprint = async ({ req, email, visitorId }) => {
  if (!visitorId) {
    req.logger.info(
      `Fingerprint not validated for ${email}: no visitorId provided`
    )
    return
  }

  const { blockchainUserId: userId } = await models.User.findOne({
    where: { email }
  })
  if (!userId) {
    req.logger.info(
      `Fingerprint not validated for ${email}: no matching userId found`
    )
    return
  }

  let latestVisit
  try {
    const fpResponse = await req.app
      .get('fpClient')
      .getVisitorHistory(visitorId)
    latestVisit = fpResponse.visits && fpResponse.visits[0]
  } catch (e) {
    req.logger.error(`Could not validate fingerprint for ${email}`, e)
    return
  }

  const now = Date.now()
  if (
    !latestVisit ||
    now - new Date(latestVisit.timestamp) > TEN_MINUTES_IN_MS
  ) {
    req.logger.info(
      `Fingerprint not validated for ${email}: no recent visit for id ${visitorId}`
    )
    return
  }

  // don't validate fingerprints that don't provide enough identifying signals
  if (
    latestVisit.confidence &&
    latestVisit.confidence.score < FP_CONFIDENCE_THRESHOLD
  ) {
    req.logger.info(
      `Fingerprint not validated for ${email}: confidence score ${latestVisit.confidence.score} below threshold`
    )
    return
  }

  const origin = latestVisit.tag?.origin
  if (!origin) {
    req.logger.info(
      `Fingerprint not validated for ${email}: no origin tag found`
    )
    return
  }

  const [fp, created] = await models.Fingerprints.findOrCreate({
    where: {
      userId,
      visitorId,
      origin
    },
    defaults: {
      createdAt: now,
      updatedAt: now
    }
  })
  if (!created) {
    fp.updatedAt = now
    await fp.save()
  }
}

module.exports = {
  getDeviceIDCountForUserId,
  validateFingerprint
}
