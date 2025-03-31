import { IconSearch, Paper, Text } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

const messages = {
  noResults: 'No Results',
  description:
    'Apply filters or search to discover tracks, profile, playlists, and albums.'
}

export const NoResultsTile = () => {
  const isMobile = useIsMobile()
  return (
    <Paper
      pv={isMobile ? '2xl' : '3xl'}
      ph={isMobile ? 'l' : '3xl'}
      mv={isMobile ? 'm' : 's'}
      mh={isMobile ? 'm' : undefined}
      direction='column'
      gap={isMobile ? 's' : 'l'}
      alignItems='center'
      w={isMobile ? 'auto' : '100%'}
    >
      <IconSearch color='default' size={isMobile ? 'l' : '2xl'} />
      <Text
        variant={isMobile ? 'title' : 'heading'}
        size={isMobile ? 'l' : 'm'}
      >
        {messages.noResults}
      </Text>
      <Text variant='body' size={isMobile ? 'm' : 'l'}>
        {messages.description}
      </Text>
    </Paper>
  )
}
