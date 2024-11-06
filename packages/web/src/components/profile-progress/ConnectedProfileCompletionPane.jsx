import { useState, useEffect } from 'react'

import {
  accountSelectors,
  challengesSelectors,
  musicConfettiActions
} from '@audius/common/store'
import { connect, useDispatch } from 'react-redux'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { animated } from 'react-spring'

import ProfileCompletionPanel from 'components/profile-progress/components/ProfileCompletionPanel'

import ProfileCompletionTooltip from './components/ProfileCompletionTooltip'
import { useProfileCompletionDismissal, useSlideDown } from './hooks'
const { getOrderedCompletionStages, getIsAccountLoaded } = challengesSelectors
const { getHasAccount } = accountSelectors
const { show: showMusicConfetti } = musicConfettiActions

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
  const dispatch = useDispatch()
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
      showMusicConfetti()
    }
  }, [didCompleteThisSession, dispatch])

  const transitions = useSlideDown(!isHidden, ORIGINAL_HEIGHT_PIXELS, true)

  return (
    <>
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

const mapStateToProps = (state) => ({
  completionStages: getOrderedCompletionStages(state),
  isAccountLoaded: getIsAccountLoaded(state),
  isLoggedIn: getHasAccount(state)
})

export default connect(mapStateToProps)(ConnectedProfileCompletionPanel)
