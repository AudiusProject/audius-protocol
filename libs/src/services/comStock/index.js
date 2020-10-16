const axios = require('axios')

class Comstock {
  constructor (comstockEndpoint) {
    this.comstockEndpoint = comstockEndpoint
  }

  async getComstock (obj) {
    const result = await this._makeRequest({
      url: '/wallet_lookup',
      method: 'get',
      params: obj
    })
    return result
  }

  /* ------- INTERNAL FUNCTIONS ------- */

  async _makeRequest (axiosRequestObj) {
    axiosRequestObj.baseURL = this.comstockEndpoint
    // Axios throws for non-200 responses
    try {
      const resp = await axios(axiosRequestObj)
      return resp.data
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        throw new Error(`Server returned error: [${e.response.status.toString()}] ${e.response.data.error}`)
      }
      throw e
    }
  }
}

module.exports = Comstock
