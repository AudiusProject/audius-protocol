const models = require('../models')
const { sequelize } = require('../models')
const { handleResponse, successResponse, errorResponseServerError } = require('../apiHelpers')
const axios = require('axios')

module.exports = function (app) {
  app.post('/vector_clock_backfill/:wallet', handleResponse(async (req, res, next) => {
    const walletPublicKey = req.params.wallet

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
      // early exit if clock values have been added for CNodeUser
      if (cnodeUser.clock && cnodeUser.clock > 0) return successResponse({ status: 'Already ran successfully!' })

      // Fetch all data for cnodeUserUUIDs: audiusUsers, tracks, files.
      let [audiusUsers, tracks, files] = await Promise.all([
        models.AudiusUser.findAll({ where: { cnodeUserUUID: cnodeUser.cnodeUserUUID }, transaction, raw: true }),
        models.Track.findAll({ where: { cnodeUserUUID: cnodeUser.cnodeUserUUID }, transaction, raw: true }),
        models.File.findAll({ where: { cnodeUserUUID: cnodeUser.cnodeUserUUID }, transaction, raw: true })
      ])

      audiusUsers.map(record => record.type = 'AudiusUser')
      tracks.map(record => record.type = 'Track')
      // if it doesn't have a type it's a file

      let allRecords = audiusUsers.concat(tracks, files)
      // sort in chronological order, oldest first
      allRecords.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

      // reset these values
      audiusUsers = []
      tracks = []
      files = []
      let clockRecords = []

      let clock = 0
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
      console.log('final clock value', clock)

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
          console.log('writing files from idx', i, i + 10000)
          await models.File.bulkCreate(files.slice(i, i + 10000), { transaction })
        }
      } else {
        await models.File.bulkCreate(files, { transaction })
      }
      
      await models.Track.bulkCreate(tracks, { transaction })
      
      await models.AudiusUser.bulkCreate(audiusUsers, { transaction })
      
      if (clockRecords.length > 10000) {
        for (let i = 0; i <= clockRecords.length; i += 10000) {
          console.log('writing clockrecords from idx', i, i + 10000)
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

    // trigger secondary syncs here
    const axiosReq = {
      baseURL: 'http://docker.for.mac.localhost:4000',
      url: '/vector_clock_sync',
      method: 'post',
      data: {
        wallet: [walletPublicKey],
        creator_node_endpoint: 'http://docker.for.mac.localhost:4000',
        immediate: true,
        db_only_sync: true
      }
    }
    await axios(axiosReq)

    return successResponse()
    
  }))
}
