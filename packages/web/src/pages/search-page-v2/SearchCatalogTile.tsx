import { searchCatalogTileMessages as messages } from '@audius/common/messages'
import { IconSearch, Paper, Text } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

export const SearchCatalogTile = () => {
  const isMobile = useIsMobile()
  return (
    <Paper
      pv={isMobile ? '2xl' : '3xl'}
      ph={isMobile ? 'l' : '3xl'}
      mv={isMobile ? 'm' : 's'}
      mh={isMobile ? 'm' : 'xl'}
      direction='column'
      gap={isMobile ? 's' : 'l'}
      alignItems='center'
      w={isMobile ? 'auto' : '100%'}
      border='default'
      backgroundColor={isMobile ? 'surface1' : 'white'}
    >
      <IconSearch color='default' size={isMobile ? 'l' : '2xl'} />
      <Text
        variant={isMobile ? 'title' : 'heading'}
        size={isMobile ? 'l' : 'm'}
      >
        {messages.cta}
      </Text>
      <Text variant='body' size={isMobile ? 'm' : 'l'}>
        {messages.description}
      </Text>
    </Paper>
  )
}
