const FormData = require('form-data')
const axios = require('axios')

const VERIFY_ENDPOINT = 'https://www.google.com/recaptcha/api/siteverify'
const IS_BROWSER = typeof window !== 'undefined' && window !== null

class Captcha {
  /**
   * @param {object} 
   *  { string | undefined } siteKey
   *  { string | undefined } serviceKey
   */
  constructor ({ siteKey, serviceKey }) {
    this.siteKey = siteKey
    this.serviceKey = serviceKey

    this.generate = this.generate.bind(this)
    this.verify = this.verify.bind(this)
  }

  /**
   * Intended to be called by clients
   * @param {string} action name for this "action" for grouping
   */
  async generate (action) {
    console.log(this.siteKey, action)
    if (!this.siteKey) {
      throw new Error('No siteKey provided')
    }

    if (!IS_BROWSER) {
      throw new Error('Expected a browser/client context')
    }

    if (!window.grecaptcha) {
      throw new Error('No captcha found, did you forget to import it?')
    }

    return new Promise(resolve => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(this.siteKey, { action })
          .then((token) => {
            resolve(token)
          })
      })
    })
  }

  /**
   * Intended to be called by services
   * @param {string} token
   * @param {number} minScore score must be >= minScore to be ok
   * @returns {Object}
   *    {boolean | null} ok - whether score > minScore (true if something went wrong)
   *    {number | null} score - the raw score [0, 1] (or null if a score was not computed)
   */
  async verify (token, minScore = 0.5) {
    if (!this.serviceKey) {
      throw new Error('No serviceKey provided')
    }

    let score, ok

    const formData = new FormData()
    formData.append('response', token)
    formData.append('secret', this.serviceKey)

    try {
      const resp = await axios.post(
        VERIFY_ENDPOINT,
        formData,
        {
          headers: formData.getHeaders(),
          adapter: IS_BROWSER ? require('axios/lib/adapters/xhr') : require('axios/lib/adapters/http'),
        }
      )
      score = resp.data.score
      ok = score >= minScore
    } catch (e) {
      console.error(e)
      score = null
      ok = true
    }
    return { score, ok }
  }
}

module.exports = Captcha
