import { Button, Flex, Paper, Text } from '@audius/harmony'

const messages = {
  cardBody: 'Unlock exclusive perks & more.'
}

export const BuyArtistCoinCard = ({ coinTicker }: { coinTicker: string }) => {
  return (
    <Paper direction='column' gap='s' ph='m' pv='s'>
      <Flex gap='s'>
        <Text variant='title' size='l'>
          {coinTicker}
        </Text>
      </Flex>
      <Text variant='body' size='s'>
        {messages.cardBody}
      </Text>
      <Button size='small'> Buy Coins</Button>
    </Paper>
  )
}
