const axios = require('axios')
const { Utils } = require('../..')

class ComStock {
  constructor (comstockEndpoint) {
    this.comstockEndpoint = comstockEndpoint
  }

  async getComStock (obj) {
    const result = await this._makeRequest({
      url: '/comstock',
      method: 'get',
      params: obj
    })
    const index = result.index
    const amount = Utils.toBN(result.amount)
    const merkleProof = result.proof.map(part => Utils.utf8ToHex(part))
    return { index, amount, merkleProof }
  }

  /* ------- INTERNAL FUNCTIONS ------- */

  async _makeRequest (axiosRequestObj) {
    axiosRequestObj.baseURL = this.identityServiceEndpoint

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

module.exports = ComStock
