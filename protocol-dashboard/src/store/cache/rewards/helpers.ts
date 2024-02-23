import BN from 'bn.js'

import AudiusClient from 'services/Audius'
import { User, Operator, Address } from 'types'

const DEPLOYER_CUT_BASE = new BN('100')

// Get the operator's active stake = total staked - pending decrease stake + total delegated to operator - operator's delegators' pending decrease stake
export const getOperatorTotalActiveStake = (user: Operator) => {
  const userActiveStake = user.serviceProvider.deployerStake.sub(
    user.pendingDecreaseStakeRequest?.amount ?? new BN('0')
  )
  const userActiveDelegated = user.delegators.reduce((total, delegator) => {
    return total.add(delegator.activeAmount)
  }, new BN('0'))
  const totalActiveStake = userActiveStake.add(userActiveDelegated)
  return totalActiveStake
}

// Get the amount locked - pending decrease stake, and the operator's delegator's pending decrease delegation
export const getOperatorTotalLocked = (user: Operator) => {
  const lockedPendingDecrease =
    (user as Operator).pendingDecreaseStakeRequest?.amount ?? new BN('0')
  // Another way to get the locked delegation value from contract read
  // const lockedDelegation await aud.Delegate.getTotalLockedDelegationForServiceProvider(user.wallet)
  const lockedDelegation = user.delegators.reduce((totalLocked, delegate) => {
    return totalLocked.add(delegate.amount.sub(delegate.activeAmount))
  }, new BN('0'))
  const totalLocked = lockedPendingDecrease.add(lockedDelegation)
  return totalLocked
}

/**
 * Calculates the net minted amount for a service operator prior to
 * distribution among the service provider and their delegators
 * Reference processClaim in the claims manager contract
 * NOTE: minted amount is calculated using values at the init claim block
 * @param {AudiusClient} aud Instance of the audius client
 * @param {string} wallet The service operator's wallet address
 * @param {BN} totalLocked The total token currently locked (decrease stake and delegation)
 * @param {number} blockNumber The blocknumber of the claim to process
 * @param {BN} fundingAmount The amount of total funds allocated per claim round
 * @returns {BN} The net minted amount
 */
export const getMintedAmountAtBlock = async ({
  aud,
  wallet,
  totalLocked,
  blockNumber,
  fundingAmount
}: {
  aud: AudiusClient
  wallet: Address
  fundingAmount: BN
  totalLocked: BN
  blockNumber: number
}) => {
  const totalStakedAtFundBlockForClaimer = await aud.Staking.totalStakedForAt(
    wallet,
    blockNumber
  )
  const totalStakedAtFundBlock = await aud.Staking.totalStakedAt(blockNumber)
  const activeStake = totalStakedAtFundBlockForClaimer.sub(totalLocked)
  const rewardsForClaimer = activeStake
    .mul(fundingAmount)
    .div(totalStakedAtFundBlock)
  return rewardsForClaimer
}

export const getOperatorRewards = ({
  user,
  totalRewards,
  deployerCutBase = DEPLOYER_CUT_BASE
}: {
  user: Operator
  totalRewards: BN
  deployerCutBase?: BN
}) => {
  const totalActiveStake = getOperatorTotalActiveStake(user)
  const deployerCut = new BN(user.serviceProvider.deployerCut)

  const totalDelegatedRewards = user.delegators.reduce((total, delegate) => {
    const delegateRewards = getDelegateRewards({
      delegateAmount: delegate.activeAmount,
      totalRoundRewards: totalRewards,
      totalActive: totalActiveStake,
      deployerCut,
      deployerCutBase
    })
    return total.add(delegateRewards.delegatorCut)
  }, new BN('0'))

  const operatorRewards = totalRewards.sub(totalDelegatedRewards)
  return operatorRewards
}

export const getDelegateRewards = ({
  delegateAmount,
  totalRoundRewards,
  totalActive,
  deployerCut,
  deployerCutBase = DEPLOYER_CUT_BASE
}: {
  delegateAmount: BN
  totalRoundRewards: BN
  totalActive: BN
  deployerCut: BN
  deployerCutBase?: BN
}) => {
  const rewardsPriorToSPCut = delegateAmount
    .mul(totalRoundRewards)
    .div(totalActive)
  const spDeployerCut = delegateAmount
    .mul(totalRoundRewards)
    .mul(deployerCut)
    .div(totalActive)
    .div(deployerCutBase)
  return {
    spCut: spDeployerCut,
    delegatorCut: rewardsPriorToSPCut.sub(spDeployerCut)
  }
}

/**
 * Calculates the total rewards for a user from a claim given a blocknumber
 * @param {string} wallet The user's wallet address
 * @param {Object} users An object of all user wallets to their User details
 * @param {BN} fundsPerRound The amount of rewards given out in a round
 * @param {number} blockNumber The block number to process the claim event for
 * @param {AudiusClient} aud Instance of the audius client for contract reads
 * @returns {BN} expected rewards for the user at the claim block
 */
export const getRewardForClaimBlock = async ({
  wallet,
  users,
  fundsPerRound,
  blockNumber,
  aud
}: {
  wallet: Address
  users: (User | Operator)[]
  fundsPerRound: BN
  blockNumber: number
  aud: AudiusClient
}) => {
  const user = users.find((u) => u.wallet === wallet)
  let totalRewards = new BN('0')

  // If the user is a service provider, retrieve their expected rewards for staking
  if ('serviceProvider' in user!) {
    const lockedPendingDecrease =
      (user as Operator).pendingDecreaseStakeRequest?.amount ?? new BN('0')
    const lockedDelegation =
      await aud.Delegate.getTotalLockedDelegationForServiceProvider(wallet)
    const totalLocked = lockedPendingDecrease.add(lockedDelegation)
    const mintedRewards = await getMintedAmountAtBlock({
      aud,
      totalLocked,
      fundingAmount: fundsPerRound,
      wallet,
      blockNumber
    })
    const operatorRewards = getOperatorRewards({
      user: user as Operator,
      totalRewards: mintedRewards
    })
    totalRewards = totalRewards.add(operatorRewards)
  }

  // For each service operator the user delegates to, calculate the expected rewards for delegating
  for (const delegate of (user as User).delegates) {
    const operator = users.find((u) => u.wallet === delegate.wallet) as Operator
    const deployerCut = new BN(operator.serviceProvider.deployerCut.toString())
    const operatorActiveStake = getOperatorTotalActiveStake(operator)
    const operatorTotalLocked = getOperatorTotalLocked(operator)
    const userMintedRewards = await getMintedAmountAtBlock({
      aud,
      totalLocked: operatorTotalLocked,
      fundingAmount: fundsPerRound,
      wallet: delegate.wallet,
      blockNumber
    })
    const delegateRewards = getDelegateRewards({
      delegateAmount: delegate.activeAmount,
      totalRoundRewards: userMintedRewards,
      totalActive: operatorActiveStake,
      deployerCut
    })
    totalRewards = totalRewards.add(delegateRewards.delegatorCut)
  }
  return totalRewards
}
