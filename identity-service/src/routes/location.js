const axios = require('axios')
const { getIP } = require('../utils/antiAbuse')
const {
  errorResponseBadRequest,
  handleResponse,
  successResponse,
  errorResponse
} = require('../apiHelpers')
const config = require('../config')
const { logger } = require('../logging')

const IP_API_KEY = config.get('ipApiKey')

module.exports = function (app) {
  app.get(
    '/location',
    handleResponse(async (req) => {
      const ip = getIP(req)
      if (!ip) {
        return errorResponseBadRequest('Unexpectedly no IP')
      }
      const url = `https://ipapi.co/${ip}/json/`
      try {
        const res = await axios({
          method: 'get',
          url,
          params: {
            key: IP_API_KEY
          }
        })
        return successResponse(res.data)
      } catch (e) {
        logger.error(`Got error in location: ${e.response?.data}`)
        return errorResponse(e.response?.status, e.response?.data)
      }
    })
  )
}
