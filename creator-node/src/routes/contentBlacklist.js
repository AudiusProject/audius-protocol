const { handleResponse, successResponse, errorResponse } = require('../apiHelpers')
const BlacklistManager = require('../blacklistManager')

const models = require('../models')

module.exports = function (app) {
  /**
   * Retrieves all blacklisted tracksIds and userIds
  */
  app.get('/blacklist', handleResponse(async (req, res) => {
    const trackIdObjsBlacklist = await models.ContentBlacklist.findAll({
      attributes: ['id'],
      where: {
        type: 'TRACK'
      },
      raw: true
    })

    const userIdObjsBlacklist = await models.ContentBlacklist.findAll({
      attributes: ['id'],
      where: {
        type: 'USER'
      },
      raw: true
    })

    const trackIdsBlacklist = trackIdObjsBlacklist.map(entry => entry.id)
    const userIdsBlacklist = userIdObjsBlacklist.map(entry => entry.id)

    // let trackBlockchainIds = []
    // if (userIdsBlacklist.length > 0) {
    //   trackBlockchainIds = (await models.sequelize.query(
    //     'select "blockchainId" from "Tracks" where "cnodeUserUUID" in (' +
    //         'select "cnodeUserUUID" from "AudiusUsers" where "blockchainId" in (:userBlacklist)' +
    //       ');'
    //     , { replacements: { userIdsBlacklist } }
    //   ))[0]
    // }

    return successResponse({ blacklistedIds: { trackIds: trackIdsBlacklist, userIds: userIdsBlacklist } })
  }))

  /**
   * 1. Verifies that request is from authenticated user
   * 2. If so, add a track or user id to ContentBlacklist
   * 3. If so, also add associated segments to redis
   */
  app.post('/blacklist/add', handleResponse(async (req, res) => {
    const { id, type } = req.query

    // Add entry to ContentBlacklist table
    let resp
    try {
      resp = await models.ContentBlacklist.create({ id, type })
      req.logger.info(`Added entry with type (${type}) and id (${id}) to the ContentBlacklist table!`)
    } catch (e) {
      if (!e.message.includes('Validation error')) {
        return errorResponse(500, `Error with adding entry with type (${type}) and id (${id}): ${e}`)
      }
      req.logger.info(`Entry with type (${type}) and id (${id}) already exists!`)
    }

    // Add to redis blacklist via BlacklistManager
    if (resp) {
      switch (resp.type) {
        case 'USER': {
          BlacklistManager.add([], [id])
          break
        }

        case 'TRACK': {
          BlacklistManager.add([id])
          break
        }
      }
    }

    return successResponse({ type, id })
  }))

  /**
   * 1. Verifies that request is from authenticated user
   * 2. If so, remove a track or user id in ContentBlacklist and redis
   * 3. If so, also remove associated segments from redis
   */
  app.post('/blacklist/delete', handleResponse(async (req, res) => {
    const { id, type } = req.query

    let resp
    try {
      resp = await models.ContentBlacklist.destroy({
        where: {
          id,
          type
        }
      })
      req.logger.info(`Removed entry with type (${type}) and id (${id}) to the ContentBlacklist table!`)
    } catch (e) {
      return errorResponse(500, `Error with removing entry with type (${type}) and id (${id}): ${e}`)
    }

    console.log('HELLO WHAT IS THE RESP HEREEERERE')
    console.log(resp)

    return successResponse({ type, id })
  }))
}
