import { useState } from 'react'

import { IconCloseAlt, IconPlay, Paper, Text } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { setHidePreviewHint } from 'common/store/pages/signon/actions'
import { getHidePreviewHint } from 'common/store/pages/signon/selectors'
import { useSelector } from 'utils/reducer'

const messages = {
  previewNotice: "Click the artist's photo to preview their music."
}

export const PreviewArtistHint = () => {
  const [isOpen, setIsOpen] = useState(true)
  const hidePreviewHint = useSelector(getHidePreviewHint)
  const dispatch = useDispatch()

  if (!isOpen || hidePreviewHint) return null

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
        onClick={() => {
          setIsOpen(false)
          dispatch(setHidePreviewHint())
        }}
      />
    </Paper>
  )
}
