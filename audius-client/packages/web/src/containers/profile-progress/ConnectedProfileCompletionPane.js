import React, { useState, useCallback } from 'react'

import { connect } from 'react-redux'
import { animated } from 'react-spring'

import { getAccountUser } from 'common/store/account/selectors'
import MusicConfetti from 'components/background-animations/MusicConfetti'
import ProfileCompletionPanel from 'containers/profile-progress/components/ProfileCompletionPanel'
import {
  getOrderedCompletionStages,
  getIsAccountLoaded
} from 'containers/profile-progress/store/selectors'

import ProfileCompletionTooltip from './components/ProfileCompletionTooltip'
import { useProfileCompletionDismissal, useSlideDown } from './hooks'

const ORIGINAL_HEIGHT_PIXELS = 118

/**
 * ConnectedProfileCompletionPane is the connected ProfileCompletionPane
 * that lives in the navcolumn. It contains additional logic to deal with
 * the tooltip, display confetti when the profile is completed, and dismiss/
 * conditionally render the pane.
 */
const ConnectedProfileCompletionPanel = ({
  completionStages,
  isAccountLoaded,
  isLoggedIn
}) => {
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
  const [confettiIsFinished, setConfettiIsFinished] = useState(false)
  const onConfettiFinished = useCallback(() => {
    setConfettiIsFinished(true)
  }, [])
  const {
    isHidden,
    didCompleteThisSession,
    shouldNeverShow
  } = useProfileCompletionDismissal({
    onDismiss,
    isAccountLoaded,
    completionStages,
    isDismissed
  })

  const transitions = useSlideDown(!isHidden, ORIGINAL_HEIGHT_PIXELS, true)

  return (
    <>
      {didCompleteThisSession && !confettiIsFinished ? (
        <MusicConfetti zIndex={10000} onCompletion={onConfettiFinished} />
      ) : null}
      {!shouldNeverShow && isLoggedIn
        ? transitions.map(({ item, key, props }) =>
            item ? (
              <animated.div style={props} key={key}>
                <ProfileCompletionTooltip
                  completionStages={completionStages}
                  isDisabled={isTooltipDisabled}
                  shouldDismissOnClick={false}
                >
                  <div>
                    <ProfileCompletionPanel
                      numSteps={completionStages.length}
                      stepsComplete={completionStages.reduce(
                        (acc, cur) => acc + (cur.isCompleted ? 1 : 0),
                        0
                      )}
                      onDismiss={onDismiss}
                    />
                  </div>
                </ProfileCompletionTooltip>
              </animated.div>
            ) : null
          )
        : null}
    </>
  )
}

const mapStateToProps = state => ({
  completionStages: getOrderedCompletionStages(state),
  isAccountLoaded: getIsAccountLoaded(state),
  isLoggedIn: !!getAccountUser(state)
})

export default connect(mapStateToProps)(ConnectedProfileCompletionPanel)
