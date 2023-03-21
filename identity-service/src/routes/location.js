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

const IP_API_KEY = config.get('ipdataAPIKey')

module.exports = function (app) {
  app.get(
    '/location',
    handleResponse(async (req) => {
      let ip = getIP(req)
      if (!ip) {
        return errorResponseBadRequest('Unexpectedly no IP')
      }
      if (ip.startsWith('::ffff:')) {
        ip = ip.slice(7)
      }
      const url = `https://api.ipdata.co/${ip}`
      try {
        const res = await axios({
          method: 'get',
          url,
          params: {
            'api-key': IP_API_KEY
          }
        })
        return successResponse({ ...res.data, in_eu: res.data.is_eu })
      } catch (e) {
        logger.error(`Got error in location: ${e.response?.data}`)
        return errorResponse(e.response?.status, e.response?.data)
      }
    })
  )
}
