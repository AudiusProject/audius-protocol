import { useState, useEffect } from 'react'

import { Name } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { useDispatch } from 'react-redux'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useTransition } from 'react-spring'

import { make } from 'common/store/analytics/actions'
import { useSelector } from 'utils/reducer'

const { getIsAccountComplete } = accountSelectors

const COMPLETION_DISMISSAL_DELAY_MSEC = 3 * 1000

interface CompletionStage {
  isCompleted: boolean
}

const getIsComplete = (completionStages: CompletionStage[]): boolean =>
  completionStages.every((cur) => cur.isCompleted)

interface ProfileCompletionDismissalProps {
  onDismiss: () => void
  isAccountLoaded: boolean
  completionStages: CompletionStage[]
  isDismissed: boolean
}

interface ProfileCompletionDismissalResult {
  isHidden: boolean
  shouldNeverShow: boolean
  didCompleteThisSession: boolean
}

/**
 * useProfileCompletionDismissal encapsulates the logic about whether a profile
 * progress meter should be visible.
 *
 * @param {Object} args { onDismiss, isAccountLoaded, completionStages, isDismissed }
 * @returns {Object} { isHidden, shouldNeverShow, didCompleteThisSession }
 */
export const useProfileCompletionDismissal = ({
  onDismiss,
  isAccountLoaded,
  completionStages,
  isDismissed
}: ProfileCompletionDismissalProps): ProfileCompletionDismissalResult => {
  // Explanation:
  // - We should always be hidden if we load up in a completed state, accounting for the fact that
  //    when we first get props the account may not be yet loaded, causing us to think that the profile isn't completed when
  //    in fact it might be.
  // - We should instantly hide if the user dismisses
  // - If we become complete this session, we should wait a bit, and then hide

  const dispatch = useDispatch()
  const [didCompleteThisSession, setDidCompleteThisSession] = useState(false)
  const isComplete = getIsComplete(completionStages)
  const isAccountComplete = useSelector(getIsAccountComplete)

  // On account load, check if this profile was *ever* incomplete
  const [wasIncomplete, setWasIncomplete] = useState(false)
  useEffect(() => {
    if (isAccountLoaded) {
      setWasIncomplete(!isComplete)
    }
  }, [isAccountLoaded, isComplete])

  const wasAlwaysComplete = isComplete && !wasIncomplete

  // If we *just* completed, we need to
  // hold the thing for a timeout and then dismiss it
  if (
    isAccountLoaded &&
    isComplete &&
    wasIncomplete &&
    !didCompleteThisSession
  ) {
    setDidCompleteThisSession(true)
    setTimeout(() => {
      onDismiss()
    }, COMPLETION_DISMISSAL_DELAY_MSEC)
    dispatch(make(Name.ACCOUNT_HEALTH_METER_FULL, {}))
  }

  const isHidden = !isAccountComplete || wasAlwaysComplete || isDismissed
  // If it was always complete, never show the meter
  const shouldNeverShow = isHidden && wasAlwaysComplete
  return { isHidden, shouldNeverShow, didCompleteThisSession }
}

interface TransitionStyles {
  opacity?: number
  height?: number
  transformOrigin?: string
  [key: string]: any
}

/**
 * useVerticalCollapse applies a vertical collapsing transition when !isVisible
 *
 * @param isVisible - whether the element is visible
 * @param originalHeight - the original height of the element, including margins
 * @returns transition styles
 */
export const useVerticalCollapse = (
  isVisible: boolean,
  originalHeight: number
) => {
  return useTransition<boolean, TransitionStyles>(isVisible, null, {
    from: { opacity: 1, height: originalHeight, transformOrigin: 'top center' },
    enter: {
      opacity: 1,
      height: originalHeight,
      transformOrigin: 'top center'
    },
    leave: { opacity: 0, height: 0, transformOrigin: 'top center' }
  })
}

/**
 * useSlideDown applies a sliding down transition when isVisible
 *
 * @param isVisible - whether the element is visible
 * @param originalHeight - the original height of the element, including margins
 * @returns transition styles
 */
export const useSlideDown = (isVisible: boolean, originalHeight: number) => {
  return useTransition<boolean, TransitionStyles>(isVisible, null, {
    from: { opacity: 1, height: originalHeight, transformOrigin: 'top center' },
    enter: {
      opacity: 1,
      height: originalHeight,
      transformOrigin: 'top center'
    },
    leave: [{ opacity: 0 }, { height: 0 }],
    config: { duration: 100 }
  })
}