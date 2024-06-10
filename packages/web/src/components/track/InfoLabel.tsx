import { ReactElement } from 'react'

import { Text } from '@audius/harmony'

type InfoLabelProps = {
  labelName: string
  labelValue: string | ReactElement
}

export const InfoLabel = (props: InfoLabelProps) => {
  const { labelName, labelValue } = props

  return (
    <Text>
      <Text variant='label' color='subdued' tag='span'>
        {labelName}
      </Text>{' '}
      <Text variant='body' size='s' strength='strong'>
        {labelValue}
      </Text>
    </Text>
  )
}
