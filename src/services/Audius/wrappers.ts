import AudiusClient from './AudiusClient'
import { Address } from 'types'
import { getUserProfile as get3BoxProfile } from 'services/3box'
import { getRandomDefaultImage } from 'utils/identicon'

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
  const increaseDelegateStakeEvents = await this.Delegate.getIncreaseDelegateStakeEvents(
    delegator
  )
  let serviceProviders = increaseDelegateStakeEvents.map(e => e.serviceProvider)
  // @ts-ignore
  serviceProviders = [...new Set(serviceProviders)]
  for (let sp of serviceProviders) {
    const delegators = await this.Delegate.getDelegatorsList(sp)
    if (delegators.includes(delegator)) {
      const amountDelegated = await this.Delegate.getDelegatorStakeForServiceProvider(
        delegator,
        sp
      )

      const profile = await get3BoxProfile(sp)
      let img = profile.image || getRandomDefaultImage(sp)

      delegates.push({
        wallet: sp,
        amount: amountDelegated,
        img,
        name: profile.name
      })
    }
  }
  return [...delegates]
}
