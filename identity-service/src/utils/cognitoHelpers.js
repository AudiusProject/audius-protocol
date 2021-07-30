const crypto = require('crypto')
const config = require('../config')

const sign = (reference) => {
  const apiSecret = config.get('cognitoAPISecret')
  if (!apiSecret) throw new Error('Missing API Secret')

  const signer = crypto.createHmac('sha256', apiSecret)
  const result = signer.update(reference).digest()
  const base64 = Buffer.from(result).toString('base64')
  return base64
}

const doesSignatureMatch = (authorizationHeader, signature) => {
  const apiKey = config.get('cognitoAPIKey')
  const expectedHeader = `Signature keyId="${apiKey}",algorithm="hmac-sha256",headers="(request-target) date digest",signature="${signature}"`
  return expectedHeader === authorizationHeader
}

const isWebhookValid = (headers, path) => {
  // construct string that we will be signing
  const lines = []
  lines.push(`(request-target): post ${path}`)
  lines.push(`date: ${headers['date']}`)
  lines.push(`digest: ${headers['digest']}`)
  const toSign = lines.join('\n')

  // sign string and compare with authorization header
  const signature = sign(toSign)
  return doesSignatureMatch(headers['authorization'], signature)
}

module.exports = {
  sign,
  isWebhookValid
}
