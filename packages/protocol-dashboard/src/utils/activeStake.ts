import BN from 'bn.js'

import { Operator, User } from 'types'

/**
 * Calculates and returns active stake for address
 *
 * Active stake = (active deployer stake + active delegator stake)
 *      active deployer stake = (direct deployer stake - locked deployer stake)
 *          locked deployer stake = amount of pending decreaseStakeRequest for address
 *      active delegator stake = (total delegator stake - locked delegator stake)
 *          locked delegator stake = amount of pending undelegateRequest for address
 */

export const getActiveStake = (user: User | Operator) => {
  let activeDeployerStake: BN = new BN('0')
  let activeDelegatorStake: BN = new BN('0')
  if ('serviceProvider' in user) {
    const { deployerStake } = user.serviceProvider
    const { amount: pendingDecreaseStakeAmount, lockupExpiryBlock } =
      user.pendingDecreaseStakeRequest
    if (lockupExpiryBlock !== 0) {
      activeDeployerStake = deployerStake.sub(pendingDecreaseStakeAmount)
    } else {
      activeDeployerStake = deployerStake
    }
  }

  if (user.pendingUndelegateRequest.lockupExpiryBlock !== 0) {
    activeDelegatorStake = user.totalDelegatorStake.sub(
      user.pendingUndelegateRequest.amount
    )
  } else {
    activeDelegatorStake = user.totalDelegatorStake
  }
  return activeDelegatorStake.add(activeDeployerStake)
}

export const getTotalActiveDelegatedStake = (user: User | Operator) => {
  let total: BN = new BN('0')
  if ('delegators' in user) {
    for (const delegator of user.delegators) {
      total = total.add(delegator.activeAmount)
    }
  }
  return total
}

export default getActiveStake
