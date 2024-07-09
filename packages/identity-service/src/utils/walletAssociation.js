const models = require('../models')

const getWalletAssociatedEmail = async ({ req, authUser }) => {
  if (authUser.walletAddress === null) {
    return null
  }
  const userRecord = await models.User.findOne({
    where: { walletAddress: authUser.walletAddress }
  })
  if (!userRecord) {
    req.logger.error(
      {
        lookupKey: authUser.lookupKey
      },
      `error getting user record from existing user: no user with matching wallet address ${authUser.walletAddress}`
    )
    return null
  }
  if (userRecord.email === undefined || userRecord.email === null) {
    req.logger.error(
      { lookupKey: authUser.lookupKey },
      `error getting user record from existing user: existing user without email association ${JSON.stringify(
        userRecord
      )} ${authUser.lookupKey}`
    )
    return null
  }
  return userRecord.email
}

const associateWalletAddressWithUser = async ({ req, authUser, email }) => {
  const userRecord = await models.User.findOne({
    where: { email }
  })
  if (!userRecord) {
    req.logger.error(
      { email, lookupKey: authUser.lookupKey },
      `error associating wallet address: no user record with email '${email}'`
    )
    return
  }
  const walletAddress = userRecord.walletAddress
  await models.Authentication.update(
    {
      walletAddress
    },
    {
      where: { lookupKey: authUser.lookupKey }
    }
  )
}

module.exports = {
  getWalletAssociatedEmail,
  associateWalletAddressWithUser
}
