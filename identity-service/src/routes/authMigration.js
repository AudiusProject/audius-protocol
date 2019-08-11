const { handleResponse, successResponse, errorResponseBadRequest } = require('../apiHelpers')
const models = require('../models')

module.exports = function (app) {
  app.get('/auth_migration', handleResponse(async (req, res, next) => {
    let handle = req.query.handle

    if (!handle) {
      return errorResponseBadRequest('Please provide handle')
    }

    let handleObj = await models.AuthMigration.findOne({ where: { handle: handle } })

    if (handleObj) {
      return successResponse(handleObj)
    } else return errorResponseBadRequest('Could not find handle')
  }))

  // Temp route just to migrate users from pbkdf2 to scrypt
  app.post('/auth_migration', handleResponse(async (req, res, next) => {
    // find if there's an old auth record
    // if no old auth record, error
    // has to pass in both the old iv, cipherText and lookupKey and the new values
    // in tx block, delete old, insert new
    // add to authMigrations table

    let { oldValues, newValues, handle } = req.body

    if (!handle) return errorResponseBadRequest('Please pass in a handle')

    if (!newValues || !newValues.iv || !newValues.cipherText || !newValues.lookupKey) {
      return errorResponseBadRequest('Missing an auth property in newValues. Must contain, iv, cipherText, lookupKey')
    }

    let oldAuthRecord = await models.Authentication.findOne({
      where: { lookupKey: oldValues.lookupKey }
    })

    if (!oldAuthRecord) {
      return errorResponseBadRequest('Could not find existing Authentication record')
    }

    let t = await models.sequelize.transaction()
    await models.Authentication.create({ iv: newValues.iv,
      cipherText: newValues.cipherText,
      lookupKey: newValues.lookupKey },
    { transaction: t })
    await oldAuthRecord.destroy({ transaction: t })
    await models.AuthMigration.create({ handle: handle }, { transaction: t })
    await t.commit()

    return successResponse()
  }))
}
