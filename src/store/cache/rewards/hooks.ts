import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'
import BN from 'bn.js'

import { Address, User, Operator, Status } from 'types'
import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { useEffect } from 'react'

import {
  useFundsPerRound,
  useLastFundedBlock,
  usePendingClaim
} from 'store/cache/claims/hooks'
import { useEthBlockNumber } from 'store/cache/protocol/hooks'
import { useUsers } from 'store/cache/user/hooks'
import { fetchWeeklyRewards, setWeeklyRewards } from 'store/cache/rewards/slice'
import { getRewardForClaimBlock } from './helpers'

// -------------------------------- Selectors  --------------------------------
export const getUserRewards = (wallet: Address) => (state: AppState) =>
  state.cache.rewards.users[wallet]

export const getUserWeeklyRewards = (wallet: Address) => (state: AppState) => {
  const userReward = state.cache.rewards.users[wallet]
  return userReward?.status === Status.Success ? userReward.reward : undefined
}

// -------------------------------- Thunk Actions  --------------------------------

export function fetchRewards({
  wallet,
  fundsPerRound,
  users,
  lastFundedBlock,
  currentBlockNumber,
  hasClaim
}: {
  wallet: Address
  currentBlockNumber: number
  fundsPerRound: BN
  users: (User | Operator)[]
  lastFundedBlock: number
  hasClaim: boolean
}): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    dispatch(fetchWeeklyRewards({ wallet }))
    await aud.awaitSetup()
    try {
      // If there is a pending claim, use the last funded block to estimate the amount
      // the user is about to receive, else use the currentBlockNumber 
      const blockNumber = hasClaim ? lastFundedBlock : currentBlockNumber
      const reward = await getRewardForClaimBlock({
        wallet,
        users,
        fundsPerRound,
        blockNumber,
        aud
      })
      dispatch(setWeeklyRewards({ wallet, reward }))
    } catch (error) {
      // TODO: Handle error case
      console.log(error)
    }
  }
}

// -------------------------------- Hooks  --------------------------------

export const useUserWeeklyRewards = ({ wallet }: { wallet: Address }) => {
  const weeklyRewards = useSelector(getUserRewards(wallet))
  const currentBlockNumber = useEthBlockNumber()
  const { status: fundsStatus, amount: fundsPerRound } = useFundsPerRound()
  const {
    status: lastFundedStatus,
    blockNumber: lastFundedBlock
  } = useLastFundedBlock()
  const { status: usersStatus, users } = useUsers()
  const { status: claimStatus, hasClaim } = usePendingClaim(wallet)

  const dispatch = useDispatch()
  useEffect(() => {
    const hasInfo = [
      fundsStatus,
      usersStatus,
      lastFundedStatus,
      claimStatus
    ].every(status => status === Status.Success)
    if (wallet && hasInfo && currentBlockNumber && !weeklyRewards) {
      dispatch(
        fetchRewards({
          wallet,
          fundsPerRound: fundsPerRound!,
          users,
          lastFundedBlock: lastFundedBlock!,
          currentBlockNumber,
          hasClaim
        })
      )
    }
  }, [
    dispatch,
    wallet,
    weeklyRewards,
    fundsStatus,
    usersStatus,
    lastFundedStatus,
    claimStatus,
    fundsPerRound,
    users,
    currentBlockNumber,
    lastFundedBlock,
    hasClaim
  ])
  if (!weeklyRewards) return { status: Status.Loading }
  return weeklyRewards
}

export const useUserAnnualRewardRate = ({ wallet }: { wallet: Address }) => {
  const weeklyRewards = useUserWeeklyRewards({ wallet })
  if (weeklyRewards.status === Status.Success && 'reward' in weeklyRewards) {
    const amount = weeklyRewards.reward.mul(new BN('52'))
    return { status: Status.Success, reward: amount }
  }
  return { status: Status.Loading }
}
