import { setHidePreviewHint } from 'audius-client/src/common/store/pages/signon/actions'
import { getHidePreviewHint } from 'audius-client/src/common/store/pages/signon/selectors'
import { useDispatch, useSelector } from 'react-redux'

import {
  IconButton,
  IconCloseAlt,
  IconPlay,
  Paper,
  Text,
  useTheme
} from '@audius/harmony-native'

const messages = {
  previewNotice: "Press the artist's photo to preview their music."
}

export const PreviewArtistHint = () => {
  const { spacing } = useTheme()
  const hidePreviewHint = useSelector(getHidePreviewHint)
  const dispatch = useDispatch()

  if (hidePreviewHint) return null

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
      <IconButton
        role='button'
        icon={IconCloseAlt}
        hitSlop={spacing.l}
        color='staticWhite'
        size='m'
        onPress={() => dispatch(setHidePreviewHint())}
      />
    </Paper>
  )
}
