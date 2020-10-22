import { useSelector, useDispatch } from 'react-redux'
import { ThunkAction } from 'redux-thunk'
import { Action } from 'redux'

import Audius from 'services/Audius'
import { AppState } from 'store/types'
import {
  setTotalStaked,
  setDelgator,
  setServiceTypeInfo,
  setEthBlockNumber,
  setAverageBlockTime
} from './slice'
import { useEffect, useState, useRef } from 'react'
import { ServiceType, Block } from 'types'
import AudiusClient from 'services/Audius'

// -------------------------------- Selectors  --------------------------------
export const getTotalStaked = (state: AppState) =>
  state.cache.protocol.totalStaked
export const getServiceInfo = (state: AppState) => state.cache.protocol.services
export const getEthBlockNumber = (state: AppState) =>
  state.cache.protocol.ethBlockNumber
export const getAverageBlockTime = (state: AppState) =>
  state.cache.protocol.averageBlockTime
export const getDelegatorInfo = (state: AppState) =>
  state.cache.protocol.delegator

// -------------------------------- Thunk Actions  --------------------------------// -------------------------------- Thunk Actions  --------------------------------

// Async function to get
export function fetchProtocolDelegation(): ThunkAction<
  void,
  AppState,
  Audius,
  Action<string>
> {
  return async (dispatch, getState, aud) => {
    const maxDelegators = await aud.Delegate.getMaxDelegators()
    const minDelgationAmount = await aud.Delegate.getMinDelegationAmount()

    dispatch(setDelgator({ maxDelegators, minDelgationAmount }))
  }
}

export function fetchServiceStakeValues(): ThunkAction<
  void,
  AppState,
  Audius,
  Action<string>
> {
  return async (dispatch, getState, aud) => {
    const discoveryProvider = await aud.NodeType.getServiceTypeInfo(
      ServiceType.DiscoveryProvider
    )
    const creatorNode = await aud.NodeType.getServiceTypeInfo(
      ServiceType.CreatorNode
    )

    dispatch(setServiceTypeInfo({ discoveryProvider, creatorNode }))
  }
}

export function fetchTotalStaked(): ThunkAction<
  void,
  AppState,
  Audius,
  Action<string>
> {
  return async (dispatch, getState, aud) => {
    const totalStated = await aud.Staking.totalStaked()
    dispatch(setTotalStaked(totalStated))
  }
}

export function fetchEthBlockNumber(): ThunkAction<
  void,
  AppState,
  Audius,
  Action<string>
> {
  return async (dispatch, getState, aud) => {
    setInterval(async () => {
      const ethBlockNumber = await aud.getEthBlockNumber()
      dispatch(setEthBlockNumber(ethBlockNumber))
    }, 5000)
  }
}

export function fetchAverageBlockTime(): ThunkAction<
  void,
  AppState,
  Audius,
  Action<string>
> {
  return async (dispatch, getState, aud) => {
    const averageBlockTime = await aud.getAverageBlockTime()
    dispatch(setAverageBlockTime(averageBlockTime))
  }
}

// -------------------------------- Hooks  --------------------------------

export const useTotalStaked = () => {
  const totalStaked = useSelector(getTotalStaked)
  const dispatch = useDispatch()
  useEffect(() => {
    if (totalStaked === undefined) dispatch(fetchTotalStaked())
  }, [dispatch, totalStaked])

  return totalStaked
}

export const useServiceInfo = () => {
  const services = useSelector(getServiceInfo)
  const dispatch = useDispatch()
  useEffect(() => {
    if (
      services.discoveryProvider === undefined ||
      services.creatorNode === undefined
    ) {
      dispatch(fetchServiceStakeValues())
    }
  }, [dispatch, services])

  return services
}

export const useProtocolDelegator = () => {
  const delegatorInfo = useSelector(getDelegatorInfo)
  const dispatch = useDispatch()
  useEffect(() => {
    if (
      delegatorInfo.maxDelegators === undefined ||
      delegatorInfo.minDelgationAmount === undefined
    ) {
      dispatch(fetchProtocolDelegation())
    }
  }, [delegatorInfo, dispatch])

  return delegatorInfo
}

export const useEthBlockNumber = () => {
  const blockNumber = useSelector(getEthBlockNumber)
  return blockNumber
}

export const useDispatchBasedOnBlockNumber = (
  actions: ThunkAction<void, AppState, AudiusClient, Action<string>>[],
  mod: number = 10
) => {
  const didMount = useRef(false)
  const ethBlockNumber = useEthBlockNumber()
  const dispatch = useDispatch()
  useEffect(() => {
    if (didMount.current && ethBlockNumber && ethBlockNumber % mod === 0) {
      actions.forEach(action => {
        dispatch(action)
      })
    }
    if (ethBlockNumber) {
      didMount.current = true
    }
    // Intentionally, do not re-run the effect based on changes to actions
    // eslint-disable-next-line
  }, [ethBlockNumber, dispatch, mod, didMount])
}

export const useAverageBlockTime = () => {
  const blockTime = useSelector(getAverageBlockTime)
  return blockTime
}

export const useBlock = (blockNumber: number) => {
  const [block, setBlock] = useState<Block>(null)
  useEffect(() => {
    const fetchBlock = async () => {
      // TODO: Move this window dependency out
      const web3 = window.audiusLibs.ethWeb3Manager.web3
      const b = await web3.eth.getBlock(blockNumber)
      setBlock(b)
    }
    fetchBlock()
  }, [blockNumber, setBlock])

  return block
}

export const useTimeRemaining = (block: number, period: number | null) => {
  const averageBlockTime = useAverageBlockTime()
  const currentBlock = useEthBlockNumber()
  const [timeRemaining, setTimeRemaining] = useState(0)

  const targetBlock = block + (period || 0)

  useEffect(() => {
    if (block && targetBlock && averageBlockTime && currentBlock) {
      if (currentBlock > targetBlock) {
        setTimeRemaining(0)
      } else {
        setTimeRemaining((targetBlock - currentBlock) * averageBlockTime)
      }
    }
  }, [averageBlockTime, currentBlock, block, period, targetBlock])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(timeRemaining => {
        if (timeRemaining === 0) return 0
        if (timeRemaining > 1000) {
          return timeRemaining - 1000
        }
        return timeRemaining
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [setTimeRemaining])

  return { timeRemaining, targetBlock, currentBlock }
}

export const useInit = () => {
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(fetchServiceStakeValues())
    dispatch(fetchProtocolDelegation())
    dispatch(fetchTotalStaked())
    dispatch(fetchEthBlockNumber())
    dispatch(fetchAverageBlockTime())
  }, [dispatch])
}
