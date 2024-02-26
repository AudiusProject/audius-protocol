import { Button, IconCart, Flex, Text } from '@audius/harmony'

export type NoTransactionsContentProps = {
  headerText: string
  bodyText: string
  ctaText: string
  onCTAClicked: () => void
}

export const NoTransactionsContent = ({
  headerText,
  bodyText,
  ctaText,
  onCTAClicked
}: NoTransactionsContentProps) => {
  return (
    <Flex
      alignItems='center'
      gap='2xl'
      justifyContent='center'
      p='unit10'
      direction='column'
    >
      <Flex
        alignItems='center'
        gap='s'
        justifyContent='center'
        direction='column'
      >
        <IconCart color='subdued' size='3xl' />
        <Text variant='heading' size='s'>
          {headerText}
        </Text>
        <Text variant='body' size='l'>
          {bodyText}
        </Text>
      </Flex>
      <Button variant='secondary' size='small' onClick={onCTAClicked}>
        {ctaText}
      </Button>
    </Flex>
  )
}
