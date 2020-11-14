const axios = require('axios')
const { nanoid } = require('nanoid')

/**
 * Class used to create and standardize axios requests with appropriate requestIDs in the headers
 */

class RequestManager {
  static makeAxiosRequest (requestParams, requestID = null) {
    if (!requestParams.headers) {
      requestParams.headers = {}
    }

    if (!requestID) requestID = nanoid() + '_creator_requestManager_banana'
    if (!requestParams.headers['request-ID']) {
      requestParams.headers['request-ID'] = requestID
    }

    return axios(requestParams)
  }
}

module.exports = RequestManager
