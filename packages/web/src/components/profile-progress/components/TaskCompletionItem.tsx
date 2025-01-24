import { Flex, IconValidationCheck, Text } from '@audius/harmony'

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
  <Flex alignItems='center' gap='xs'>
    <CompletionIcon isCompleted={isCompleted} />
    <Text
      variant='body'
      size='m'
      color='staticWhite'
      css={{
        textDecoration: isCompleted ? 'line-through' : 'none',
        opacity: isCompleted ? 0.5 : 1
      }}
    >
      {title}
    </Text>
  </Flex>
)
