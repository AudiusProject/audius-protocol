/**
 * Sanity check for whether a user needs a recovery email to be sent.
 * Users with accounts created before email recovery existed need
 * to be sent an email on their next log-in just in case they get logged
 * out of their account.
 */
const needsRecoveryEmail = async (libs) => {
  const user = libs.userStateManager.getCurrentUser()
  if (!user || !user.wallet) return

  const events = await libs.identityService.getUserEvents(user.wallet)
  if (events.needsRecoveryEmail) {
    // Send email
    await libs.Account.generateRecoveryLink()
  }
}

module.exports = needsRecoveryEmail
