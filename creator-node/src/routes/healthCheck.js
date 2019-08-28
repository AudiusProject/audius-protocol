const { handleResponse, successResponse } = require('../apiHelpers')
const { sequelize } = require('../models')
const config = require('../config.js')
const versionInfo = require('../../.version.json')

module.exports = function (app) {
  app.get('/health_check', handleResponse(async (req, res) => {
    // for now we just check db connectivity. In future, this could / should check other
    // things (ex. IPFS)
    await sequelize.query('SELECT 1', { type: sequelize.QueryTypes.SELECT })

    // log out PG stats
    const pg_stat_database = (await sequelize.query('SELECT "datname", "numbackends" from "pg_stat_database"'))[0]
    const pg_stat_activity = (await sequelize.query('select "datname", "usename", "application_name", "client_addr", "wait_event_type", "wait_event", "state", "query", "backend_type" from "pg_stat_activity"'))[0]

    return successResponse({
      'healthy': true,
      'GIT_SHA': process.env.GIT_SHA,
      'pg_stat_database': pg_stat_database,
      'pg_stat_activity': pg_stat_activity
    })
  }))

  app.get('/version', handleResponse(async (req, res) => {
    const info = {
      ...versionInfo,
      country: config.get('serviceCountry'),
      latitude: config.get('serviceLatitude'),
      longitude: config.get('serviceLongitude')
    }
    return successResponse(info)
  }))
}
