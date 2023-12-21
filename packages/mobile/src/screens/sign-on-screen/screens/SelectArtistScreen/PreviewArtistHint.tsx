import { useState } from 'react'

import { IconCloseAlt, IconPlay, Paper, Text } from '@audius/harmony-native'

const messages = {
  previewNotice: "Press the artist's photo to preview their music."
}

export const PreviewArtistHint = () => {
  const [isOpen, setIsOpen] = useState(true)

  if (!isOpen) return null

  return (
    <Paper
      backgroundColor='accent'
      mh='l'
      ph='l'
      pv='s'
      mb='xl'
      gap='s'
      alignItems='center'
      justifyContent='space-between'
      direction='row'
    >
      <IconPlay color='staticWhite' size='m' />
      <Text variant='body' color='staticWhite' style={{ flex: 1 }}>
        {messages.previewNotice}
      </Text>
      <IconCloseAlt
        role='button'
        color='staticWhite'
        size='m'
        onPress={() => setIsOpen(false)}
      />
    </Paper>
  )
}
