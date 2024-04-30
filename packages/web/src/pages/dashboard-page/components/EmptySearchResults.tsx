import { Flex, IconSearch, Text } from '@audius/harmony'

const messages = {
  noResults: 'No results match your search'
}

export const EmptySearchResults = () => {
  return (
    <Flex w='100%' direction='column' alignItems='center' p='unit10' gap='l'>
      <IconSearch size='3xl' color='subdued' />
      <Text variant='heading' size='s'>
        {messages.noResults}
      </Text>
    </Flex>
  )
}
