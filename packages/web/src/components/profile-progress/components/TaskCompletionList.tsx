import { Flex, useTheme } from '@audius/harmony'

import { TaskCompletionItem } from './TaskCompletionItem'
import { CompletionStages } from './types'

const sortIncompleteFirst = (list: CompletionStages) => {
  const incomplete = list.filter((e) => !e.isCompleted)
  const complete = list.filter((e) => e.isCompleted)
  return incomplete.concat(complete)
}

type TaskCompletionListProps = {
  completionStages: CompletionStages
}

/**
 * `TaskCompletionList` renders a list of `TaskCompletionItems`.
 * It's used to power the lists inside of `ProfileCompletionTooltip`
 * and `ProfileCompletionHeroCard`.
 */
export const TaskCompletionList = ({
  completionStages
}: TaskCompletionListProps) => {
  const { color } = useTheme()

  return (
    <Flex
      direction='column'
      gap='s'
      wrap='wrap'
      css={{
        backgroundColor: color.secondary.s300
      }}
    >
      {sortIncompleteFirst(completionStages).map((e) => (
        <TaskCompletionItem
          title={e.title}
          isCompleted={e.isCompleted}
          key={e.title}
        />
      ))}
    </Flex>
  )
}
