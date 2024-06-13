import { PropsWithChildren } from 'react'

import { Text } from '@audius/harmony'

type MetadataLabelProps = PropsWithChildren<{
  label: string
}>

export const MetadataLabel = (props: MetadataLabelProps) => {
  const { label, children } = props

  return (
    <Text>
      <Text variant='label' color='subdued' tag='span'>
        {label}
      </Text>{' '}
      <Text variant='body' size='s' strength='strong'>
        {children}
      </Text>
    </Text>
  )
}
