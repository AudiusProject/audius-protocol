import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

import { accountSelectors } from '@audius/common/store'

import { useSelector } from 'utils/reducer'

const { getUserHandle, getUserId, getIsAccountComplete } = accountSelectors

const PREVIOUS_ACCOUNT_STATE_KEY = 'previousAccountState'

type AccountTransitionState = {
  userId: number | null
  handle: string | null
  isComplete: boolean
}

/**
 * Reads the previous account state from localStorage
 */
const previousAccountState = (): AccountTransitionState | null => {
  try {
    const savedState = window.localStorage.getItem(PREVIOUS_ACCOUNT_STATE_KEY)
    if (!savedState) return null

    const parsed = JSON.parse(savedState)
    if (!parsed?.userId || !parsed?.handle) return null

    return parsed as AccountTransitionState
  } catch (e) {
    console.error('Error reading previous account state:', e)
    return null
  }
}

/**
 * Persists account state to localStorage
 */
const persistAccountState = (state: AccountTransitionState | null): void => {
  try {
    if (state) {
      window.localStorage.setItem(
        PREVIOUS_ACCOUNT_STATE_KEY,
        JSON.stringify(state)
      )
    } else {
      window.localStorage.removeItem(PREVIOUS_ACCOUNT_STATE_KEY)
    }
  } catch (e) {
    console.error('Error saving/clearing previous account state:', e)
  }
}

/**
 * Hook to manage account transition state.
 * Since account switching triggers a page refresh, this hook primarily manages
 * persisting the previous account state in localStorage to prevent UI flicker
 * during the refresh.
 */
export const useAccountTransition = () => {
  const currentUserId = useSelector(getUserId)
  const currentHandle = useSelector(getUserHandle)
  const isComplete = useSelector(getIsAccountComplete)

  const initialState = useMemo(() => {
    return (
      previousAccountState() ?? {
        userId: currentUserId,
        handle: currentHandle,
        isComplete
      }
    )
  }, [currentHandle, currentUserId, isComplete])

  const [displayState, setDisplayState] =
    useState<AccountTransitionState>(initialState)

  const isInitialMount = useRef(true)
  const saveAccountState = useCallback(persistAccountState, [])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      if (currentUserId && currentHandle) {
        saveAccountState({
          userId: currentUserId,
          handle: currentHandle,
          isComplete
        })
      }
      return
    }

    const newState = {
      userId: currentUserId,
      handle: currentHandle,
      isComplete
    }

    if (currentUserId && currentHandle) {
      setDisplayState(newState)
      saveAccountState(newState)
    } else {
      setDisplayState({ userId: null, handle: null, isComplete: false })
      saveAccountState(null)
    }
  }, [currentUserId, currentHandle, isComplete, saveAccountState])

  const isTransitioning =
    displayState.userId !== currentUserId ||
    displayState.handle !== currentHandle

  return {
    displayUserId: displayState.userId,
    displayHandle: displayState.handle,
    displayIsComplete: displayState.isComplete,
    currentUserId,
    currentHandle,
    isComplete,
    isTransitioning
  }
}
