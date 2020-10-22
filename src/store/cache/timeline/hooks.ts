import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { useEffect } from 'react'
import { setTimeline } from './slice'
import { Address } from 'types'
import { useDispatchBasedOnBlockNumber } from '../protocol/hooks'

const getFirstEvent = (...events: Array<{ blockNumber: number }>) => {
  let min = Number.MAX_SAFE_INTEGER
  let firstEvent = null
  let index = 0
  for (let i = 0; i < events.length; ++i) {
    const e = events[i]
    if (e && e.blockNumber < min) {
      min = e.blockNumber
      firstEvent = e
      index = i
    }
  }
  return { firstEvent, index }
}

const combineEvents = (
  ...eventLists: Array<Array<{ blockNumber: number }>>
) => {
  const combined = []
  let i = 0
  const combinedLength = eventLists.reduce((acc, cur) => acc + cur.length, 0)
  while (i < combinedLength) {
    const heads = eventLists.map(l => l[0])
    const { firstEvent, index } = getFirstEvent(...heads)
    combined.push(firstEvent)
    eventLists[index].shift()
    i += 1
  }
  return combined
}

// -------------------------------- Selectors  --------------------------------

export const getTimeline = (state: AppState, { wallet }: { wallet: Address }) =>
  state.cache.timeline.timelines[wallet]

// -------------------------------- Thunk Actions  --------------------------------

export function fetchTimeline(
  wallet: Address
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, getState, aud) => {
    const events = await Promise.all([
      aud.Governance.getVotesByAddress([wallet]),
      aud.Governance.getVoteUpdatesByAddress([wallet]),
      aud.Governance.getProposalsForAddresses([wallet]),
      aud.Delegate.getIncreaseDelegateStakeEvents(wallet),
      aud.Delegate.getDecreaseDelegateStakeEvents(wallet),
      aud.Delegate.getClaimEvents(wallet)
    ])

    const timeline = combineEvents(...events).reverse()
    dispatch(setTimeline({ wallet, timeline }))
  }
}

// -------------------------------- Hooks  --------------------------------

export const useTimeline = (wallet: Address) => {
  const timeline = useSelector(state =>
    getTimeline(state as AppState, { wallet })
  )
  // const ethBlockNumber = useEthBlockNumber()
  const dispatch = useDispatch()

  useEffect(() => {
    if (!timeline) {
      dispatch(fetchTimeline(wallet))
    }
  }, [dispatch, wallet, timeline])

  useDispatchBasedOnBlockNumber([fetchTimeline(wallet)], 5)

  return { timeline }
}
