import type { AudiusLibs } from '../AudiusLibs'

/**
 * Sanity check for whether a user needs a recovery email to be sent.
 * Users with accounts created before email recovery existed need
 * to be sent an email on their next log-in just in case they get logged
 * out of their account.
 */
export const needsRecoveryEmail = async (libs: AudiusLibs) => {
  console.debug('Sanity Check - needsRecoveryEmail')
  const user = libs.userStateManager?.getCurrentUser()
  if (!user || !user.wallet) return

  const events = await libs.identityService?.getUserEvents(user.wallet)
  if (events?.needsRecoveryEmail) {
    console.debug('Sanity Check - needsRecoveryEmail - Sending Email')
    // Send email
    await libs.Account?.generateRecoveryLink()
  }
}
