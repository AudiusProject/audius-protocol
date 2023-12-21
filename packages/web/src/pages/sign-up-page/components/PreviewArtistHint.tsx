import { useState } from 'react'

import { IconCloseAlt, IconPlay, Paper, Text } from '@audius/harmony'

const messages = {
  previewNotice: "Click the artist's photo to preview their music."
}

export const PreviewArtistHint = () => {
  const [isOpen, setIsOpen] = useState(true)

  // TODO: add transition
  if (!isOpen) return null

  return (
    <Paper
      backgroundColor='accent'
      ph='l'
      pv='s'
      mb='l'
      gap='s'
      alignItems='center'
      justifyContent='space-between'
    >
      <IconPlay color='staticWhite' size='m' />
      <Text variant='body' color='staticWhite'>
        {messages.previewNotice}
      </Text>
      <IconCloseAlt
        role='button'
        color='staticWhite'
        size='m'
        onClick={() => setIsOpen(false)}
      />
    </Paper>
  )
}
