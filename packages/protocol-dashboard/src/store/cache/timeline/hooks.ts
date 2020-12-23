import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import Audius from 'services/Audius'
import { AppState } from 'store/types'
import { useEffect } from 'react'
import { setTimeline } from './slice'
import { Address } from 'types'
import { useDispatchBasedOnBlockNumber } from '../protocol/hooks'
import { TimelineEvent } from 'models/TimelineEvents'

const getFirstEvent = (...events: TimelineEvent[]) => {
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
  // TS thinks firstEvent can be null because it doesn't
  // understand the algorithm, so cast
  return { firstEvent: firstEvent as TimelineEvent, index }
}

const combineEvents = (...eventLists: TimelineEvent[][]) => {
  const combined: TimelineEvent[] = []
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

export type TimelineType = 'ServiceProvider' | 'Delegator'

export function fetchTimeline(
  wallet: Address,
  timelineType: TimelineType
): ThunkAction<void, AppState, Audius, Action<string>> {
  return async (dispatch, _, aud) => {
    // Some delegation methods allow you to either filter
    // by delegator or service provider
    const filter =
      timelineType === 'Delegator'
        ? { delegator: wallet }
        : { serviceProvider: wallet }

    /* Define the events outside Promise.all because Promise.all TS bindings
     * only supports ten elements
     * https://github.com/microsoft/TypeScript/issues/39788
     */
    const rawEvents: Promise<TimelineEvent[]>[] = [
      aud.Governance.getVoteEventsByAddress([wallet]),
      aud.Governance.getVoteUpdateEventsByAddress([wallet]),
      aud.Governance.getProposalsForAddresses([wallet]),
      aud.Claim.getClaimProcessedEvents(wallet),
      aud.ServiceProviderClient.getRegisteredServiceProviderEvents(wallet),
      aud.ServiceProviderClient.getDeregisteredServiceProviderEvents(wallet),
      aud.ServiceProviderClient.getIncreasedStakeEvents(wallet),
      aud.ServiceProviderClient.getDecreasedStakeRequestedEvents(wallet),
      aud.Delegate.getIncreaseDelegateStakeEvents(filter),
      aud.Delegate.getDecreaseDelegateStakeEvaluatedEvents(filter),
      aud.Delegate.getUndelegateStakeRequestedEvents(filter),
      aud.Delegate.getUndelegateStakeCancelledEvents(filter)
    ]
    const events = await Promise.all(rawEvents)

    const timeline = combineEvents(...events).reverse()
    dispatch(setTimeline({ wallet, timeline }))
  }
}

// -------------------------------- Hooks  --------------------------------

export const useTimeline = (wallet: Address, timelineType: TimelineType) => {
  const timeline = useSelector(state =>
    getTimeline(state as AppState, { wallet })
  )
  // const ethBlockNumber = useEthBlockNumber()
  const dispatch = useDispatch()

  useEffect(() => {
    if (wallet && !timeline) {
      dispatch(fetchTimeline(wallet, timelineType))
    }
  }, [dispatch, wallet, timeline, timelineType])

  useDispatchBasedOnBlockNumber([fetchTimeline(wallet, timelineType)], 5)

  return { timeline }
}
