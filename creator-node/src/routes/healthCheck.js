const { handleResponse, successResponse } = require('../apiHelpers')
const { sequelize } = require('../models')
const config = require('../config.js')
const versionInfo = require('../../.version.json')

module.exports = function (app) {
  app.get('/health_check', handleResponse(async (req, res) => {
    // for now we just check db connectivity. In future, this could / should check other
    // things (ex. IPFS)

    // log out PG stats
    const pgStatDatabase = (await sequelize.query('SELECT "datname", "numbackends" from "pg_stat_database"'))[0]
    const pgStatActivity = (await sequelize.query('select "datname", "usename", "application_name", "client_addr", "wait_event_type", "wait_event", "state", "query", "backend_type" from "pg_stat_activity"'))[0]

    return successResponse({
      'healthy': true,
      'GIT_SHA': process.env.GIT_SHA,
      'pg_stat_database': pgStatDatabase,
      'pg_stat_activity': pgStatActivity
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
