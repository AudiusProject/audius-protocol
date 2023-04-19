import { memo } from 'react'

import PropTypes from 'prop-types'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useSpring, animated } from 'react-spring'

import SegmentedProgressBar from 'components/segmented-progress-bar/SegmentedProgressBar'

import styles from './ProfileCompletionPanel.module.css'

const strings = {
  dismissText: 'Dismiss',
  completionText: (percentage) => `Profile ${percentage}% Complete`
}

/**
 * `ProfileCompletionPanel` is a panel, living in the sidebar, presenting
 * a compact `SegmentedProgressBar` and a profile completion percentage.
 *
 * @param {Object} { numSteps, stepsComplete, onDismiss }
 * @returns
 */
const ProfileCompletionPanel = ({ numSteps, stepsComplete, onDismiss }) => {
  const completionPercentage = (stepsComplete / numSteps) * 100
  const { animatedCompletion } = useSpring({
    animatedCompletion: completionPercentage,
    from: { animatedCompletion: 0 }
  })

  return (
    <div className={styles.outerPadding}>
      <div className={styles.container}>
        <animated.div className={styles.completionText}>
          {animatedCompletion.interpolate((v) =>
            strings.completionText(v.toFixed())
          )}
        </animated.div>
        <SegmentedProgressBar
          numSteps={numSteps}
          stepsComplete={stepsComplete}
          isCompact
        />
        <button className={styles.dismissButton} onClick={onDismiss}>
          {strings.dismissText}
        </button>
      </div>
    </div>
  )
}

ProfileCompletionPanel.propTypes = {
  numSteps: PropTypes.number.isRequired,
  stepsComplete: PropTypes.number.isRequired,
  onDismiss: PropTypes.func.isRequired
}

export default memo(ProfileCompletionPanel)
