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
   * Intended to be called by clients. Will generate a token used to calculate recaptcha score.
   * @param {string} action name for this "action" for grouping
   */
  async generate (action) {
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
   * Intended to be called by services. According to recaptcha v3 docs:
   * A score of 1.0 is very likely a good interaction, 0.0 is very likely a bot
   * @param {string} token
   * @param {number} minScore score must be >= minScore to be ok
   * @returns {Object}
   *    {boolean | null} ok - whether score > minScore (false if something went wrong)
   *    {number | null} score - the raw score [0, 1] (or null if a score was not computed)
   */
  async verify (token, minScore = 0.5) {
    if (!this.serviceKey) {
      throw new Error('No serviceKey provided')
    }

    let score, ok, hostname

    const formData = new FormData()
    formData.append('response', token)
    formData.append('secret', this.serviceKey)

    try {
      const resp = await axios.post(
        VERIFY_ENDPOINT,
        formData,
        {
          headers: formData.getHeaders(),
          adapter: IS_BROWSER ? require('axios/lib/adapters/xhr') : require('axios/lib/adapters/http')
        }
      )

      score = resp.data.score
      ok = score >= minScore
      hostname = resp.data.hostname
    } catch (e) {
      console.error('Error with verifying captcha request', e)
      score = null
      ok = true
      hostname = null
    }
    return { score, ok, hostname }
  }
}

module.exports = Captcha
