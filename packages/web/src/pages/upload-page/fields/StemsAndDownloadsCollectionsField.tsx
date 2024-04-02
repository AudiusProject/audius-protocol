import { Flex, Switch, Text, useTheme } from '@audius/harmony'
import { Tile } from 'components/tile'
import { useField } from 'formik'
import { useState } from 'react'

const messages = {
  title: 'Full Track Download',
  description: 'Allow your fans to download a lossless copy of each track.'
}

export const StemsAndDownloadsCollectionField = () => {
  const { spacing } = useTheme()
  const [field, , { setValue }] = useField('are_tracks_downloadable')

  return (
    <Tile
      elevation='flat'
      onClick={() => {
        setValue(!field.value)
      }}
      css={{ padding: `${spacing.l}px ${spacing.unit6}px`, cursor: 'pointer' }}
    >
      <Flex justifyContent='space-between' w='100%'>
        <Flex gap='s' direction='column' alignItems='flex-start'>
          <Text variant='title' size='l'>
            {messages.title}
          </Text>
          <Text variant='body' textAlign='left'>
            {messages.description}
          </Text>
        </Flex>
        <Switch {...field} checked={field.value} />
      </Flex>
    </Tile>
  )
}
