import { Utils } from '@audius/libs'
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
  let activeDeployerStake = Utils.toBN('0')
  let activeDelegatorStake = Utils.toBN('0')
  if ('serviceProvider' in user) {
    const { deployerStake } = user.serviceProvider
    const {
      amount: pendingDecreaseStakeAmount,
      lockupExpiryBlock
    } = user.pendingDecreaseStakeRequest
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

export default getActiveStake
