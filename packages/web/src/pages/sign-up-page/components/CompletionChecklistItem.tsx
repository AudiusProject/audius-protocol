import type { ReactElement } from 'react'

import { CompletionCheck, Flex, Text } from '@audius/harmony'

import { useMedia } from 'hooks/useMedia'

export type CompletionChecklistItemStatus = 'incomplete' | 'complete' | 'error'

type CompletionChecklistItemProps = {
  status: CompletionChecklistItemStatus
  label: string | ReactElement
}

export const CompletionChecklistItem = (
  props: CompletionChecklistItemProps
) => {
  const { status, label } = props
  const { isMobile } = useMedia()

  return (
    <Flex alignItems='center' gap='m'>
      <CompletionCheck value={status} />
      <Text
        variant='body'
        strength='default'
        size={isMobile ? 's' : 'm'}
        color={status === 'error' ? 'danger' : 'default'}
      >
        {label}
      </Text>
    </Flex>
  )
}
