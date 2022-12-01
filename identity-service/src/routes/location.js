const axios = require('axios')
const { errorResponseBadRequest, handleResponse } = require('../apiHelpers')
const config = require('../config')

// TODO: remove this
const IP_API_KEY = config.get('ipApiKey')

module.exports = function (app) {
  app.get(
    '/location',
    handleResponse(async (req) => {
      const { ip } = req.query
      if (!ip) {
        return errorResponseBadRequest("Didn't include IP address")
      }
      const url = `https://ipapi.co/${ip}/json/`
      const res = await axios({
        method: 'get',
        url,
        params: {
          key: IP_API_KEY
        }
      })

      return res.data
    })
  )
}
