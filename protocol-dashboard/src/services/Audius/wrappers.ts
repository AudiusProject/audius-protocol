import { Address } from 'types'

import AudiusClient from './AudiusClient'

/**
 * Wrapper functions for libs
 */

/**
 * Get all the service provider addresses that the given wallet delegates to
 * @param this Audius
 * @param delegator Wallet address of the delegator
 * @returns Array of service provider addresses
 */
export async function getUserDelegates(this: AudiusClient, delegator: Address) {
  await this.hasPermissions()
  const delegates = []
  const increaseDelegateStakeEvents =
    await this.Delegate.getIncreaseDelegateStakeEvents({
      delegator
    })
  const pendingUndelegateRequest =
    await this.Delegate.getPendingUndelegateRequest(delegator)
  let serviceProviders = increaseDelegateStakeEvents.map(
    (e) => e.serviceProvider
  )
  // @ts-ignore
  serviceProviders = [...new Set(serviceProviders)]
  for (const sp of serviceProviders) {
    const delegators = await this.Delegate.getDelegatorsList(sp)
    if (delegators.includes(delegator)) {
      const amountDelegated =
        await this.Delegate.getDelegatorStakeForServiceProvider(delegator, sp)
      let activeAmount = amountDelegated

      if (
        pendingUndelegateRequest.lockupExpiryBlock !== 0 &&
        pendingUndelegateRequest.target === sp
      ) {
        activeAmount = activeAmount.sub(pendingUndelegateRequest.amount)
      }

      delegates.push({
        wallet: sp,
        amount: amountDelegated,
        activeAmount
      })
    }
  }
  return [...delegates]
}
