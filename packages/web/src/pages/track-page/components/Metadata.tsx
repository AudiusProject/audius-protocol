import { ReactNode } from 'react'

import { Text } from '@audius/harmony/src/components/text'

type MetadataProps = {
  attribute: string
  value: ReactNode
}
export const Metadata = (props: MetadataProps) => {
  const { attribute, value } = props
  return (
    <Text>
      <Text variant='label' color='subdued' strength='default'>
        {attribute}
      </Text>{' '}
      <Text variant='body' strength='strong' css={{ lineHeight: '16px' }}>
        {value}
      </Text>
    </Text>
  )
}
