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

const createDigest = async (data) => {
  const hasher = crypto.createHash('sha256')
  const result = hasher.update(data, 'utf-8').digest('base64')
  return `SHA-256=${result}`
}

const doesSignatureMatch = (authorizationHeader, signature) => {
  const apiKey = config.get('cognitoAPIKey')
  const expectedHeader = `Signature keyId="${apiKey}",algorithm="hmac-sha256",headers="(request-target) date digest",signature="${signature}"`
  return expectedHeader === authorizationHeader
}
/**
 * Gets headers required for authorizing a request to the Cognito API
 * @param {{method: string, path: string, body: string}} requestParams the HTTP method, URL path (including query string) and request body to send to Cognito
 * @returns {{Date: string, Digest: string, Authorization: string}} the headers authorizing a Cognito API request
 */
const createCognitoHeaders = async ({path, method, body}) => {
  const apiKey = config.get('cognitoAPIKey')
  const httpDate = new Date().toUTCString()
  const requestTarget = `${method.toLowerCase()} ${path}`
  const digest = await createDigest(body)

  const signingString = [
    `(request-target): ${requestTarget}`,
    `date: ${httpDate}`,
    `digest: ${digest}`
  ].join('\n')
  const signature = sign(signingString)
  return {
    Date: httpDate,
    Digest: digest,
    Authorization: `Signature keyId="${apiKey}",algorithm="hmac-sha256",headers="(request-target) date digest",signature="${signature}"`,
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
    'Cognito-Version': '2020-08-14'
  }
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
  isWebhookValid,
  createCognitoHeaders
}
