import { searchCatalogTileMessages } from '@audius/common/messages'

import { IconSearch, Paper, Text } from '@audius/harmony-native'

const messages = {
  ...searchCatalogTileMessages,
  noResults: 'No Results'
}

export const NoResultsTile = () => {
  return (
    <Paper
      pv='2xl'
      ph='l'
      mv='s'
      mh='m'
      direction='column'
      gap='s'
      alignItems='center'
      shadow='flat'
      backgroundColor='surface1'
      border='default'
    >
      <IconSearch color='default' size='l' />
      <Text variant='title' size='l'>
        {messages.noResults}
      </Text>
      <Text variant='body' size='m' textAlign='center'>
        {messages.description}
      </Text>
    </Paper>
  )
}
