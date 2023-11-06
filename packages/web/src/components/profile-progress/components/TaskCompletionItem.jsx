import cn from 'classnames'
import PropTypes from 'prop-types'

import IconValidationCheck from 'assets/img/iconValidationCheck.svg'

import { CompletionStage } from './PropTypes'
import styles from './TaskCompletionItem.module.css'

const CompletionIcon = ({ isCompleted }) => {
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

CompletionIcon.propTypes = {
  isCompleted: PropTypes.bool.isRequired
}

/**
 * `TaskCompletionItem` represents a single item in a `TaskCompletionList`
 *
 * @param {Object} { title, isCompleted }
 */
const TaskCompletionItem = ({ title, isCompleted }) => (
  <div className={styles.taskCompletionItem}>
    <CompletionIcon isCompleted={isCompleted} />
    <span className={cn({ [styles.completedItem]: isCompleted })}>{title}</span>
  </div>
)

TaskCompletionItem.propTypes = CompletionStage.isRequired

export default TaskCompletionItem
