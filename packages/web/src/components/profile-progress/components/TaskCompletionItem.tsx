import { IconValidationCheck } from '@audius/harmony'
import cn from 'classnames'

import styles from './TaskCompletionItem.module.css'
import { CompletionStage } from './types'

type CompletionIconProps = {
  isCompleted: boolean
}

const CompletionIcon = ({ isCompleted }: CompletionIconProps) => {
  return (
    <div className={styles.iconWrapper}>
      {isCompleted ? (
        <IconValidationCheck className={styles.checkMark} />
      ) : (
        <div className={styles.incompleteCircle} />
      )}
    </div>
  )
}

/**
 * `TaskCompletionItem` represents a single item in a `TaskCompletionList`
 */
export const TaskCompletionItem = ({ title, isCompleted }: CompletionStage) => (
  <div className={styles.taskCompletionItem}>
    <CompletionIcon isCompleted={isCompleted} />
    <span className={cn({ [styles.completedItem]: isCompleted })}>{title}</span>
  </div>
)
