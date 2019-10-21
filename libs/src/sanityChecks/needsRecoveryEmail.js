/** Sanity check for whether a user needs a recovery email to be sent. */
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
