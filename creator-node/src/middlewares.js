const axios = require('axios')

const { sendResponse, errorResponseUnauthorized, errorResponseServerError } = require('./apiHelpers')
const config = require('./config')

/** Only allow writes if node is primary for wallet */
async function preMiddleware (req, res, next) {
  if (!req.session || !req.session.wallet) {
    return sendResponse(req, res, errorResponseUnauthorized('User must be logged in'))
  }

  let serviceEndpoint
  try {
    serviceEndpoint = await _getOwnEndpoint(req)
  } catch (e) {
    return sendResponse(req, res, errorResponseServerError(e))
  }

  let creatorNodeEndpoints
  try {
    creatorNodeEndpoints = await _getCreatorNodeEndpoints(req, req.session.wallet)
  } catch (e) {
    return sendResponse(req, res, errorResponseServerError(e))
  }
  const primaryEndpoint = creatorNodeEndpoints[0]

  // error if self is not primary
  if (primaryEndpoint && serviceEndpoint !== primaryEndpoint) {
    return sendResponse(req, res, errorResponseUnauthorized('this node is not primary for user'))
  }

  next()
}

/** Tell all secondaries to sync against self */
async function postMiddleware (req, res) {
  if (!req.session || !req.session.wallet) {
    return sendResponse(req, res, errorResponseUnauthorized('User must be logged in'))
  }

  let serviceEndpoint
  try {
    serviceEndpoint = await _getOwnEndpoint(req)
  } catch (e) {
    return sendResponse(req, res, errorResponseServerError(e))
  }

  // get all secondaries from discprov
  let creatorNodeEndpoints
  try {
    creatorNodeEndpoints = await _getCreatorNodeEndpoints(req, req.session.wallet)
  } catch (e) {
    return sendResponse(req, res, errorResponseServerError(e))
  }
  const [primary, ...secondaries] = creatorNodeEndpoints
  if (!primary) return

  // error if self is not primary
  if (serviceEndpoint !== primary) {
    return sendResponse(req, res, errorResponseUnauthorized('this node is not primary for user'))
  }

  // send sync req to all secondaries
  await Promise.all(secondaries.map(secondary => {
    if (!secondary || !_isFQDN(secondary)) return
    const axiosReq = {
      baseURL: secondary,
      url: '/sync',
      method: 'post',
      data: {
        wallet: [req.session.wallet],
        creator_node_endpoint: primary,
        immediate: false
      }
    }
    return axios(axiosReq)
  }))
}

/** Retrieves current FQDN registered on-chain with node's owner wallet. */
async function _getOwnEndpoint (req) {
  const libs = req.app.get('audiusLibs')

  if (!config.get('ethWallets') || !config.get('spOwnerWalletIndex') || !config.get('ethWallets').isArray() || config.get('ethWallets').length <= config.get('spOwnerWalletIndex')) {
    throw new Error('bad')
  }

  // const ethWallets = config.get('ethWallets')
  // const spOwnerWalletIndex = config.get('spOwnerWalletIndex')

  const spInfo = await libs.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfoFromAddress(
    config.get('ethWallets')[config.get('spOwnerWalletIndex')],
    'creator-node'
  )

  // confirm on-chain endpoint exists and is valid FQDN
  if (!spInfo ||
      spInfo.length === 0 ||
      !spInfo[0].hasOwnProperty('endpoint') ||
      (spInfo[0]['endpoint'] && !_isFQDN(spInfo[0]['endpoint']))) {
    throw new Error('fail')
  }
  return spInfo[0]['endpoint']
}

/** Get all creator node endpoints for user by wallet from discprov */
async function _getCreatorNodeEndpoints (req, wallet) {
  const libs = req.app.get('audiusLibs')
  const user = await libs.User.getUsers(1, 0, null, wallet)
  if (!user || user.length === 0 || !user[0].hasOwnProperty('creator_node_endpoint')) {
    throw new Error('Bad return data')
  }
  const endpoint = user[0]['creator_node_endpoint']
  return endpoint ? endpoint.split(',') : []
}

// Regular expression to check if endpoint is a FQDN. https://regex101.com/r/kIowvx/2
function _isFQDN (url) {
  let FQDN = new RegExp(/(?:^|[ \t])((https?:\/\/)?(?:localhost|[\w-]+(?:\.[\w-]+)+)(:\d+)?(\/\S*)?)/gm)
  return FQDN.test(url)
}

module.exports.preMiddleware = preMiddleware
module.exports.postMiddleware = postMiddleware
