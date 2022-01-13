import React from 'react'

import PropTypes from 'prop-types'
import { useSpring, animated } from 'react-spring'

import SegmentedProgressBar from 'components/segmented-progress-bar/SegmentedProgressBar'

import styles from './ProfileCompletionHeroCard.module.css'
import { CompletionStageArray } from './PropTypes'
import TaskCompletionList from './TaskCompletionList'

const strings = {
  complete: 'PROFILE COMPLETE'
}

/**
 * `ProfileCompletionHeroCard` is the hero card that shows the profile completion percentage,
 * the progress meter, and the list of completed stages.
 *
 * @param {Object} { completionStages, onDismiss }
 * @returns
 */
const ProfileCompletionHeroCard = ({ completionStages, onDismiss }) => {
  const stepsCompleted = getStepsCompleted(completionStages)
  const percentageCompleted = getPercentageComplete(completionStages)
  const { animatedPercentage } = useSpring({
    animatedPercentage: percentageCompleted,
    from: { animatedPercentage: 0 }
  })

  return (
    <div className={styles.container}>
      <div className={styles.leftContainer}>
        <div className={styles.completionTextPercentage}>
          <animated.span>
            {animatedPercentage.interpolate(v => v.toFixed())}
          </animated.span>
          %
        </div>
        <div className={styles.complete}>{strings.complete}</div>
        <SegmentedProgressBar
          numSteps={completionStages.length}
          stepsComplete={stepsCompleted}
        />
      </div>
      <TaskCompletionList
        completionStages={completionStages}
        className={styles.rightContainer}
      />
      <button className={styles.dismissButton} onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  )
}

const getStepsCompleted = completionStages =>
  completionStages.reduce((acc, cur) => (cur.isCompleted ? acc + 1 : acc), 0)

export const getPercentageComplete = completionStages => {
  const stepsCompleted = getStepsCompleted(completionStages)
  return (stepsCompleted / completionStages.length) * 100
}

ProfileCompletionHeroCard.propTypes = {
  completionStages: CompletionStageArray.isRequired,
  onDismiss: PropTypes.func.isRequired
}

export default React.memo(ProfileCompletionHeroCard)
