const models = require('../models')
const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const axios = require('axios')
const { getRateLimiter } = require('../reqLimiter')

const vectorClockRateLimiter = getRateLimiter({
  prefix: 'syncRateLimiter:',
  max: 20,
  expiry: 60
})

module.exports = function (app) {
  app.post('/vector_clock_backfill/:wallet', vectorClockRateLimiter, handleResponse(async (req, res, next) => {
    const walletPublicKey = req.params.wallet
    const { primary, secondaries } = req.body
    let clock = 0

    const transaction = await models.sequelize.transaction()
    try {
      // Fetch cnodeUser for each walletPublicKey.
      // lock the CNodeUser table so no other tx can write to it while this is in progress
      const cnodeUser = await models.CNodeUser.findOne({
        where: {
          walletPublicKey: walletPublicKey
        },
        transaction,
        lock: transaction.LOCK.UPDATE // this makes the query SELECT ... FOR UPDATE
      })

      // early exit if cnodeUser not found on primary
      if (!cnodeUser) {
        await transaction.commit()
        return successResponse({ status: 'No cnodeUser record found on the primary' })
      }

      // clock values have been added for CNodeUser, check if they're consistent across all nodes before returning success
      if (cnodeUser.clock && cnodeUser.clock > 0) {
        await transaction.commit()
        // first try/catch is to make sure if the secondaries are not synced. if not, we try to sync
        try {
          await _checkSecondaryClockValues(secondaries, walletPublicKey, cnodeUser.clock)
        } catch (e) {
          await _triggerSecondarySyncs(req, primary, secondaries, walletPublicKey)
        }

        // if we kick off a sync and it still not fixed, return with error
        try {
          await _checkSecondaryClockValues(secondaries, walletPublicKey, cnodeUser.clock)
        } catch (e) {
          return errorResponseServerError(e)
        }
        return successResponse({ status: 'Already ran successfully!' })
      }

      // Fetch all data for cnodeUserUUIDs: audiusUsers, tracks, files.
      let [audiusUsers, tracks, files] = await Promise.all([
        models.AudiusUser.findAll({ where: { cnodeUserUUID: cnodeUser.cnodeUserUUID }, transaction, raw: true }),
        models.Track.findAll({ where: { cnodeUserUUID: cnodeUser.cnodeUserUUID }, transaction, raw: true }),
        models.File.findAll({ where: { cnodeUserUUID: cnodeUser.cnodeUserUUID }, transaction, raw: true })
      ])

      audiusUsers.forEach(record => {
        record.type = 'AudiusUser'
      })

      tracks.forEach(record => {
        record.type = 'Track'
      })
      // if it doesn't have a type it's a file

      let allRecords = audiusUsers.concat(tracks, files)
      // sort in chronological order, oldest first
      allRecords.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

      // reset these values
      audiusUsers = []
      tracks = []
      files = []
      let clockRecords = []

      allRecords.map(record => {
        clock += 1
        let clockRecord = { cnodeUserUUID: cnodeUser.cnodeUserUUID, clock, createdAt: record.createdAt }
        if (record.type === 'AudiusUser') {
          audiusUsers.push({ ...record, clock })
          clockRecord.sourceTable = 'AudiusUser'
        } else if (record.type === 'Track') {
          tracks.push({ ...record, clock })
          clockRecord.sourceTable = 'Track'
        } else {
          files.push({ ...record, clock })
          clockRecord.sourceTable = 'File'
        }
        clockRecords.push(clockRecord)
      })
      req.logger.info('final clock value', clock)

      // delete the existing records
      await models.AudiusUser.destroy({
        where: { cnodeUserUUID: cnodeUser.cnodeUserUUID },
        transaction
      })

      await models.Track.destroy({
        where: { cnodeUserUUID: cnodeUser.cnodeUserUUID },
        transaction
      })

      await models.File.destroy({
        where: { cnodeUserUUID: cnodeUser.cnodeUserUUID },
        transaction
      })

      // insert the new records
      // chunk files by 10000 records to insert if > 10000
      if (files.length > 10000) {
        for (let i = 0; i <= files.length; i += 10000) {
          req.logger.info('writing files from idx', i, i + 10000)
          await models.File.bulkCreate(files.slice(i, i + 10000), { transaction })
        }
      } else {
        await models.File.bulkCreate(files, { transaction })
      }

      await models.Track.bulkCreate(tracks, { transaction })

      await models.AudiusUser.bulkCreate(audiusUsers, { transaction })

      if (clockRecords.length > 10000) {
        for (let i = 0; i <= clockRecords.length; i += 10000) {
          req.logger.info('writing clockrecords from idx', i, i + 10000)
          await models.ClockRecord.bulkCreate(clockRecords.slice(i, i + 10000), { transaction })
        }
      } else {
        await models.ClockRecord.bulkCreate(clockRecords, { transaction })
      }

      await cnodeUser.update({ clock }, { transaction })

      await transaction.commit()
    } catch (e) {
      console.error(e)
      await transaction.rollback()
      return errorResponseServerError(e.message)
    }

    try {
      // trigger secondary syncs here
      await _triggerSecondarySyncs(req, primary, secondaries, walletPublicKey)
      await _checkSecondaryClockValues(secondaries, walletPublicKey, clock)
    } catch (e) {
      return errorResponseServerError(e)
    }
    return successResponse()
  }))
}

async function _checkSecondaryClockValues (secondaries, walletPublicKey, clock) {
  if (clock > 25000) clock = 25000

  const resp = (await Promise.all(secondaries.map(secondary => {
    const axiosReq = {
      baseURL: secondary,
      url: `/sync_status/${walletPublicKey}`,
      method: 'get'
    }
    return axios(axiosReq)
  }))).map(r => r.data.data.clockValue)

  resp.map(r => {
    if (r !== clock) throw new Error(`Secondaries not in sync with primary [${resp}]`)
  })
}

async function _triggerSecondarySyncs (req, primary, secondaries, walletPublicKey) {
  if (secondaries && secondaries.length > 0) {
    await Promise.all(secondaries.map(secondary => {
      req.logger.info(`calling sync to secondary for ${secondary} - ${walletPublicKey}`)
      const axiosReq = {
        baseURL: secondary,
        url: '/vector_clock_sync',
        method: 'post',
        data: {
          wallet: [walletPublicKey],
          creator_node_endpoint: primary,
          immediate: true,
          db_only_sync: true
        }
      }
      return axios(axiosReq)
    }))
  }
}
