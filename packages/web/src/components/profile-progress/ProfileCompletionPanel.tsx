import { useEffect, useState } from 'react'

import {
  accountSelectors,
  challengesSelectors,
  musicConfettiActions
} from '@audius/common/store'
import { Flex } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useSpring, animated } from 'react-spring'

import SegmentedProgressBar from 'components/segmented-progress-bar/SegmentedProgressBar'

import styles from './ProfileCompletionPanel.module.css'
import ProfileCompletionTooltip from './components/ProfileCompletionTooltip'
import { useProfileCompletionDismissal, useSlideDown } from './hooks'

const { getOrderedCompletionStages, getIsAccountLoaded } = challengesSelectors
const { getHasAccount } = accountSelectors
const { show: showMusicConfetti } = musicConfettiActions

const ORIGINAL_HEIGHT_PIXELS = 118

const strings = {
  dismissText: 'Dismiss',
  completionText: (percentage: number) => `Profile ${percentage}% Complete`
}

/**
 * ProfileCompletionPanel is a panel that lives in the sidebar, presenting
 * a compact SegmentedProgressBar and profile completion percentage.
 * It handles its own state management and animations.
 */
export const ProfileCompletionPanel = () => {
  const dispatch = useDispatch()
  const completionStages = useSelector(getOrderedCompletionStages)
  const isAccountLoaded = useSelector(getIsAccountLoaded)
  const isLoggedIn = useSelector(getHasAccount)

  const [isDismissed, setIsDismissed] = useState(false)
  const [isTooltipDisabled, setIsTooltipDisabled] = useState(false)

  const onDismiss = () => {
    // disable the tooltip before we dismiss,
    // otherwise it gets scaled in the dismiss animation
    // and looks super jenk
    setIsTooltipDisabled(true)
    setTimeout(() => {
      setIsDismissed(true)
    }, 200)
  }

  const { isHidden, didCompleteThisSession, shouldNeverShow } =
    useProfileCompletionDismissal({
      onDismiss,
      isAccountLoaded,
      completionStages,
      isDismissed
    })

  useEffect(() => {
    if (didCompleteThisSession) {
      dispatch(showMusicConfetti())
    }
  }, [didCompleteThisSession, dispatch])

  const transitions = useSlideDown(!isHidden, ORIGINAL_HEIGHT_PIXELS, true)

  const { animatedCompletion } = useSpring({
    animatedCompletion: completionPercentage,
    from: { animatedCompletion: 0 }
  })

  if (!isLoggedIn || shouldNeverShow) return null

  const stepsComplete = completionStages.reduce(
    (acc, cur) => acc + (cur.isCompleted ? 1 : 0),
    0
  )
  const numSteps = completionStages.length
  const completionPercentage = (stepsComplete / numSteps) * 100

  return (
    <Flex justifyContent='center'>
      {transitions.map(({ item, key, props }) =>
        item ? (
          <animated.div style={props} key={key}>
            <ProfileCompletionTooltip
              completionStages={completionStages}
              isDisabled={isTooltipDisabled}
              shouldDismissOnClick={false}
            >
              <div>
                <div className={styles.outerPadding}>
                  <div className={styles.container}>
                    <animated.div className={styles.completionText}>
                      {animatedCompletion.interpolate((v: number) =>
                        strings.completionText(Math.round(v))
                      )}
                    </animated.div>
                    <SegmentedProgressBar
                      numSteps={numSteps}
                      stepsComplete={stepsComplete}
                      isCompact
                    />
                    <button
                      className={styles.dismissButton}
                      onClick={onDismiss}
                    >
                      {strings.dismissText}
                    </button>
                  </div>
                </div>
              </div>
            </ProfileCompletionTooltip>
          </animated.div>
        ) : null
      )}
    </Flex>
  )
}
