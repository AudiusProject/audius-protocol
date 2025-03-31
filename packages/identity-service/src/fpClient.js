const {
  FingerprintJsServerApiClient,
  Region
} = require('@fingerprintjs/fingerprintjs-pro-server-api')

const { logger } = require('./logging')

const createFpClient = (apiKey) => {
  if (!apiKey) {
    logger.warn('API Key not set for fpClient')
    return null
  } else {
    return new FingerprintJsServerApiClient({
      apiKey,
      region: Region.Global
    })
  }
}

module.exports = {
  createFpClient
}
