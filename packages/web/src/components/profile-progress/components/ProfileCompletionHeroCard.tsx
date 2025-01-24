import { challengesSelectors, profilePageActions } from '@audius/common/store'
import { Flex, Text, useTheme } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { useSpring, animated } from 'react-spring'

import { SegmentedProgressBar } from 'components/segmented-progress-bar/SegmentedProgressBar'

import { useProfileCompletionDismissal, useVerticalCollapse } from '../hooks'

import styles from './ProfileCompletionHeroCard.module.css'
import { TaskCompletionList } from './TaskCompletionList'

const { profileMeterDismissed } = profilePageActions
const {
  getOrderedCompletionStages,
  getProfilePageMeterDismissed,
  getIsAccountLoaded
} = challengesSelectors

const messages = {
  complete: 'Profile Complete'
}

const ORIGINAL_HEIGHT_PIXELS = 206
const CARD_HEIGHT_PIXELS = 182

interface CompletionStage {
  isCompleted: boolean
  title: string
}

const getStepsCompleted = (completionStages: CompletionStage[]): number =>
  completionStages.reduce((acc, cur) => (cur.isCompleted ? acc + 1 : acc), 0)

export const getPercentageComplete = (
  completionStages: CompletionStage[]
): number => {
  const stepsCompleted = getStepsCompleted(completionStages)
  return (stepsCompleted / completionStages.length) * 100
}

/**
 * ProfileCompletionHeroCard is the hero card that shows the profile completion percentage,
 * the progress meter, and the list of completed stages. It handles its own state management
 * and animations.
 */
export const ProfileCompletionHeroCard = () => {
  const dispatch = useDispatch()

  const isAccountLoaded = useSelector(getIsAccountLoaded)
  const completionStages = useSelector(getOrderedCompletionStages)
  const isDismissed = useSelector(getProfilePageMeterDismissed)
  const { color } = useTheme()

  const onDismiss = () => dispatch(profileMeterDismissed())

  const { isHidden, shouldNeverShow } = useProfileCompletionDismissal({
    onDismiss,
    isAccountLoaded,
    completionStages,
    isDismissed
  })

  const transitions = useVerticalCollapse(!isHidden, ORIGINAL_HEIGHT_PIXELS)

  const stepsCompleted = getStepsCompleted(completionStages)
  const percentageCompleted = getPercentageComplete(completionStages)
  const { animatedPercentage } = useSpring({
    animatedPercentage: percentageCompleted,
    from: { animatedPercentage: 0 }
  })

  if (shouldNeverShow) return null

  return (
    <>
      {transitions.map(({ item, key, props }) =>
        item ? (
          <animated.div style={props} key={key}>
            <div className={styles.container}>
              <div className={styles.leftContainer}>
                <div className={styles.completionTextPercentage}>
                  <animated.span>
                    {animatedPercentage.interpolate((v: unknown) =>
                      (v as number).toFixed()
                    )}
                  </animated.span>
                  %
                </div>
                <Flex p='m'>
                  <Text variant='title' size='m'>
                    {messages.complete}
                  </Text>
                </Flex>
                <SegmentedProgressBar
                  numSteps={completionStages.length}
                  stepsComplete={stepsCompleted}
                />
              </div>
              <Flex
                p='l'
                h={CARD_HEIGHT_PIXELS}
                css={{ backgroundColor: color.secondary.s300 }}
              >
                <TaskCompletionList completionStages={completionStages} />
              </Flex>
              <button className={styles.dismissButton} onClick={onDismiss}>
                Dismiss
              </button>
            </div>
          </animated.div>
        ) : null
      )}
    </>
  )
}
