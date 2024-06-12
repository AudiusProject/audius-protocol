import { PropsWithChildren } from 'react'

import { Text } from '@audius/harmony'
import { Mood } from '@audius/sdk'

import { moodMap } from 'utils/Moods'

type InfoLabelProps = PropsWithChildren<{
  label: string
}>

export const InfoLabel = (props: InfoLabelProps) => {
  const { label, children } = props

  return (
    <Text>
      <Text variant='label' color='subdued' tag='span'>
        {label}
      </Text>{' '}
      <Text variant='body' size='s' strength='strong'>
        {label === 'Mood' && (children as Mood) in moodMap
          ? moodMap[children as Mood]
          : children}
      </Text>
    </Text>
  )
}
