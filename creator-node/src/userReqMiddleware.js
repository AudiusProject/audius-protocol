const { userReqLimiter } = require('./reqLimiter')
const {
  getSPInfo,
  verifyRequesterIsValidSP,
  validateSPId
} = require('./components/replicaSet/URSMRegistrationComponentService')

/*
if ((route == 'batch_clock' or route == 'individual clock')) {
  try {
    isValidSP()
    next()
  } catch (E) {
    // probably not a valid SP. this is ok
  }
}
rateLimit()
*/

// For the clock fetching routes, if the requester if from a valid SP, do not enforce
// a rate limit as we do not want to rate limit SPs checking other SPs for clock values.
// The clock fetching routes are used in issuing potential reconfig ops.
async function ensureValidSPRequesterMiddleware (req, res, next) {
  const { libs } = req.app.get('serviceRegistry')
  let { timestamp, signature } = req.query
  const path = req.originalUrl

  if (path.includes('/users/clock_status') || path.includes('/users/batch_clock_status')) {
    try {
      // Get valid SP info using libs
      const {
        ownerWalletFromSPFactory,
        delegateOwnerWalletFromSPFactory,
        nodeEndpointFromSPFactory
      } = await getSPInfo(libs, req.query.spID)

      // Verify SP request is valid
      await verifyRequesterIsValidSP({
        audiusLibs: libs,
        spID: req.query.spID,
        reqTimestamp: timestamp,
        reqSignature: signature,
        ownerWalletFromSPFactory,
        delegateOwnerWalletFromSPFactory,
        nodeEndpointFromSPFactory
      })

      return next()
    } catch (e) {
      // A non-SP requester query will hit this catch block. This is okay; just continue
      // with the rate limit and other middlewares as expected.
      req.logger.debug(`Requester is not a valid SP. Continuing with rate limit: ${e.toString()}`)
    }
  }

  // Continue with rate limit and other middlewares
  await userReqLimiter(req, res, next)
}

module.exports = { ensureValidSPRequesterMiddleware }
