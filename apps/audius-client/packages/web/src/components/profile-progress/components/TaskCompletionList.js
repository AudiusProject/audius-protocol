import cn from 'classnames'
import PropTypes from 'prop-types'

import { CompletionStageArray } from './PropTypes'
import TaskCompletionItem from './TaskCompletionItem'
import styles from './TaskCompletionList.module.css'

const sortIncompleteFirst = (list) => {
  const incomplete = list.filter((e) => !e.isCompleted)
  const complete = list.filter((e) => e.isCompleted)
  return incomplete.concat(complete)
}

/**
 * `TaskCompletionList` renders a list of `TaskCompletionItems`.
 * It's used to power the lists inside of `ProfileCompletionTooltip`
 * and `ProfileCompletionHeroCard`.
 *
 * @param {Object} { completionStages, className }
 * @returns
 */
const TaskCompletionList = ({ completionStages, className }) => (
  <div className={cn(styles.container, className)}>
    {sortIncompleteFirst(completionStages).map((e) => (
      <TaskCompletionItem
        title={e.title}
        isCompleted={e.isCompleted}
        key={e.title}
      />
    ))}
  </div>
)

TaskCompletionList.propTypes = {
  //  The order of stages in the array is determines the order of stages displayed.
  completionStages: CompletionStageArray.isRequired,
  className: PropTypes.string
}

export default TaskCompletionList
