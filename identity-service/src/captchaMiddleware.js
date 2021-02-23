const models = require('./models')

async function captchaMiddleware (req, res, next) {
  const libs = req.app.get('audiusLibs')

  let score, ok, hostname
  if (req.body.token) {
    ({ score, ok, hostname } = await libs.captcha.verify(req.body.token))

    try {
      models.BotScores.create({
        walletAddress: req.body.walletAddress,
        recaptchaScore: score,
        recaptchaContext: req.url,
        recaptchaHostname: hostname
      })
    } catch (e) {
      req.logger.error('CAPTCHA - Error with adding recaptcha score', e)
    }

    // TODO: Make middleware return errorResponse later
    if (!ok) req.logger.warn('CAPTCHA - Failed captcha')
  } else {
    req.logger.warn('CAPTCHA - No captcha found on request')
  }

  next()
}

module.exports = captchaMiddleware
