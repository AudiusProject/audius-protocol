import cn from 'classnames'

import { TaskCompletionItem } from './TaskCompletionItem'
import styles from './TaskCompletionList.module.css'
import { CompletionStages } from './types'

const sortIncompleteFirst = (list: CompletionStages) => {
  const incomplete = list.filter((e) => !e.isCompleted)
  const complete = list.filter((e) => e.isCompleted)
  return incomplete.concat(complete)
}

type TaskCompletionListProps = {
  completionStages: CompletionStages
  className?: string
}

/**
 * `TaskCompletionList` renders a list of `TaskCompletionItems`.
 * It's used to power the lists inside of `ProfileCompletionTooltip`
 * and `ProfileCompletionHeroCard`.
 */
export const TaskCompletionList = ({
  completionStages,
  className
}: TaskCompletionListProps) => (
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
