const { handleResponse, successResponse } = require('../apiHelpers')
const { dump } = require('../utils/heapdump')

module.exports = function (app) {
  app.get('/heapdump', handleResponse(async (req, res) => {
    const file = dump()
    return successResponse({ file })
  }))
}
