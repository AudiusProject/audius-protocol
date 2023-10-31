import type { ReactElement } from 'react'

import { CompletionCheck, Flex, Text } from '@audius/harmony'

export type CompletionChecklistItemStatus = 'incomplete' | 'complete' | 'error'

type CompletionChecklistItemProps = {
  status: CompletionChecklistItemStatus
  label: string | ReactElement
}

export const CompletionChecklistItem = (
  props: CompletionChecklistItemProps
) => {
  return (
    <Flex alignItems='center' gap='m'>
      <CompletionCheck value={props.status} />
      <Text
        variant='body'
        strength='default'
        size='m'
        color={props.status === 'error' ? 'danger' : 'default'}
      >
        {props.label}
      </Text>
    </Flex>
  )
}
