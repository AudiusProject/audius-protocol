import { ReactNode } from 'react'

import Tooltip from 'components/tooltip/Tooltip'

import { getPercentageComplete } from './ProfileCompletionHeroCard'
import styles from './ProfileCompletionTooltip.module.css'
import { TaskCompletionList } from './TaskCompletionList'
import { CompletionStages } from './types'

const makeStrings = (completionPercentage: number) => ({
  completionPercentage: `Profile ${completionPercentage}% Complete`
})

type TooltipContentProps = {
  completionStages: CompletionStages
}

const TooltipContent = ({ completionStages }: TooltipContentProps) => {
  const completionPercentage = getPercentageComplete(completionStages).toFixed()
  const strings = makeStrings(Number(completionPercentage))

  return (
    <div className={styles.content}>
      <div className={styles.header}>{strings.completionPercentage}</div>
      <TaskCompletionList
        className={styles.list}
        completionStages={completionStages}
      />
    </div>
  )
}

type ProfileCompletionTooltipProps = {
  completionStages: CompletionStages
  children: ReactNode
  isDisabled?: boolean
  shouldDismissOnClick?: boolean
}

/**
 * ProfileCompletionTooltip is a hovering tooltip that presents the
 * percentage of profile completion and the list of completion stages.
 */
export const ProfileCompletionTooltip = ({
  completionStages,
  children,
  isDisabled,
  shouldDismissOnClick = false
}: ProfileCompletionTooltipProps) => {
  return (
    <Tooltip
      color='secondary'
      shouldWrapContent={false}
      className={styles.tooltip}
      disabled={isDisabled}
      mouseEnterDelay={0.1}
      shouldDismissOnClick={shouldDismissOnClick}
      text={<TooltipContent completionStages={completionStages} />}
      placement='right'
    >
      {children}
    </Tooltip>
  )
}
